/**
 * CoursesScreen
 *
 * Displays user's courses and allows adding a new course via a modal form.
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuthHeaders } from '../hooks/useAuth';
import CourseEditModal from '../components/CourseEditModal';

const API_BASE_URL = 'http://172.20.10.2:5050/v1';

interface Course {
  id: string;
  user_id: string;
  name: string;
  code?: string | null;
  color?: string | null;
  professor?: string | null;
  credits?: number | null;
  semester?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface CoursesResponse {
  courses: Course[];
  count: number;
}

const CoursesScreen: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [newCourseName, setNewCourseName] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/courses`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: CoursesResponse = await res.json();
      setCourses(data.courses || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load courses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const openModal = () => {
    setNewCourseName('');
    setModalVisible(true);
  };

  const closeModal = () => {
    if (!saving) {
      setModalVisible(false);
    }
  };

  const saveCourse = async () => {
    if (!newCourseName.trim()) {
      setError('Le nom du cours est requis');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/courses`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCourseName.trim() })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Optionally parse returned course
      await res.json();
      setModalVisible(false);
      setNewCourseName('');
      // Reload list
      setLoading(true);
      load();
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const renderCourse = ({ item }: { item: Course }) => (
    <View style={styles.courseCard}>
      <View style={styles.courseHeader}>
        <Text style={styles.courseTitle}>{item.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {item.code ? <Text style={styles.courseCode}>{item.code}</Text> : null}
          <TouchableOpacity 
            style={styles.courseEdit}
            onPress={() => {
              setSelectedCourse(item);
              setEditModalVisible(true);
            }}
          >
            <Ionicons name="pencil-outline" size={18} color="#F1F5F9" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.courseDelete} onPress={() => deleteCourse(item)}>
            <Ionicons name="trash-outline" size={18} color="#F1F5F9" />
          </TouchableOpacity>
        </View>
      </View>
      {item.semester || item.professor ? (
        <Text style={styles.courseMeta}>
          {item.semester ? item.semester : ''}{item.semester && item.professor ? ' • ' : ''}{item.professor ? item.professor : ''}
        </Text>
      ) : null}
      {item.description ? (
        <Text style={styles.courseDescription} numberOfLines={2}>{item.description}</Text>
      ) : null}
    </View>
  );

  const deleteCourse = async (course: Course) => {
    try {
      const res = await fetch(`${API_BASE_URL}/courses/${course.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la suppression');
    }
  };

  const updateCourse = async (updatedCourse: Course) => {
    try {
      const headers = await getAuthHeaders();
      const payload = {
        name: updatedCourse.name,
        code: updatedCourse.code,
        color: updatedCourse.color,
        professor: updatedCourse.professor,
        credits: updatedCourse.credits,
        semester: updatedCourse.semester,
        description: updatedCourse.description,
      };
      const res = await fetch(`${API_BASE_URL}/courses/${updatedCourse.id}`, {
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text style={styles.loadingText}>Chargement des cours...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Cours</Text>
        <TouchableOpacity style={styles.addButton} onPress={openModal} activeOpacity={0.7}>
          <Text style={styles.addButtonText}>＋</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        renderItem={renderCourse}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60A5FA" />}
        contentContainerStyle={courses.length === 0 ? styles.emptyListContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun cours pour l'instant</Text>
            <Text style={styles.emptySubText}>Ajoutez-en avec le bouton +</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouveau Cours</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom du cours"
              placeholderTextColor="#64748B"
              value={newCourseName}
              onChangeText={setNewCourseName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={closeModal} disabled={saving}>
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveCourse} disabled={saving}>
                <Text style={styles.modalButtonText}>{saving ? '...' : 'Enregistrer'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CourseEditModal
        visible={editModalVisible}
        course={selectedCourse}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedCourse(null);
        }}
        onSave={updateCourse}
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
  courseCard: { backgroundColor: '#1E293B', marginHorizontal: 16, marginVertical: 6, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  courseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  courseTitle: { fontSize: 18, fontWeight: '600', color: '#F1F5F9', flex: 1, marginRight: 12 },
  courseCode: { fontSize: 12, fontWeight: '600', color: '#60A5FA' },
  courseEdit: { marginLeft: 10, backgroundColor: '#3B82F6', padding: 6, borderRadius: 8 },
  courseDelete: { marginLeft: 10, backgroundColor: '#B91C1C', padding: 6, borderRadius: 8 },
  courseMeta: { fontSize: 12, color: '#94A3B8', marginBottom: 4 },
  courseDescription: { fontSize: 13, color: '#CBD5E1' },
  emptyListContainer: { flexGrow: 1, justifyContent: 'center', paddingBottom: 80 },
  emptyContainer: { alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#F1F5F9', marginBottom: 4 },
  emptySubText: { fontSize: 13, color: '#94A3B8' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 20 },
  modalContent: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#334155' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#F1F5F9', marginBottom: 12 },
  input: { backgroundColor: '#0F172A', color: '#F1F5F9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155', marginBottom: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginLeft: 12 },
  cancelButton: { backgroundColor: '#334155' },
  saveButton: { backgroundColor: '#2563EB' },
  modalButtonText: { color: '#F1F5F9', fontWeight: '600' },
});

export default CoursesScreen;
