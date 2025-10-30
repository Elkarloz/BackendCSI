const Achievement = require('../models/Achievement');
const { getUserAchievements, ensureDefaultAchievements } = require('../utils/achievementService');

const listAchievements = async (req, res) => {
  try {
    await ensureDefaultAchievements();
    const achievements = await Achievement.findAll({ 
      where: { isActive: true }, 
      order: [['id', 'ASC']] 
    });
    
    // Transformar a formato plano
    const formattedAchievements = achievements.map(achievement => ({
      id: achievement.id,
      code: achievement.code,
      name: achievement.name,
      description: achievement.description,
      points: achievement.points,
      icon: achievement.icon,
      isActive: achievement.isActive
    }));
    
    res.json({ success: true, data: formattedAchievements });
  } catch (error) {
    console.error('Error listing achievements:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const listUserAchievements = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
    const items = await getUserAchievements(Number(userId));
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error listing user achievements:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  listAchievements,
  listUserAchievements
};


