import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

type TaskType = 'homework' | 'exam' | 'project' | 'reading' | 'other';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface Task {
  id: string;
  user_id?: string;
  title: string;
  description?: string | null;
  type: string; // Allow any string, not just TaskType
  priority?: string | null; // Make it optional and nullable
  due_date?: string | null;
  estimated_duration?: number | null;
  [key: string]: any; // Allow additional properties
}

interface TaskEditModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (task: any) => Promise<void>; // Accept any task shape
}

export default function TaskEditModal({ visible, task, onClose, onSave }: TaskEditModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string>('homework');
  const [priority, setPriority] = useState<string>('medium');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setType(task.type || 'homework');
      setPriority(task.priority || 'medium');
      setDueDate(task.due_date ? new Date(task.due_date) : null);
      setEstimatedDuration(task.estimated_duration ? String(task.estimated_duration) : '');
    }
  }, [task]);

  const handleSave = async () => {
    if (!task || !title.trim()) return;

    setLoading(true);
    try {
      await onSave({
        ...task,
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        priority,
        due_date: dueDate?.toISOString(),
        estimated_duration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const taskTypes: { value: TaskType; label: string }[] = [
    { value: 'homework', label: 'Devoir' },
    { value: 'exam', label: 'Examen' },
    { value: 'project', label: 'Projet' },
    { value: 'reading', label: 'Lecture' },
    { value: 'other', label: 'Autre' },
  ];

  const priorities: { value: Priority; label: string; color: string }[] = [
    { value: 'low', label: 'Basse', color: '#10B981' },
    { value: 'medium', label: 'Moyenne', color: '#3B82F6' },
    { value: 'high', label: 'Haute', color: '#F59E0B' },
    { value: 'urgent', label: 'Urgente', color: '#EF4444' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.scrollView}>
            <Text style={styles.modalTitle}>Éditer la tâche</Text>

            {/* Titre */}
            <Text style={styles.label}>Titre *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Titre de la tâche"
              placeholderTextColor="#9CA3AF"
            />

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Description (optionnelle)"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />

            {/* Type */}
            <Text style={styles.label}>Type</Text>
            <View style={styles.buttonGroup}>
              {taskTypes.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    styles.groupButton,
                    type === t.value && styles.groupButtonActive,
                  ]}
                  onPress={() => setType(t.value)}
                >
                  <Text
                    style={[
                      styles.groupButtonText,
                      type === t.value && styles.groupButtonTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Priorité */}
            <Text style={styles.label}>Priorité</Text>
            <View style={styles.buttonGroup}>
              {priorities.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.groupButton,
                    priority === p.value && { backgroundColor: p.color },
                  ]}
                  onPress={() => setPriority(p.value)}
                >
                  <Text
                    style={[
                      styles.groupButtonText,
                      priority === p.value && styles.groupButtonTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date d'échéance */}
            <Text style={styles.label}>Date d'échéance</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {dueDate
                  ? dueDate.toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Sélectionner une date'}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dueDate || new Date()}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setDueDate(selectedDate);
                  }
                }}
              />
            )}

            {/* Durée estimée */}
            <Text style={styles.label}>Durée estimée (minutes)</Text>
            <TextInput
              style={styles.input}
              value={estimatedDuration}
              onChangeText={setEstimatedDuration}
              placeholder="120"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />

            {/* Boutons d'action */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={loading || !title.trim()}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
  },
  scrollView: {
    width: '100%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1D5DB',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#374151',
    color: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  groupButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  groupButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  groupButtonText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
  },
  groupButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dateButton: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  dateButtonText: {
    color: '#F9FAFB',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 8,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#374151',
  },
  cancelButtonText: {
    color: '#D1D5DB',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
