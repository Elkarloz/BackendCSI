const { sequelize } = require('../config/sequelize');
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');

// Canonical achievement codes
const ACHIEVEMENT_CODES = {
  LEVEL_COMPLETED: 'LEVEL_COMPLETED',
  PERFECT_LEVEL: 'PERFECT_LEVEL',
  PLANET_COMPLETED: 'PLANET_COMPLETED'
};

async function ensureDefaultAchievements() {
  const defaults = [
    {
      code: ACHIEVEMENT_CODES.LEVEL_COMPLETED,
      name: 'Nivel Completado',
      description: 'Completaste un nivel',
      points: 10
    },
    {
      code: ACHIEVEMENT_CODES.PERFECT_LEVEL,
      name: 'Nivel Perfecto',
      description: 'Completaste todas las preguntas de un nivel correctamente',
      points: 25
    },
    {
      code: ACHIEVEMENT_CODES.PLANET_COMPLETED,
      name: 'Planeta Completado',
      description: 'Completaste todos los niveles de un planeta',
      points: 50
    }
  ];

  for (const def of defaults) {
    // upsert by code
    const [record] = await Achievement.findOrCreate({
      where: { code: def.code },
      defaults: def
    });
    // Optionally update name/description/points if changed
    if (
      record.name !== def.name ||
      record.description !== def.description ||
      record.points !== def.points
    ) {
      await record.update({ name: def.name, description: def.description, points: def.points });
    }
  }
}

async function grantIfNotExists({ userId, code, levelId = null, planetId = null, transaction }) {
  const achievement = await Achievement.findOne({ where: { code }, transaction });
  if (!achievement) return null;

  const existing = await UserAchievement.findOne({
    where: {
      userId,
      achievementId: achievement.id,
      levelId: levelId || null,
      planetId: planetId || null
    },
    transaction
  });
  if (existing) return null;

  const created = await UserAchievement.create({
    userId,
    achievementId: achievement.id,
    levelId: levelId || null,
    planetId: planetId || null,
    awardedAt: new Date()
  }, { transaction });

  return created;
}

async function evaluateAndGrantForLevelProgress({ userId, levelId }) {
  // Use a transaction to keep checks consistent
  const transaction = await sequelize.transaction();
  try {
    await ensureDefaultAchievements();

    // Fetch progress, totals, and planet id
    const [progress] = await sequelize.query(
      'SELECT * FROM student_progress WHERE user_id = ? AND level_id = ? LIMIT 1',
      { replacements: [userId, levelId], type: sequelize.QueryTypes.SELECT, transaction }
    );

    if (!progress) {
      await transaction.commit();
      return { granted: [] };
    }

    const [{ total_level_exercises }] = await sequelize.query(
      'SELECT COUNT(*) as total_level_exercises FROM exercises WHERE level_id = ? AND is_active = 1',
      { replacements: [levelId], type: sequelize.QueryTypes.SELECT, transaction }
    );

    const [{ planet_id: planetId }] = await sequelize.query(
      'SELECT planet_id FROM levels WHERE id = ? LIMIT 1',
      { replacements: [levelId], type: sequelize.QueryTypes.SELECT, transaction }
    );

    const granted = [];

    // totalLevel = total de ejercicios disponibles en el nivel
    const totalLevel = Number(total_level_exercises || 0);
    // answered = ejercicios respondidos por el usuario
    const answered = Number(progress.total_exercises || 0);
    // correct = ejercicios respondidos CORRECTAMENTE
    const correct = Number(progress.completed_exercises || 0);

    // 1) Level completed: cuando ha respondido TODOS los ejercicios del nivel (puede tener errores)
    if (totalLevel > 0 && answered >= totalLevel) {
      const created = await grantIfNotExists({
        userId,
        code: ACHIEVEMENT_CODES.LEVEL_COMPLETED,
        levelId,
        transaction
      });
      if (created) granted.push({ code: ACHIEVEMENT_CODES.LEVEL_COMPLETED, levelId });
    }

    // 2) Perfect level: SOLO cuando ha respondido TODOS Y todos fueron correctos
    // Debe cumplir: answered = totalLevel (respondió todos) Y correct = totalLevel (todos correctos)
    if (totalLevel > 0 && answered >= totalLevel && correct >= totalLevel) {
      const created = await grantIfNotExists({
        userId,
        code: ACHIEVEMENT_CODES.PERFECT_LEVEL,
        levelId,
        transaction
      });
      if (created) granted.push({ code: ACHIEVEMENT_CODES.PERFECT_LEVEL, levelId });
    }

    // 3) Planet completed: all levels in planet are completed by this user
    if (planetId) {
      const [{ total_levels }] = await sequelize.query(
        'SELECT COUNT(*) as total_levels FROM levels WHERE planet_id = ? AND is_active = 1',
        { replacements: [planetId], type: sequelize.QueryTypes.SELECT, transaction }
      );

      const [{ completed_levels }] = await sequelize.query(
        `SELECT COUNT(DISTINCT sp.level_id) as completed_levels
         FROM student_progress sp
         JOIN levels l ON sp.level_id = l.id
         WHERE sp.user_id = ? AND l.planet_id = ? AND sp.is_completed = 1`,
        { replacements: [userId, planetId], type: sequelize.QueryTypes.SELECT, transaction }
      );

      if (Number(total_levels || 0) > 0 && Number(completed_levels || 0) >= Number(total_levels)) {
        const created = await grantIfNotExists({
          userId,
          code: ACHIEVEMENT_CODES.PLANET_COMPLETED,
          planetId,
          transaction
        });
        if (created) granted.push({ code: ACHIEVEMENT_CODES.PLANET_COMPLETED, planetId });
      }
    }

    await transaction.commit();
    return { granted };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function getUserAchievements(userId) {
  const rows = await sequelize.query(
    `SELECT ua.*, 
            a.code, a.name, a.description, a.points, a.icon,
            l.id as level_id, l.title as level_title, l.order_index as level_order,
            p.id as planet_id, p.title as planet_title, p.order_index as planet_order
     FROM user_achievements ua
     JOIN achievements a ON ua.achievement_id = a.id
     LEFT JOIN levels l ON ua.level_id = l.id
     LEFT JOIN planets p ON COALESCE(ua.planet_id, l.planet_id) = p.id
     WHERE ua.user_id = ?
     ORDER BY ua.awarded_at DESC`,
    { replacements: [userId], type: sequelize.QueryTypes.SELECT }
  );
  return rows;
}

module.exports = {
  ACHIEVEMENT_CODES,
  ensureDefaultAchievements,
  evaluateAndGrantForLevelProgress,
  getUserAchievements
};


