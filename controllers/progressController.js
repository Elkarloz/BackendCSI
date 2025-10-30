// ProgressController: endpoints for student exercise submission, progress, and ranking

const { sequelize } = require('../config/database');
const Exercise = require('../models/Exercise');
const StudentProgress = require('../models/StudentProgress');
const Achievement = require('../models/Achievement');
const { evaluateAndGrantForLevelProgress, getUserAchievements } = require('../utils/achievementService');

// POST /api/exercise/submit
const submitExercise = async (req, res) => {
    try {
        const { user_id, exercise_id, user_answer, time_taken = 0, hints_used = 0 } = req.body || {};
        if (!user_id || !exercise_id || typeof user_answer === 'undefined') {
            return res.status(400).json({
                success: false,
                message: 'Required fields: user_id, exercise_id, user_answer'
            });
        }

        // Ensure the exercise exists
        const exercise = await Exercise.findById(exercise_id);
        if (!exercise) {
            return res.status(404).json({ success: false, message: 'Exercise not found' });
        }

        // Enforce single attempt per user/exercise
        const existing = await sequelize.query(
            'SELECT id FROM exercise_attempts WHERE user_id = ? AND exercise_id = ? LIMIT 1',
            {
                replacements: [user_id, exercise_id],
                type: sequelize.QueryTypes.SELECT
            }
        );
        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                code: 'ALREADY_SUBMITTED',
                message: 'User has already submitted an attempt for this exercise'
            });
        }

        // Evaluate answer (case-insensitive, trimmed)
        const normalize = (v) => (v == null ? '' : v.toString().trim().toLowerCase());
        const isCorrect = normalize(user_answer) === normalize(exercise.correctAnswer);
        const basePoints = Number(exercise.points || 0);
        const timeBonus = exercise.timeLimit && time_taken && time_taken < exercise.timeLimit
            ? Math.max(0, Math.round(((exercise.timeLimit - time_taken) / exercise.timeLimit) * basePoints * 0.5))
            : 0;
        const score = isCorrect ? basePoints + timeBonus : 0;

        // Persist attempt
        await sequelize.query(
            `INSERT INTO exercise_attempts 
             (user_id, exercise_id, user_answer, is_correct, score, time_taken, hints_used, attempted_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            {
                replacements: [user_id, exercise_id, user_answer, isCorrect ? 1 : 0, score, time_taken || 0, hints_used || 0],
                type: sequelize.QueryTypes.INSERT
            }
        );

        // Update student progress for the level of this exercise
        const levelId = exercise.levelId;

        // Determine totals based on exercises in the level
        const totalExercisesRow = await sequelize.query(
            'SELECT COUNT(*) as total FROM exercises WHERE level_id = ? AND is_active = 1',
            { replacements: [levelId], type: sequelize.QueryTypes.SELECT }
        );
        const totalExercises = Number(totalExercisesRow?.[0]?.total || 0);

        // Get current progress
        const current = await StudentProgress.findByUserAndLevel(user_id, levelId);
        const prevAnswered = Number(current?.totalExercises || 0); // ejercicios respondidos
        const prevCompleted = Number(current?.completedExercises || 0); // ejercicios correctos
        const prevScore = Number(current?.score || 0);
        const prevTimeSpent = Number(current?.timeSpent || 0);

        // Actualizar contadores: siempre suma 1 a answered, y suma 1 a correct solo si es correcto
        const answeredExercises = prevAnswered + 1; // total ejercicios respondidos
        const completedExercises = isCorrect ? prevCompleted + 1 : prevCompleted; // total ejercicios correctos
        
        // is_completed = true cuando ha respondido TODOS los ejercicios del nivel (no importa si tiene errores)
        const isCompleted = totalExercises > 0 && answeredExercises >= totalExercises;
        // Porcentaje basado en ejercicios respondidos (no correctos)
        const completionPercentage = totalExercises > 0 ? (answeredExercises / totalExercises) * 100 : 0;

        const updated = await StudentProgress.upsert({
            userId: user_id,
            levelId,
            isCompleted,
            completionPercentage,
            totalExercises: answeredExercises, // total ejercicios respondidos
            completedExercises, // total ejercicios correctos
            score: prevScore + score,
            timeSpent: prevTimeSpent + (time_taken || 0)
        });

        // Evaluate and grant achievements based on this update
        const { granted } = await evaluateAndGrantForLevelProgress({ userId: user_id, levelId });
        
        console.log('🏆 Logros evaluados:', {
            userId: user_id,
            levelId,
            grantedCount: granted?.length || 0,
            granted: granted
        });
        
        // Obtener información completa de los logros otorgados para incluirlos en la respuesta
        let newlyGrantedAchievements = [];
        if (granted && granted.length > 0) {
            const allAchievements = await Achievement.findAll({ where: { isActive: true } });
            newlyGrantedAchievements = granted.map(grant => {
                const achievementInfo = allAchievements.find(a => a.code === grant.code);
                const achievementData = {
                    code: grant.code,
                    name: achievementInfo?.name || grant.code,
                    description: achievementInfo?.description || '',
                    points: achievementInfo?.points || 0,
                    levelId: grant.levelId || null,
                    planetId: grant.planetId || null
                };
                console.log('✅ Logro otorgado:', achievementData);
                return achievementData;
            });
        }
        
        // Obtener todos los logros del usuario para el contexto completo
        let userAchievements = [];
        try {
            userAchievements = await getUserAchievements(user_id);
        } catch (err) {
            console.error('Error obteniendo logros del usuario:', err);
        }

        return res.json({
            success: true,
            data: {
                attempt: {
                    user_id,
                    exercise_id,
                    is_correct: isCorrect,
                    score,
                    time_taken: time_taken || 0,
                    hints_used: hints_used || 0
                },
                progress: updated ? updated.toObject ? updated.toObject() : updated : null,
                completion_percentage: completionPercentage,
                newly_granted_achievements: newlyGrantedAchievements,
                achievements: userAchievements
            }
        });
    } catch (error) {
        console.error('Error in submitExercise:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// GET /api/progress/:user_id
const getUserProgressSummary = async (req, res) => {
    try {
        const { user_id } = req.params;
        if (!user_id) {
            return res.status(400).json({ success: false, message: 'user_id is required' });
        }

        const progress = await StudentProgress.findByUser(user_id);
        return res.json({ success: true, data: progress });
    } catch (error) {
        console.error('Error in getUserProgressSummary:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// GET /api/progress/:user_id/:level_id
const getUserLevelDetail = async (req, res) => {
    try {
        const { user_id, level_id } = req.params;
        if (!user_id || !level_id) {
            return res.status(400).json({ success: false, message: 'user_id and level_id are required' });
        }

        // Fetch attempts for this user and level with exercise info
        const attempts = await sequelize.query(
            `SELECT ea.*, e.question, e.points, e.time_limit
             FROM exercise_attempts ea
             JOIN exercises e ON ea.exercise_id = e.id
             WHERE ea.user_id = ? AND e.level_id = ?
             ORDER BY ea.attempted_at ASC`,
            {
                replacements: [user_id, level_id],
                type: sequelize.QueryTypes.SELECT
            }
        );

        // Aggregate stats
        const totalScore = attempts.reduce((sum, a) => sum + Number(a.score || 0), 0);
        const totalTime = attempts.reduce((sum, a) => sum + Number(a.time_taken || 0), 0);
        const correctCount = attempts.filter(a => Number(a.is_correct) === 1).length;

        // Progress row
        const progress = await StudentProgress.findByUserAndLevel(user_id, level_id);

        return res.json({
            success: true,
            data: {
                attempts,
                score: totalScore,
                time_spent: totalTime,
                correct_answers: correctCount,
                progress: progress ? progress.toObject ? progress.toObject() : progress : null,
                completion_percentage: progress ? progress.completionPercentage : 0,
                is_completed: progress ? !!progress.isCompleted : false
            }
        });
    } catch (error) {
        console.error('Error in getUserLevelDetail:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// GET /api/ranking/:level_id
const getLevelRanking = async (req, res) => {
    try {
        const { level_id } = req.params;
        if (!level_id) {
            return res.status(400).json({ success: false, message: 'level_id is required' });
        }

        // Ranking by score desc, completion desc, time asc
        const ranking = await sequelize.query(
            `SELECT sp.user_id, sp.level_id, sp.score, sp.completion_percentage, sp.time_spent, sp.is_completed
             FROM student_progress sp
             WHERE sp.level_id = ?
             ORDER BY sp.score DESC, sp.completion_percentage DESC, sp.time_spent ASC
             LIMIT 100`,
            { replacements: [level_id], type: sequelize.QueryTypes.SELECT }
        );

        return res.json({ success: true, data: ranking });
    } catch (error) {
        console.error('Error in getLevelRanking:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Aliased submit that accepts different payload shapes and/or :id param
// POST /api/exercises/:id/submit or /api/exercises/submit
const submitExerciseAlias = async (req, res) => {
    try {
        const exerciseId = req.params.id || req.body.exerciseId || req.body.exercise_id;
        const userId = (req.user && req.user.id) || req.body.userId || req.body.user_id;
        const userAnswer = req.body.userAnswer || req.body.user_answer || req.body.answer;
        const timeTaken = req.body.timeTaken ?? req.body.time_taken ?? 0;
        const hintsUsed = req.body.hintsUsed ?? req.body.hints_used ?? 0;

        req.body = {
            user_id: userId,
            exercise_id: exerciseId,
            user_answer: userAnswer,
            time_taken: timeTaken,
            hints_used: hintsUsed
        };

        return submitExercise(req, res);
    } catch (error) {
        console.error('Error in submitExerciseAlias:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    submitExercise,
    submitExerciseAlias,
    getUserProgressSummary,
    getUserLevelDetail,
    getLevelRanking
};


