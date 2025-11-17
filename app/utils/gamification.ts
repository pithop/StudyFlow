/**
 * Gamification Utilities
 * 
 * Revolutionary XP system, levels, badges, and achievements
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

// XP Levels system
export const LEVELS = [
  { level: 1, xp: 0, title: '🌱 Beginner', color: '#94A3B8' },
  { level: 2, xp: 100, title: '📚 Student', color: '#60A5FA' },
  { level: 3, xp: 250, title: '🎯 Focused', color: '#3B82F6' },
  { level: 4, xp: 500, title: '⚡ Productive', color: '#8B5CF6' },
  { level: 5, xp: 1000, title: '🔥 On Fire', color: '#F59E0B' },
  { level: 6, xp: 2000, title: '🚀 Achiever', color: '#10B981' },
  { level: 7, xp: 3500, title: '💎 Pro', color: '#06B6D4' },
  { level: 8, xp: 5500, title: '👑 Elite', color: '#EC4899' },
  { level: 9, xp: 8000, title: '🌟 Master', color: '#F43F5E' },
  { level: 10, xp: 12000, title: '🏆 Legend', color: '#F59E0B' },
];

// Badge definitions
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirement: string;
  unlocked: boolean;
}

export const BADGES: Badge[] = [
  {
    id: 'first_task',
    name: 'First Steps',
    description: 'Complete your first task',
    icon: 'footsteps',
    color: '#60A5FA',
    requirement: 'Complete 1 task',
    unlocked: false,
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: 'flame',
    color: '#F59E0B',
    requirement: '7 day streak',
    unlocked: false,
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete a task before 8 AM',
    icon: 'sunny',
    color: '#FBBF24',
    requirement: 'Task completed before 8 AM',
    unlocked: false,
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete a task after 10 PM',
    icon: 'moon',
    color: '#8B5CF6',
    requirement: 'Task completed after 10 PM',
    unlocked: false,
  },
  {
    id: 'speedster',
    name: 'Speedster',
    description: 'Complete 5 tasks in one day',
    icon: 'flash',
    color: '#3B82F6',
    requirement: '5 tasks in one day',
    unlocked: false,
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete 10 tasks without missing a deadline',
    icon: 'checkmark-done',
    color: '#10B981',
    requirement: '10 tasks on time',
    unlocked: false,
  },
  {
    id: 'pomodoro_master',
    name: 'Pomodoro Master',
    description: 'Complete 25 Pomodoro sessions',
    icon: 'timer',
    color: '#EF4444',
    requirement: '25 Pomodoro sessions',
    unlocked: false,
  },
  {
    id: 'study_marathon',
    name: 'Study Marathon',
    description: 'Log 40+ hours of study time',
    icon: 'school',
    color: '#10B981',
    requirement: '40+ study hours',
    unlocked: false,
  },
];

// Player stats interface
export interface PlayerStats {
  totalXP: number;
  currentLevel: number;
  tasksCompleted: number;
  currentStreak: number;
  longestStreak: number;
  pomodoroSessions: number;
  totalStudyHours: number;
  badges: string[]; // IDs of unlocked badges
  tasksCompletedOnTime: number;
  tasksCompletedToday: number;
  lastTaskDate?: string;
}

const STATS_KEY = '@studyflow_player_stats';

// Initialize default stats
export const getDefaultStats = (): PlayerStats => ({
  totalXP: 0,
  currentLevel: 1,
  tasksCompleted: 0,
  currentStreak: 0,
  longestStreak: 0,
  pomodoroSessions: 0,
  totalStudyHours: 0,
  badges: [],
  tasksCompletedOnTime: 0,
  tasksCompletedToday: 0,
});

// Load player stats
export const loadPlayerStats = async (): Promise<PlayerStats> => {
  try {
    const data = await AsyncStorage.getItem(STATS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return getDefaultStats();
  } catch (error) {
    console.error('Error loading player stats:', error);
    return getDefaultStats();
  }
};

// Save player stats
export const savePlayerStats = async (stats: PlayerStats): Promise<void> => {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving player stats:', error);
  }
};

// Calculate level from XP
export const calculateLevel = (xp: number): number => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) {
      return LEVELS[i].level;
    }
  }
  return 1;
};

// Get XP for next level
export const getXPForNextLevel = (currentLevel: number): number => {
  const nextLevel = LEVELS.find(l => l.level === currentLevel + 1);
  return nextLevel ? nextLevel.xp : LEVELS[LEVELS.length - 1].xp;
};

// Get XP for current level
export const getXPForCurrentLevel = (currentLevel: number): number => {
  const level = LEVELS.find(l => l.level === currentLevel);
  return level ? level.xp : 0;
};

// Calculate XP for task completion
export const calculateTaskXP = (task: { priority: string; estimated_duration?: number }): number => {
  let baseXP = 10;
  
  // Priority bonus
  switch (task.priority) {
    case 'high':
      baseXP += 15;
      break;
    case 'medium':
      baseXP += 10;
      break;
    case 'low':
      baseXP += 5;
      break;
  }
  
  // Duration bonus
  if (task.estimated_duration) {
    baseXP += Math.min(task.estimated_duration * 2, 30);
  }
  
  return baseXP;
};

// Award XP and update stats
export const awardXP = async (
  xpAmount: number,
  reason: string
): Promise<{ levelUp: boolean; newLevel?: number; stats: PlayerStats }> => {
  const stats = await loadPlayerStats();
  const oldLevel = stats.currentLevel;
  
  stats.totalXP += xpAmount;
  stats.currentLevel = calculateLevel(stats.totalXP);
  
  await savePlayerStats(stats);
  
  const levelUp = stats.currentLevel > oldLevel;
  
  if (levelUp) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } else {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
  
  return {
    levelUp,
    newLevel: levelUp ? stats.currentLevel : undefined,
    stats,
  };
};

// Complete task and update stats
export const completeTask = async (task: {
  priority: string;
  estimated_duration?: number;
  due_date?: string;
}): Promise<{ xp: number; levelUp: boolean; newBadges: Badge[] }> => {
  const stats = await loadPlayerStats();
  const xp = calculateTaskXP(task);
  
  // Update task stats
  stats.tasksCompleted += 1;
  stats.tasksCompletedToday += 1;
  
  // Check if completed on time
  if (task.due_date) {
    const now = new Date();
    const dueDate = new Date(task.due_date);
    if (now <= dueDate) {
      stats.tasksCompletedOnTime += 1;
    }
  }
  
  // Update streak
  const today = new Date().toDateString();
  if (stats.lastTaskDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (stats.lastTaskDate === yesterday.toDateString()) {
      stats.currentStreak += 1;
    } else {
      stats.currentStreak = 1;
    }
    
    if (stats.currentStreak > stats.longestStreak) {
      stats.longestStreak = stats.currentStreak;
    }
    
    stats.lastTaskDate = today;
    stats.tasksCompletedToday = 1;
  }
  
  // Check for new badges
  const newBadges = checkForNewBadges(stats);
  stats.badges = [...new Set([...stats.badges, ...newBadges.map(b => b.id)])];
  
  await savePlayerStats(stats);
  
  // Award XP
  const result = await awardXP(xp, 'Task completion');
  
  return {
    xp,
    levelUp: result.levelUp,
    newBadges,
  };
};

// Complete Pomodoro session
export const completePomodoroSession = async (): Promise<void> => {
  const stats = await loadPlayerStats();
  stats.pomodoroSessions += 1;
  
  // Check for Pomodoro Master badge
  const newBadges = checkForNewBadges(stats);
  stats.badges = [...new Set([...stats.badges, ...newBadges.map(b => b.id)])];
  
  await savePlayerStats(stats);
  await awardXP(5, 'Pomodoro session');
};

// Check for newly unlocked badges
const checkForNewBadges = (stats: PlayerStats): Badge[] => {
  const newBadges: Badge[] = [];
  
  BADGES.forEach(badge => {
    if (stats.badges.includes(badge.id)) return;
    
    let unlock = false;
    const hour = new Date().getHours();
    
    switch (badge.id) {
      case 'first_task':
        unlock = stats.tasksCompleted >= 1;
        break;
      case 'week_warrior':
        unlock = stats.currentStreak >= 7;
        break;
      case 'early_bird':
        unlock = hour < 8 && stats.tasksCompletedToday > 0;
        break;
      case 'night_owl':
        unlock = hour >= 22 && stats.tasksCompletedToday > 0;
        break;
      case 'speedster':
        unlock = stats.tasksCompletedToday >= 5;
        break;
      case 'perfectionist':
        unlock = stats.tasksCompletedOnTime >= 10;
        break;
      case 'pomodoro_master':
        unlock = stats.pomodoroSessions >= 25;
        break;
      case 'study_marathon':
        unlock = stats.totalStudyHours >= 40;
        break;
    }
    
    if (unlock) {
      newBadges.push(badge);
    }
  });
  
  if (newBadges.length > 0) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
  
  return newBadges;
};

// Get progress to next level (0-1)
export const getLevelProgress = (stats: PlayerStats): number => {
  const currentLevelXP = getXPForCurrentLevel(stats.currentLevel);
  const nextLevelXP = getXPForNextLevel(stats.currentLevel);
  const progress = (stats.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP);
  return Math.min(Math.max(progress, 0), 1);
};

// Get unlocked badges
export const getUnlockedBadges = (stats: PlayerStats): Badge[] => {
  return BADGES.filter(badge => stats.badges.includes(badge.id)).map(b => ({ ...b, unlocked: true }));
};

// Get locked badges
export const getLockedBadges = (stats: PlayerStats): Badge[] => {
  return BADGES.filter(badge => !stats.badges.includes(badge.id)).map(b => ({ ...b, unlocked: false }));
};
