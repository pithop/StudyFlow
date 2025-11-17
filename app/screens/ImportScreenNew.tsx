/**
 * ImportScreenNew - Light Mode Professional
 * 
 * Clean import interface for ICS and PDF
 * Design: White cards, blue primary buttons, subtle icons
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { getAuthHeaders } from '../hooks/useAuth';
import { colors, typography, spacing, borderRadius, shadows } from '../theme/design';

// API Configuration
const API_BASE_URL = 'http://172.20.10.2:5050/v1';

export default function ImportScreenNew() {
  // ICS state
  const [icsUrl, setIcsUrl] = useState('');
  const [icsLoading, setIcsLoading] = useState(false);

  // PDF state
  const [pdfLoading, setPdfLoading] = useState(false);

  // ICS Sync
  const handleIcsSync = async () => {
    if (!icsUrl.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une URL ICS');
      return;
    }

    setIcsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/ics/sync`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ics_url: icsUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Succès ✅', `${data.time_blocks_created} cours importés`);
        setIcsUrl('');
      } else {
        Alert.alert('Erreur', data.detail || 'Erreur lors de l\'import ICS');
      }
    } catch (error) {
      console.error('ICS sync error:', error);
      Alert.alert('Erreur', 'Impossible de se connecter au serveur');
    } finally {
      setIcsLoading(false);
    }
  };

  // PDF Upload
  const handlePdfUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      setPdfLoading(true);

      const formData = new FormData();
      formData.append('file', {
        uri: result.assets[0].uri,
        name: result.assets[0].name,
        type: 'application/pdf',
      } as any);

      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/extract-deadlines`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Succès ✅',
          `${data.tasks.length} tâches extraites avec l'IA`
        );
      } else {
        Alert.alert('Erreur', data.detail || 'Erreur lors de l\'extraction');
      }
    } catch (error) {
      console.error('PDF upload error:', error);
      Alert.alert('Erreur', 'Impossible d\'importer le PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Importer</Text>
        <Text style={styles.headerSubtitle}>
          Synchronisez vos tâches depuis un calendrier ICS ou un PDF
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Announcement: Moodle */}
        <View style={styles.announcement}>
          <Ionicons name="megaphone" size={18} color={colors.textSecondary} />
          <Text style={styles.announcementText}>Moodle bientôt disponible</Text>
          <Text style={styles.announcementSub}>
            Fonctionnalité temporairement masquée (CAS). ICS et PDF restent disponibles.
          </Text>
        </View>

        {/* Moodle section is intentionally hidden due to CAS limitations */}

        {/* ICS Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="calendar" size={24} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Calendrier ICS</Text>
              <Text style={styles.sectionDesc}>
                Importez votre emploi du temps automatiquement
              </Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="link-outline" size={20} color={colors.textTertiary} />
            <TextInput
              style={styles.input}
              placeholder="URL du calendrier ICS"
              placeholderTextColor={colors.textTertiary}
              value={icsUrl}
              onChangeText={setIcsUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary, icsLoading && styles.buttonDisabled]}
            onPress={handleIcsSync}
            disabled={icsLoading}
            activeOpacity={0.7}
          >
            {icsLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <Ionicons name="cloud-download-outline" size={20} color={colors.background} />
                <Text style={styles.buttonText}>Importer le calendrier</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.helpBox}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} />
            <Text style={styles.helpText}>
              Exportez votre calendrier en format ICS depuis Google Calendar, Outlook, etc.
            </Text>
          </View>
        </View>

        {/* PDF Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="document-text" size={24} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>PDF avec IA</Text>
              <Text style={styles.sectionDesc}>
                L'IA extrait automatiquement les tâches et dates
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.buttonTertiary, pdfLoading && styles.buttonDisabled]}
            onPress={handlePdfUpload}
            disabled={pdfLoading}
            activeOpacity={0.7}
          >
            {pdfLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <Ionicons name="attach" size={20} color={colors.background} />
                <Text style={styles.buttonText}>Choisir un PDF</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.helpBox}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} />
            <Text style={styles.helpText}>
              L'IA analyse le contenu et détecte automatiquement les dates et tâches
            </Text>
          </View>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Ionicons name="sparkles" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Toutes les tâches importées sont analysées par l'IA pour optimiser votre planning
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  sectionDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  buttonSecondary: {
    backgroundColor: '#16A34A',
  },
  buttonTertiary: {
    backgroundColor: '#F59E0B',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '600',
  },
  helpBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
  },
  helpText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  infoText: {
    ...typography.bodySecondary,
    color: colors.primary,
    flex: 1,
    lineHeight: 20,
  },
  announcement: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  announcementText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  announcementSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
