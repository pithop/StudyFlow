/**
 * TasksScreen - Light Mode Professional
 * Cartes épurées avec swipe actions (pas de gros boutons)
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuthHeaders } from '../hooks/useAuth';
import { colors, typography, spacing, borderRadius, shadows, components } from '../theme/design';
import Swipeable from 'react-native-gesture-handler/Swipeable';

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
  course_id?: string;
}

export default function TasksScreenNew() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'todo' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/tasks`, { headers });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    try {
      const headers = await getAuthHeaders();
      const newStatus = currentStatus === 'completed' ? 'todo' : 'completed';

      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    Alert.alert('Supprimer', 'Êtes-vous sûr de vouloir supprimer cette tâche ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            const headers = await getAuthHeaders();
            await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
              method: 'DELETE',
              headers,
            });
            fetchTasks();
          } catch (error) {
            console.error('Error deleting task:', error);
          }
        },
      },
    ]);
  };

  const renderRightActions = (taskId: string, status: string) => {
    return (
      <View style={styles.swipeActions}>
        <TouchableOpacity
          style={[styles.swipeButton, styles.completeButton]}
          onPress={() => toggleTaskStatus(taskId, status)}
        >
          <Ionicons
            name={status === 'completed' ? 'refresh' : 'checkmark'}
            size={20}
            color={colors.textInverse}
          />
          <Text style={styles.swipeButtonText}>
            {status === 'completed' ? 'Réactiver' : 'Terminer'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.swipeButton, styles.deleteButton]}
          onPress={() => deleteTask(taskId)}
        >
          <Ionicons name="trash-outline" size={20} color={colors.textInverse} />
          <Text style={styles.swipeButtonText}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTask = ({ item }: { item: Task }) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id, item.status)}>
      <View style={[styles.taskCard, item.status === 'completed' && styles.taskCardCompleted]}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => toggleTaskStatus(item.id, item.status)}
        >
          <View style={[styles.checkbox, item.status === 'completed' && styles.checkboxChecked]}>
            {item.status === 'completed' && (
              <Ionicons name="checkmark" size={16} color={colors.textInverse} />
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.taskContent}>
          <Text
            style={[styles.taskTitle, item.status === 'completed' && styles.taskTitleCompleted]}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          <View style={styles.taskMeta}>
            {/* Priority tag */}
            <View style={[styles.priorityTag, getPriorityTagStyle(item.priority)]}>
              <Text style={[styles.priorityTagText, getPriorityTextStyle(item.priority)]}>
                {getPriorityLabel(item.priority)}
              </Text>
            </View>

            {/* Type tag */}
            <View style={styles.typeTag}>
              <Text style={styles.typeTagText}>{getTypeLabel(item.type)}</Text>
            </View>

            {/* Due date */}
            {item.due_date && (
              <View style={styles.dueDateContainer}>
                <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} />
                <Text style={styles.dueDateText}>
                  {new Date(item.due_date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Swipeable>
  );

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
    if (filter === 'todo') return task.status !== 'completed';
    if (filter === 'completed') return task.status === 'completed';
    return true;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Tâches</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Toutes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'todo' && styles.filterButtonActive]}
          onPress={() => setFilter('todo')}
        >
          <Text style={[styles.filterText, filter === 'todo' && styles.filterTextActive]}>
            À faire
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'completed' && styles.filterButtonActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>
            Terminées
          </Text>
        </TouchableOpacity>
      </View>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>Aucune tâche</Text>
          </View>
        }
      />
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

function getPriorityTagStyle(priority: string) {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h1,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.backgroundTertiary,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.textInverse,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  taskCard: {
    ...components.card,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  taskCardCompleted: {
    opacity: 0.6,
  },
  checkboxContainer: {
    padding: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  taskContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  taskTitle: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  priorityTag: {
    ...components.tag,
  },
  priorityTagText: {
    ...typography.tag,
    fontWeight: '700',
  },
  typeTag: {
    ...components.tag,
    backgroundColor: colors.backgroundTertiary,
  },
  typeTagText: {
    ...typography.tag,
    color: colors.textSecondary,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  swipeActions: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  swipeButton: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
    borderRadius: borderRadius.md,
  },
  completeButton: {
    backgroundColor: colors.success,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  swipeButtonText: {
    ...typography.caption,
    color: colors.textInverse,
    marginTop: 4,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
  },
});
