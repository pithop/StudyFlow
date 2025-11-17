/**
 * RewardNotification Component
 * 
 * Beautiful animated notification for XP, level-ups, and badges
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Badge } from '../utils/gamification';

interface RewardNotificationProps {
  visible: boolean;
  type: 'xp' | 'levelup' | 'badge';
  value?: number;
  level?: number;
  badge?: Badge;
  onDismiss: () => void;
}

const RewardNotification: React.FC<RewardNotificationProps> = ({
  visible,
  type,
  value,
  level,
  badge,
  onDismiss,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Confetti animation
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }).start();

      // Haptic feedback
      if (type === 'levelup') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Auto dismiss after 3 seconds
      const timeout = setTimeout(() => {
        dismissAnimation();
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [visible]);

  const dismissAnimation = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      confettiAnim.setValue(0);
      onDismiss();
    });
  };

  const renderContent = () => {
    switch (type) {
      case 'xp':
        return (
          <View style={styles.content}>
            <Ionicons name="star" size={48} color="#F59E0B" />
            <Text style={styles.title}>+{value} XP</Text>
            <Text style={styles.subtitle}>Experience gained!</Text>
          </View>
        );
      
      case 'levelup':
        return (
          <View style={styles.content}>
            <Ionicons name="trophy" size={64} color="#F59E0B" />
            <Text style={styles.title}>LEVEL UP!</Text>
            <Text style={styles.subtitle}>You reached Level {level}! 🎉</Text>
          </View>
        );
      
      case 'badge':
        return (
          <View style={styles.content}>
            <Ionicons name={badge?.icon as any} size={64} color={badge?.color} />
            <Text style={styles.title}>{badge?.name}</Text>
            <Text style={styles.subtitle}>{badge?.description}</Text>
            <Text style={styles.unlocked}>🏆 Achievement Unlocked!</Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.notification,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {renderContent()}
          
          {/* Confetti particles */}
          {type === 'levelup' && (
            <View style={styles.confettiContainer}>
              {[...Array(8)].map((_, i) => {
                const translateY = confettiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -200 - Math.random() * 100],
                });
                const translateX = confettiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, (Math.random() - 0.5) * 200],
                });
                const opacity = confettiAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1, 0],
                });
                const colors = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899'];
                
                return (
                  <Animated.View
                    key={i}
                    style={[
                      styles.confetti,
                      {
                        backgroundColor: colors[i % colors.length],
                        transform: [{ translateY }, { translateX }],
                        opacity,
                      },
                    ]}
                  />
                );
              })}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notification: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    minWidth: 280,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F1F5F9',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  unlocked: {
    fontSize: 14,
    color: '#F59E0B',
    marginTop: 12,
    fontWeight: '700',
  },
  confettiContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});

export default RewardNotification;
