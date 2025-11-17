/**
 * ProfileScreen - Light Mode Professional
 * Gamification minimaliste (pas de gros graphics)
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuthHeaders } from '../hooks/useAuth';
import { colors, typography, spacing, borderRadius, shadows, components } from '../theme/design';

// API Configuration
const API_BASE_URL = 'http://172.20.10.2:5050/v1';

interface PlayerStats {
  level: number;
  xp: number;
  xp_for_next_level: number;
  badges: string[];
  tasks_completed: number;
  streak_days: number;
}

const BADGES = [
  { id: 'first_task', name: 'Première Tâche', emoji: '🎯', description: 'Complétez votre première tâche' },
  { id: 'streak_7', name: 'Une Semaine', emoji: '🔥', description: '7 jours consécutifs' },
  { id: 'level_5', name: 'Niveau 5', emoji: '⭐', description: 'Atteignez le niveau 5' },
  { id: 'tasks_50', name: '50 Tâches', emoji: '💪', description: 'Complétez 50 tâches' },
  { id: 'perfect_week', name: 'Semaine Parfaite', emoji: '✨', description: 'Toutes les tâches en une semaine' },
  { id: 'early_bird', name: 'Lève-tôt', emoji: '🌅', description: 'Terminez 10 tâches avant 9h' },
  { id: 'night_owl', name: 'Oiseau de Nuit', emoji: '🦉', description: 'Terminez 10 tâches après 22h' },
  { id: 'speedrun', name: 'Rapide', emoji: '⚡', description: 'Terminez 5 tâches en moins d\'une heure' },
];

export default function ProfileScreenNew() {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const headers = await getAuthHeaders();
      // TODO: Créer endpoint profile dans le backend
      // Pour l'instant, données mockées
      setStats({
        level: 7,
        xp: 1450,
        xp_for_next_level: 2000,
        badges: ['first_task', 'streak_7', 'level_5'],
        tasks_completed: 32,
        streak_days: 5,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const xpProgress = stats ? (stats.xp / stats.xp_for_next_level) * 100 : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>U</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{stats?.level}</Text>
          </View>
        </View>

        <Text style={styles.userName}>Utilisateur</Text>
        <Text style={styles.userEmail}>user@email.com</Text>
      </View>

      {/* XP Progress */}
      <View style={styles.section}>
        <View style={styles.xpCard}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpLabel}>Niveau {stats?.level}</Text>
            <Text style={styles.xpValue}>
              {stats?.xp} / {stats?.xp_for_next_level} XP
            </Text>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${xpProgress}%` }]} />
          </View>

          <Text style={styles.xpNextLevel}>
            {stats && stats.xp_for_next_level - stats.xp} XP pour le niveau suivant
          </Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistiques</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.tasks_completed}</Text>
            <Text style={styles.statLabel}>Tâches terminées</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.streakContainer}>
              <Text style={styles.statValue}>{stats?.streak_days}</Text>
              <Text style={styles.streakEmoji}>🔥</Text>
            </View>
            <Text style={styles.statLabel}>Jours consécutifs</Text>
          </View>
        </View>
      </View>

      {/* Badges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Badges</Text>

        <View style={styles.badgesGrid}>
          {BADGES.map((badge) => {
            const isUnlocked = stats?.badges.includes(badge.id);
            return (
              <View
                key={badge.id}
                style={[styles.badgeCard, !isUnlocked && styles.badgeCardLocked]}
              >
                <Text style={[styles.badgeEmoji, !isUnlocked && styles.badgeEmojiLocked]}>
                  {badge.emoji}
                </Text>
                <Text style={[styles.badgeName, !isUnlocked && styles.badgeNameLocked]}>
                  {badge.name}
                </Text>
                <Text style={styles.badgeDescription}>{badge.description}</Text>
                {isUnlocked && (
                  <View style={styles.badgeCheckmark}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paramètres</Text>

        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="person-outline" size={20} color={colors.text} />
          <Text style={styles.settingText}>Modifier le profil</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="notifications-outline" size={20} color={colors.text} />
          <Text style={styles.settingText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="help-circle-outline" size={20} color={colors.text} />
          <Text style={styles.settingText}>Aide & Support</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingItem, styles.settingItemDanger]}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[styles.settingText, styles.settingTextDanger]}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* Spacer */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  avatarText: {
    ...typography.h1,
    color: colors.textInverse,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.xpGold,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  levelText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '700',
  },
  userName: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.bodySecondary,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  xpCard: {
    ...components.card,
    padding: spacing.lg,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  xpLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  xpValue: {
    ...typography.bodySecondary,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.xpGold,
    borderRadius: borderRadius.full,
  },
  xpNextLevel: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    ...components.card,
    flex: 1,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h1,
    fontSize: 32,
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakEmoji: {
    fontSize: 24,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgeCard: {
    ...components.card,
    width: '48%',
    padding: spacing.md,
    position: 'relative',
    alignItems: 'center',
  },
  badgeCardLocked: {
    opacity: 0.4,
  },
  badgeEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  badgeEmojiLocked: {
    opacity: 0.3,
    filter: 'grayscale(1)',
  },
  badgeName: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  badgeNameLocked: {
    color: colors.textTertiary,
  },
  badgeDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  badgeCheckmark: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  settingItem: {
    ...components.card,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  settingItemDanger: {
    borderColor: colors.errorBg,
    borderWidth: 1,
  },
  settingText: {
    ...typography.body,
    flex: 1,
    marginLeft: spacing.md,
  },
  settingTextDanger: {
    color: colors.error,
  },
});
