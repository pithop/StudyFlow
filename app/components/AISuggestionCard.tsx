/**
 * Carte de Suggestion IA - Light Mode
 * Remplace le timer Pomodoro circulaire
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme/design';

interface AISuggestionCardProps {
  task: {
    id: string;
    title: string;
    type: string;
    priority: string;
    due_date?: string;
  } | null;
  onStartTask?: () => void;
}

export default function AISuggestionCard({ task, onStartTask }: AISuggestionCardProps) {
  if (!task) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyIcon}>✨</Text>
        <Text style={styles.emptyTitle}>Tout est terminé !</Text>
        <Text style={styles.emptyText}>
          Vous avez complété toutes vos tâches prioritaires
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>💡</Text>
        </View>
        <Text style={styles.label}>Suggestion IA</Text>
      </View>

      <Text style={styles.title}>{task.title}</Text>

      {task.due_date && (
        <View style={styles.metaRow}>
          <View style={styles.dueDateContainer}>
            <Text style={styles.dueDateIcon}>📅</Text>
            <Text style={styles.dueDateText}>
              {new Date(task.due_date).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
              })}
            </Text>
          </View>

          <View style={[styles.priorityTag, getPriorityStyle(task.priority)]}>
            <Text style={[styles.priorityText, getPriorityTextStyle(task.priority)]}>
              {getPriorityLabel(task.priority)}
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={onStartTask}>
        <Text style={styles.buttonText}>Commencer →</Text>
      </TouchableOpacity>
    </View>
  );
}

function getPriorityLabel(priority: string): string {
  const labels: { [key: string]: string } = {
    urgent: 'Urgent',
    high: 'Important',
    medium: 'Normal',
    low: 'Bas',
  };
  return labels[priority] || 'Normal';
}

function getPriorityStyle(priority: string) {
  const styles: { [key: string]: any } = {
    urgent: { backgroundColor: colors.urgentBg },
    high: { backgroundColor: colors.highBg },
    medium: { backgroundColor: colors.mediumBg },
    low: { backgroundColor: colors.lowBg },
  };
  return styles[priority] || styles.medium;
}

function getPriorityTextStyle(priority: string) {
  const styles: { [key: string]: any } = {
    urgent: { color: colors.urgent },
    high: { color: colors.high },
    medium: { color: colors.medium },
    low: { color: colors.low },
  };
  return styles[priority] || styles.medium;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    ...typography.bodySecondary,
    color: colors.textInverse,
    opacity: 0.9,
  },
  title: {
    ...typography.h2,
    color: colors.textInverse,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  dueDateText: {
    ...typography.bodySecondary,
    color: colors.textInverse,
  },
  priorityTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  priorityText: {
    ...typography.tag,
    fontWeight: '700',
  },
  button: {
    backgroundColor: colors.textInverse,
    paddingVertical: 14,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.button,
    color: colors.primary,
  },

  // Empty state
  emptyCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.bodySecondary,
    textAlign: 'center',
  },
});
