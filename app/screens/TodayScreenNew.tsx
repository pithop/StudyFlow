/**
 * TodayScreen - Light Mode Professional
 * Remplace le timer Pomodoro par une carte de suggestion IA
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AISuggestionCard from '../components/AISuggestionCard';
import { getAuthHeaders } from '../hooks/useAuth';
import { colors, typography, spacing, borderRadius, shadows, components } from '../theme/design';

// API Configuration
const API_BASE_URL = 'http://172.20.10.2:5050/v1';

interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: string;
  due_date?: string;
  estimated_duration?: number;
  created_at?: string;
  updated_at?: string;
}

export default function TodayScreen() {
  const [nextTask, setNextTask] = useState<Task | null>(null);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = await getAuthHeaders();
      
      // Fetch next action (priority task)
      const nextResponse = await fetch(`${API_BASE_URL}/next-action`, { headers });
      if (nextResponse.ok) {
        const nextData = await nextResponse.json();
        setNextTask(nextData.task);
      }

      // Fetch today's tasks
      const todayResponse = await fetch(`${API_BASE_URL}/today-tasks`, { headers });
      if (todayResponse.ok) {
        const todayData = await todayResponse.json();
        setTodayTasks(todayData.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleStartTask = () => {
    // Navigation vers la tâche ou démarrage du timer
  };

  const handleTaskPress = (task: Task) => {
    // Navigation vers les détails de la tâche
  };

  const renderTaskCard = ({ item }: { item: Task }) => (
    <TouchableOpacity style={styles.taskCard} onPress={() => handleTaskPress(item)}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={[styles.priorityDot, getPriorityDotStyle(item.priority)]} />
      </View>

      <View style={styles.taskMeta}>
        {item.due_date && (
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>
              {new Date(item.due_date).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
              })}
            </Text>
          </View>
        )}

        {item.estimated_duration && (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}>{item.estimated_duration} min</Text>
          </View>
        )}

        <View style={[styles.typeTag, getTypeStyle(item.type)]}>
          <Text style={[styles.typeText, getTypeTextStyle(item.type)]}>
            {getTypeLabel(item.type)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {getGreeting()}, {/* TODO: Get user name */}
        </Text>
        <Text style={styles.date}>{formatToday()}</Text>
      </View>

      {/* AI Suggestion Card */}
      <AISuggestionCard task={nextTask} onStartTask={handleStartTask} />

      {/* Today's Tasks Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Aujourd'hui</Text>
          <View style={styles.taskCount}>
            <Text style={styles.taskCountText}>{todayTasks.length}</Text>
          </View>
        </View>

        {todayTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Aucune tâche pour aujourd'hui</Text>
          </View>
        ) : (
          todayTasks.map((task) => (
            <View key={task.id}>{renderTaskCard({ item: task })}</View>
          ))
        )}
      </View>

      {/* Spacer pour le bottom tab */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function formatToday(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function getTypeLabel(type: string): string {
  const labels: { [key: string]: string } = {
    homework: 'Devoir',
    exam: 'Examen',
    project: 'Projet',
    quiz: 'Quiz',
    tp: 'TP',
    td: 'TD',
  };
  return labels[type] || type;
}

function getPriorityDotStyle(priority: string) {
  const styles: { [key: string]: any } = {
    urgent: { backgroundColor: colors.urgent },
    high: { backgroundColor: colors.high },
    medium: { backgroundColor: colors.medium },
    low: { backgroundColor: colors.low },
  };
  return styles[priority] || styles.medium;
}

function getTypeStyle(type: string) {
  return { backgroundColor: colors.backgroundTertiary };
}

function getTypeTextStyle(type: string) {
  return { color: colors.textSecondary };
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  greeting: {
    ...typography.h1,
  },
  date: {
    ...typography.bodySecondary,
    marginTop: spacing.xs,
    textTransform: 'capitalize',
  },
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
  },
  taskCount: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    minWidth: 28,
    alignItems: 'center',
  },
  taskCountText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '700',
  },
  taskCard: {
    ...components.card,
    marginBottom: spacing.sm,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  taskTitle: {
    ...typography.body,
    flex: 1,
    marginRight: spacing.sm,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  typeTag: {
    ...components.tag,
  },
  typeText: {
    ...typography.tag,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.bodySecondary,
  },
});
