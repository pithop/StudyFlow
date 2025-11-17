/**
 * CoursesScreenNew - Light Mode Professional
 * 
 * Minimal course management with clean cards
 * Design: White background, blue accent, subtle shadows
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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuthHeaders } from '../hooks/useAuth';
import { colors, typography, spacing, borderRadius, shadows } from '../theme/design';
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

const CoursesScreenNew: React.FC = () => {
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
      await res.json();
      setModalVisible(false);
      setNewCourseName('');
      setLoading(true);
      load();
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const deleteCourse = async (course: Course) => {
    Alert.alert(
      'Supprimer le cours',
      `Êtes-vous sûr de vouloir supprimer "${course.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const headers = await getAuthHeaders();
              const res = await fetch(`${API_BASE_URL}/courses/${course.id}`, {
                method: 'DELETE',
                headers,
              });
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              await load();
            } catch (e: any) {
              setError(e.message || 'Erreur lors de la suppression');
            }
          },
        },
      ]
    );
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

  const renderCourse = ({ item }: { item: Course }) => {
    // Use custom color if set, otherwise default
    const courseColor = item.color || colors.primary;

    return (
      <View style={styles.courseCard}>
        {/* Color accent bar */}
        <View style={[styles.colorBar, { backgroundColor: courseColor }]} />

        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.courseHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.courseTitle}>{item.name}</Text>
              {item.code && (
                <View style={styles.codeTag}>
                  <Text style={styles.codeText}>{item.code}</Text>
                </View>
              )}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setSelectedCourse(item);
                  setEditModalVisible(true);
                }}
              >
                <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => deleteCourse(item)}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Metadata */}
          {(item.semester || item.professor || item.credits) && (
            <View style={styles.metaContainer}>
              {item.semester && (
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
                  <Text style={styles.metaText}>{item.semester}</Text>
                </View>
              )}
              {item.professor && (
                <View style={styles.metaItem}>
                  <Ionicons name="person-outline" size={14} color={colors.textTertiary} />
                  <Text style={styles.metaText}>{item.professor}</Text>
                </View>
              )}
              {item.credits && (
                <View style={styles.metaItem}>
                  <Ionicons name="school-outline" size={14} color={colors.textTertiary} />
                  <Text style={styles.metaText}>{item.credits} ECTS</Text>
                </View>
              )}
            </View>
          )}

          {/* Description */}
          {item.description && (
            <Text style={styles.courseDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement des cours...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mes Cours</Text>
          <Text style={styles.headerSubtitle}>{courses.length} cours</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openModal} activeOpacity={0.7}>
          <Ionicons name="add" size={24} color={colors.background} />
        </TouchableOpacity>
      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={20} color={colors.background} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Ionicons name="close" size={20} color={colors.background} />
          </TouchableOpacity>
        </View>
      )}

      {/* Course list */}
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        renderItem={renderCourse}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={courses.length === 0 ? styles.emptyListContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>Aucun cours</Text>
            <Text style={styles.emptySubText}>Ajoutez votre premier cours</Text>
          </View>
        }
      />

      {/* Add course modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouveau cours</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom du cours"
              placeholderTextColor={colors.textTertiary}
              value={newCourseName}
              onChangeText={setNewCourseName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeModal}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveCourse}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Créer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit course modal */}
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
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
  },
  errorText: {
    ...typography.bodySecondary,
    color: colors.background,
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
  },
  courseCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  colorBar: {
    height: 4,
  },
  cardContent: {
    padding: spacing.lg,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  courseTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  codeTag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  codeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  courseDescription: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.lg,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.backgroundSecondary,
    color: colors.text,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  modalButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '600',
  },
});

export default CoursesScreenNew;
