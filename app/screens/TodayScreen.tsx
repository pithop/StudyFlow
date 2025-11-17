/**
 * TodayScreen
 * 
 * Main screen that displays today's tasks and the next action.
 * Fetches data from the FastAPI backend.
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NextActionCard from '../components/NextActionCard';
import { getAuthHeaders } from '../hooks/useAuth';

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

interface TimeBlock {
  id: string;
  user_id: string;
  task_id?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  block_type: string;
  is_completed: boolean;
}

interface NextAction {
  task: Task | null;
  time_block: TimeBlock | null;
}

interface TodayData {
  tasks: Task[];
  time_blocks: TimeBlock[];
  count: number;
}

const TodayScreen: React.FC = () => {
  const [nextAction, setNextAction] = useState<NextAction | null>(null);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [todayBlocks, setTodayBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const load = async () => {
    try {
      const headers = await getAuthHeaders();
      // Fetch both endpoints in parallel
      const [todayResponse, nextActionResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/tasks/today`, { headers }),
        fetch(`${API_BASE_URL}/next-action`, { headers }),
      ]);

      // Parse responses
      const todayData: TodayData = await todayResponse.json();
      const nextActionData: NextAction = await nextActionResponse.json();

      // Update state
      setTodayTasks(todayData.tasks || []);
      setTodayBlocks(todayData.time_blocks || []);
      setNextAction(nextActionData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleNextActionPress = () => {
    // TODO: Navigate to task details or start timer
  };

  const handleTaskPress = (task: Task) => {
    // TODO: Navigate to task details
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const renderTask = ({ item }: { item: Task }) => {
    // Find corresponding time block
    const timeBlock = todayBlocks.find((block) => block.task_id === item.id);
    const isCompleted = item.status === 'completed';
    const priorityColor = getPriorityColor(item.priority);
    const typeIcon = getTypeIcon(item.type);
    
    return (
      <TouchableOpacity
        style={[styles.taskCard, isCompleted && styles.taskCardCompleted]}
        onPress={() => handleTaskPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.taskContent}>
          {/* Left accent bar */}
          <View style={[styles.taskAccent, priorityColor]} />
          
          <View style={styles.taskMain}>
            <View style={styles.taskHeader}>
              <View style={styles.taskHeaderLeft}>
                <Ionicons name={typeIcon} size={20} color={priorityColor.backgroundColor} />
                <Text style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}>
                  {item.title}
                </Text>
              </View>
              <View style={[styles.priorityBadge, priorityColor]}>
                <Text style={styles.priorityText}>{item.priority}</Text>
              </View>
            </View>
            
            {item.description && (
              <Text style={styles.taskDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            
            <View style={styles.taskFooter}>
              {timeBlock && (
                <View style={styles.timeChip}>
                  <Ionicons name="time-outline" size={14} color="#60A5FA" />
                  <Text style={styles.timeText}>
                    {formatTime(timeBlock.start_time)} - {formatTime(timeBlock.end_time)}
                  </Text>
                </View>
              )}
              
              {item.estimated_duration && (
                <View style={styles.durationChip}>
                  <Ionicons name="hourglass-outline" size={14} color="#A78BFA" />
                  <Text style={styles.durationText}>{item.estimated_duration} min</Text>
                </View>
              )}
              
              {isCompleted && (
                <View style={styles.completedChip}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.completedText}>Terminé</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return styles.priorityUrgent;
      case 'high':
        return styles.priorityHigh;
      case 'medium':
        return styles.priorityMedium;
      default:
        return styles.priorityLow;
    }
  };

  const getTypeIcon = (type: string): any => {
    switch (type) {
      case 'exam':
        return 'school-outline';
      case 'project':
        return 'briefcase-outline';
      case 'homework':
        return 'book-outline';
      case 'reading':
        return 'reader-outline';
      default:
        return 'document-text-outline';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text style={styles.loadingText}>Loading your tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today</Text>
        <Text style={styles.headerSubtitle}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      <FlatList
        data={todayTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60A5FA" />
        }
        ListHeaderComponent={
          nextAction?.task ? (
            <NextActionCard
              title={nextAction.task.title}
              reason={
                nextAction.time_block
                  ? `Scheduled now until ${formatTime(nextAction.time_block.end_time)}`
                  : `Priority: ${nextAction.task.priority} • Due: ${
                      nextAction.task.due_date
                        ? new Date(nextAction.task.due_date).toLocaleDateString()
                        : 'No deadline'
                    }`
              }
              estimatedDuration={nextAction.task.estimated_duration}
              onPress={handleNextActionPress}
            />
          ) : (
            <View style={styles.emptyNext}>
              <Text style={styles.emptyNextText}>No pending tasks! 🎉</Text>
            </View>
          )
        }
        ListEmptyComponent={
          !nextAction?.task ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No tasks scheduled for today</Text>
              <Text style={styles.emptySubtext}>Pull down to refresh</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Dark background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94A3B8',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyNext: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginVertical: 12,
    alignItems: 'center',
  },
  emptyNextText: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: '600',
  },
  taskCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  priorityUrgent: {
    backgroundColor: '#EF4444',
  },
  priorityHigh: {
    backgroundColor: '#F59E0B',
  },
  priorityMedium: {
    backgroundColor: '#3B82F6',
  },
  priorityLow: {
    backgroundColor: '#6B7280',
  },
  taskDescription: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
    lineHeight: 20,
  },
  timeInfo: {
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 13,
    color: '#60A5FA',
    fontWeight: '500',
  },
  taskFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  taskType: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'capitalize',
  },
  duration: {
    fontSize: 12,
    color: '#64748B',
  },
  taskCardCompleted: {
    opacity: 0.6,
  },
  taskContent: {
    flexDirection: 'row',
  },
  taskAccent: {
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    marginRight: -16,
  },
  taskMain: {
    flex: 1,
  },
  taskHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#64748B',
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 12,
    color: '#A78BFA',
  },
  completedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#94A3B8',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
  },
});

export default TodayScreen;
