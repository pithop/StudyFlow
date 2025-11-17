/**
 * NextActionCard Component with Pomodoro Timer
 * 
 * Revolutionary interactive timer with circular progress, animations, and haptic feedback
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

interface NextActionCardProps {
  title: string;
  reason?: string;
  estimatedDuration?: number;
  onPress: () => void;
}

const NextActionCard: React.FC<NextActionCardProps> = ({ title, reason, estimatedDuration, onPress }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(estimatedDuration ? estimatedDuration * 60 : 25 * 60); // seconds
  const [initialTime] = useState(estimatedDuration ? estimatedDuration * 60 : 25 * 60);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  useEffect(() => {
    if (isRunning) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
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

      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [isRunning]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (mode === 'work') {
      setSessionsCompleted(prev => prev + 1);
      setMode('break');
      setTimeLeft(5 * 60); // 5 min break
    } else {
      setMode('work');
      setTimeLeft(initialTime);
    }
  };

  const toggleTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRunning(false);
    setTimeLeft(initialTime);
    setMode('work');
  };

  const skipSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode(mode === 'work' ? 'break' : 'work');
    setTimeLeft(mode === 'work' ? 5 * 60 : initialTime);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = timeLeft / initialTime;
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference * (1 - progress);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Header with badges */}
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <View style={styles.nextActionBadge}>
            <Ionicons name="flash" size={14} color="#FFF" />
            <Text style={styles.label}>NEXT ACTION</Text>
          </View>
          <View style={[styles.modeBadge, mode === 'break' && styles.breakBadge]}>
            <Text style={styles.modeText}>{mode === 'work' ? '🔥 FOCUS' : '☕ BREAK'}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      {reason && <Text style={styles.reason} numberOfLines={2}>{reason}</Text>}

      {/* Sessions counter */}
      {sessionsCompleted > 0 && (
        <View style={styles.sessionsContainer}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.sessionsText}>{sessionsCompleted} session{sessionsCompleted > 1 ? 's' : ''} completed today</Text>
        </View>
      )}

      {/* Circular Timer with glow effect */}
      <Animated.View style={[styles.timerContainer, { transform: [{ scale: pulseAnim }] }]}>
        <Animated.View style={[styles.glowEffect, { opacity: isRunning ? glowOpacity : 0 }]} />
        <Svg width="160" height="160" style={styles.svg}>
          {/* Background circle */}
          <Circle
            cx="80"
            cy="80"
            r="70"
            stroke="#334155"
            strokeWidth="10"
            fill="none"
          />
          {/* Progress circle */}
          <Circle
            cx="80"
            cy="80"
            r="70"
            stroke={mode === 'work' ? '#3B82F6' : '#10B981'}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin="80, 80"
          />
        </Svg>
        
        <View style={styles.timerContent}>
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          <Text style={styles.timerLabel}>
            {estimatedDuration ? `/ ${estimatedDuration} min` : '/ 25 min'}
          </Text>
          {timeLeft > 0 && (
            <View style={styles.percentageContainer}>
              <Text style={styles.percentageText}>{Math.round(progress * 100)}%</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Control Buttons */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.controlButton, styles.resetButton]} 
          onPress={resetTimer}
          activeOpacity={0.7}
        >
          <Ionicons name="reload" size={22} color="#F59E0B" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, styles.playButton, isRunning && styles.pauseButton]} 
          onPress={toggleTimer}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isRunning ? 'pause' : 'play'} 
            size={36} 
            color="#FFFFFF" 
            style={!isRunning && { marginLeft: 3 }}
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, styles.skipButton]} 
          onPress={skipSession}
          activeOpacity={0.7}
        >
          <Ionicons name="play-skip-forward" size={22} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      {/* Progress hint */}
      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>
          {isRunning 
            ? '⏱️ Stay focused...' 
            : mode === 'work' 
              ? '▶️ Start your focus session' 
              : '☕ Take a break!'
          }
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 2,
    borderColor: '#334155',
  },
  header: {
    marginBottom: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E40AF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1.2,
  },
  modeBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  breakBadge: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  modeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 8,
    lineHeight: 30,
  },
  reason: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: 8,
  },
  sessionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    backgroundColor: '#064E3B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  sessionsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
  },
  svg: {
    position: 'absolute',
  },
  timerContent: {
    alignItems: 'center',
    zIndex: 10,
  },
  timerText: {
    fontSize: 52,
    fontWeight: '900',
    color: '#F1F5F9',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  timerLabel: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  percentageContainer: {
    marginTop: 8,
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#60A5FA',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
  },
  pauseButton: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  resetButton: {
    backgroundColor: '#422006',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  skipButton: {
    backgroundColor: '#2E1065',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  hintContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    fontStyle: 'italic',
  },
});

export default NextActionCard;
