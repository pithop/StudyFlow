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
import * as DocumentPicker from 'expo-document-picker';
import { getAuthHeaders } from '../hooks/useAuth';

// API Configuration
const API_BASE_URL = 'http://172.20.10.2:5050/v1';

export default function ImportScreen() {
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
        Alert.alert('Succès', `${data.time_blocks_created} cours importés`);
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
          'Succès',
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
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Importer vos données</Text>
      <Text style={styles.subtitle}>
        Synchronisez automatiquement vos tâches depuis votre calendrier ICS ou un PDF
      </Text>

      {/* Annonce Moodle */}
      <View style={styles.announcement}>
        <Text style={styles.announcementTitle}>Moodle bientôt disponible</Text>
        <Text style={styles.announcementSub}>Fonctionnalité temporairement masquée (CAS).</Text>
      </View>

      {/* Moodle section is intentionally hidden due to CAS limitations */}

      {/* ICS Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 Calendrier ICS</Text>
        <Text style={styles.sectionDesc}>
          Importez votre emploi du temps pour bloquer automatiquement vos cours
        </Text>

        <TextInput
          style={styles.input}
          placeholder="URL du calendrier ICS"
          value={icsUrl}
          onChangeText={setIcsUrl}
          autoCapitalize="none"
          keyboardType="url"
        />

        <TouchableOpacity
          style={[styles.button, icsLoading && styles.buttonDisabled]}
          onPress={handleIcsSync}
          disabled={icsLoading}
        >
          {icsLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Importer le calendrier</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helpText}>
          💡 Exportez votre calendrier en format ICS depuis Google Calendar, Outlook, etc.
        </Text>
      </View>

      {/* PDF Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📄 PDF avec IA</Text>
        <Text style={styles.sectionDesc}>
          Uploadez un PDF et laissez l'IA extraire automatiquement les tâches
        </Text>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, pdfLoading && styles.buttonDisabled]}
          onPress={handlePdfUpload}
          disabled={pdfLoading}
        >
          {pdfLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>📎 Choisir un PDF</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helpText}>
          💡 L'IA analyse le contenu et détecte automatiquement les dates et tâches
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonSecondary: {
    backgroundColor: '#34C759',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  announcement: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  announcementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  announcementSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});
