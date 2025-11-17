/**
 * TasksScreen
 *
 * Lists tasks for the current user and allows creating a new task.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuthHeaders } from '../hooks/useAuth';
import TaskEditModal from '../components/TaskEditModal';

const API_BASE_URL = 'http://172.20.10.2:5050/v1';

interface Task {
  id: string;
  user_id: string;
  course_id?: string | null;
  title: string;
  description?: string | null;
  type: string;
  priority?: string | null;
  status?: string | null;
  due_date?: string | null;
  estimated_duration?: number | null;
  actual_duration?: number | null;
  completed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface TasksResponse {
  tasks: Task[];
  count: number;
}

const TasksScreen: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('homework');
  const [priority, setPriority] = useState('medium');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/tasks`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: TasksResponse = await res.json();
      setTasks(data.tasks || []);
    } catch (e: any) {
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const openModal = () => {
    setTitle('');
    setType('homework');
    setPriority('medium');
    setEstimatedDuration('');
    setModalVisible(true);
  };

  const closeModal = () => { if (!saving) setModalVisible(false); };

  const saveTask = async () => {
    if (!title.trim()) { setError('Le titre est requis'); return; }
    setSaving(true); setError(null);
    try {
      const headers = await getAuthHeaders();
      const payload = {
        title: title.trim(),
        type,
        priority,
        estimated_duration: estimatedDuration ? parseInt(estimatedDuration, 10) : undefined,
      };
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json();
      setModalVisible(false);
      setSaving(false);
      setLoading(true);
      load();
    } catch (e: any) {
      setSaving(false);
      setError(e.message || 'Erreur lors de la création');
    }
  };

  const updateTask = async (updatedTask: Task) => {
    try {
      const headers = await getAuthHeaders();
      const payload = {
        title: updatedTask.title,
        description: updatedTask.description,
        type: updatedTask.type,
        priority: updatedTask.priority,
        due_date: updatedTask.due_date,
        estimated_duration: updatedTask.estimated_duration,
      };
      const res = await fetch(`${API_BASE_URL}/tasks/${updatedTask.id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la mise à jour');
      throw e;
    }
  };

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskRow}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        {item.priority && (
          <View style={[styles.priorityBadge, getPriorityStyle(item.priority)]}>
            <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
          </View>
        )}
      </View>
      <Text style={styles.metaLine}>{item.type} • {item.status || 'todo'}</Text>
      {item.estimated_duration ? (
        <Text style={styles.metaSub}>{item.estimated_duration} min estimé</Text>
      ) : null}
      {item.due_date ? (
        <Text style={styles.metaSub}>Due: {new Date(item.due_date).toLocaleDateString()}</Text>
      ) : null}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => {
            setSelectedTask(item);
            setEditModalVisible(true);
          }}
        >
          <Ionicons name="pencil-outline" size={18} color="#F1F5F9" />
          <Text style={styles.actionText}>Éditer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.completeButton]}
          onPress={() => toggleStatus(item)}
        >
          <Ionicons name={item.status === 'completed' ? 'checkmark-done-outline' : 'checkmark-outline'} size={18} color="#F1F5F9" />
          <Text style={styles.actionText}>{item.status === 'completed' ? 'Reouvrir' : 'Terminer'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteTask(item)}
        >
          <Ionicons name="trash-outline" size={18} color="#F1F5F9" />
          <Text style={styles.actionText}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'urgent': return styles.priorityUrgent;
      case 'high': return styles.priorityHigh;
      case 'medium': return styles.priorityMedium;
      default: return styles.priorityLow;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text style={styles.loadingText}>Chargement des tâches...</Text>
      </View>
    );
  }

  const toggleStatus = async (task: Task) => {
    try {
      const headers = await getAuthHeaders();
      const next = task.status === 'completed' ? 'todo' : 'completed';
      const res = await fetch(`${API_BASE_URL}/tasks/${task.id}/status`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
    } catch (e: any) {
      setError(e.message || 'Erreur lors du changement de statut');
    }
  };

  const deleteTask = async (task: Task) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/tasks/${task.id}`, { 
        method: 'DELETE',
        headers 
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Tâches</Text>
        <TouchableOpacity style={styles.addButton} onPress={openModal} activeOpacity={0.7}>
          <Text style={styles.addButtonText}>＋</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
      )}

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60A5FA" />}
        contentContainerStyle={tasks.length === 0 ? styles.emptyListContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune tâche</Text>
            <Text style={styles.emptySubText}>Ajoutez-en avec le bouton +</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouvelle Tâche</Text>
            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Titre"
                placeholderTextColor="#64748B"
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={styles.input}
                placeholder="Type (homework, exam, project...)"
                placeholderTextColor="#64748B"
                value={type}
                onChangeText={setType}
              />
              <TextInput
                style={styles.input}
                placeholder="Priorité (low, medium, high, urgent)"
                placeholderTextColor="#64748B"
                value={priority}
                onChangeText={setPriority}
              />
              <TextInput
                style={styles.input}
                placeholder="Durée estimée (minutes)"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={estimatedDuration}
                onChangeText={setEstimatedDuration}
              />
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={closeModal} disabled={saving}>
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveTask} disabled={saving}>
                <Text style={styles.modalButtonText}>{saving ? '...' : 'Enregistrer'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <TaskEditModal
        visible={editModalVisible}
        task={selectedTask}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedTask(null);
        }}
        onSave={updateTask}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#F1F5F9' },
  addButton: { backgroundColor: '#1E293B', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' },
  addButtonText: { fontSize: 24, color: '#60A5FA', fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#94A3B8' },
  errorBox: { marginHorizontal: 16, padding: 12, backgroundColor: '#B91C1C', borderRadius: 8 },
  errorText: { color: '#F1F5F9', fontSize: 14 },
  taskCard: { backgroundColor: '#1E293B', marginHorizontal: 16, marginVertical: 6, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  taskRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  taskTitle: { fontSize: 18, fontWeight: '600', color: '#F1F5F9', flex: 1, marginRight: 12 },
  metaLine: { fontSize: 12, color: '#94A3B8', marginBottom: 4 },
  metaSub: { fontSize: 12, color: '#CBD5E1' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  priorityText: { fontSize: 10, fontWeight: '700', color: '#F8FAFC' },
  actionsRow: { flexDirection: 'row', marginTop: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginRight: 10 },
  actionText: { color: '#F1F5F9', marginLeft: 6, fontSize: 13, fontWeight: '600' },
  editButton: { backgroundColor: '#3B82F6' },
  completeButton: { backgroundColor: '#16A34A' },
  deleteButton: { backgroundColor: '#B91C1C' },
  priorityUrgent: { backgroundColor: '#DC2626' },
  priorityHigh: { backgroundColor: '#F97316' },
  priorityMedium: { backgroundColor: '#2563EB' },
  priorityLow: { backgroundColor: '#475569' },
  emptyListContainer: { flexGrow: 1, justifyContent: 'center', paddingBottom: 80 },
  emptyContainer: { alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#F1F5F9', marginBottom: 4 },
  emptySubText: { fontSize: 13, color: '#94A3B8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 20 },
  modalContent: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#334155', maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#F1F5F9', marginBottom: 12 },
  input: { backgroundColor: '#0F172A', color: '#F1F5F9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155', marginBottom: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginLeft: 12 },
  cancelButton: { backgroundColor: '#334155' },
  saveButton: { backgroundColor: '#2563EB' },
  modalButtonText: { color: '#F1F5F9', fontWeight: '600' },
});

export default TasksScreen;
