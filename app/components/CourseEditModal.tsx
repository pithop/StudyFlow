import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

interface Course {
  id: string;
  user_id?: string;
  name: string;
  code?: string | null;
  color?: string | null;
  professor?: string | null;
  credits?: number | null;
  semester?: string | null;
  description?: string | null;
  [key: string]: any; // Allow additional properties
}

interface CourseEditModalProps {
  visible: boolean;
  course: Course | null;
  onClose: () => void;
  onSave: (course: any) => Promise<void>; // Accept any course shape
}

const PRESET_COLORS = [
  '#EF4444', // red
  '#F59E0B', // orange
  '#10B981', // green
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // amber
];

export default function CourseEditModal({ visible, course, onClose, onSave }: CourseEditModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [professor, setProfessor] = useState('');
  const [credits, setCredits] = useState('');
  const [semester, setSemester] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (course) {
      setName(course.name || '');
      setCode(course.code || '');
      setColor(course.color || '#3B82F6');
      setProfessor(course.professor || '');
      setCredits(course.credits ? String(course.credits) : '');
      setSemester(course.semester || '');
      setDescription(course.description || '');
    }
  }, [course]);

  const handleSave = async () => {
    if (!course || !name.trim()) return;

    setLoading(true);
    try {
      await onSave({
        ...course,
        name: name.trim(),
        code: code.trim() || undefined,
        color,
        professor: professor.trim() || undefined,
        credits: credits ? parseInt(credits) : undefined,
        semester: semester.trim() || undefined,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.modalTitle}>Éditer le cours</Text>

            {/* Nom */}
            <Text style={styles.label}>Nom du cours *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Algorithmique Avancée"
              placeholderTextColor="#9CA3AF"
            />

            {/* Code */}
            <Text style={styles.label}>Code</Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="Ex: COMP301"
              placeholderTextColor="#9CA3AF"
            />

            {/* Couleur */}
            <Text style={styles.label}>Couleur</Text>
            <View style={styles.colorPicker}>
              {PRESET_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorOption,
                    { backgroundColor: c },
                    color === c && styles.colorOptionSelected,
                  ]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>

            {/* Professeur */}
            <Text style={styles.label}>Professeur</Text>
            <TextInput
              style={styles.input}
              value={professor}
              onChangeText={setProfessor}
              placeholder="Ex: Dr. Dupont"
              placeholderTextColor="#9CA3AF"
            />

            {/* Crédits */}
            <Text style={styles.label}>Crédits</Text>
            <TextInput
              style={styles.input}
              value={credits}
              onChangeText={setCredits}
              placeholder="Ex: 6"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />

            {/* Semestre */}
            <Text style={styles.label}>Semestre</Text>
            <TextInput
              style={styles.input}
              value={semester}
              onChangeText={setSemester}
              placeholder="Ex: Automne 2025"
              placeholderTextColor="#9CA3AF"
            />

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Description du cours"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
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
                disabled={loading || !name.trim()}
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
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#F9FAFB',
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
