/**
 * LevelProgressBar Component
 * 
 * Beautiful XP and level display with animations
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LEVELS, getLevelProgress, getXPForNextLevel, getXPForCurrentLevel } from '../utils/gamification';

interface LevelProgressBarProps {
  currentLevel: number;
  totalXP: number;
}

const LevelProgressBar: React.FC<LevelProgressBarProps> = ({ currentLevel, totalXP }) => {
  const progress = getLevelProgress({ currentLevel, totalXP } as any);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const levelData = LEVELS.find(l => l.level === currentLevel) || LEVELS[0];
  const currentLevelXP = getXPForCurrentLevel(currentLevel);
  const nextLevelXP = getXPForNextLevel(currentLevel);
  const xpInLevel = totalXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [progress]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Animated.View style={[styles.levelBadge, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.levelNumber}>{currentLevel}</Text>
        </Animated.View>
        
        <View style={styles.titleContainer}>
          <Text style={styles.levelTitle}>{levelData.title}</Text>
          <Text style={styles.xpText}>
            {xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
          </Text>
        </View>

        <Ionicons name="trophy" size={32} color={levelData.color} />
      </View>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressWidth,
                backgroundColor: levelData.color,
              },
            ]}
          />
        </View>
        <Text style={styles.percentageText}>{Math.round(progress * 100)}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  levelBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#60A5FA',
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  titleContainer: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F1F5F9',
  },
  xpText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 12,
    backgroundColor: '#0F172A',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#60A5FA',
    width: 45,
  },
});

export default LevelProgressBar;
