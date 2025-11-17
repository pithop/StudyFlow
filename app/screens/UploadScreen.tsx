import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { getAuthHeaders } from '../hooks/useAuth';

const API_BASE_URL = 'http://172.20.10.2:5050/v1';

const UploadScreen: React.FC = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const upload = async (mode: 'pdf' | 'ics') => {
    try {
      setLoading(true); setStatus(null);
      const pick = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: mode === 'pdf' ? 'application/pdf' : 'text/calendar' });
      if (pick.canceled || !pick.assets?.length) { setLoading(false); return; }
      const file = pick.assets[0];

      // Prepare form data
      const form = new FormData();
      const fileName = file.name || (mode === 'pdf' ? 'syllabus.pdf' : 'calendar.ics');
      const fileData: any = { uri: file.uri, name: fileName, type: mode === 'pdf' ? 'application/pdf' : 'text/calendar' };
      // React Native FormData accepts { uri, name, type }
      form.append('file', fileData as any);

      // Auth header if available
      const headers = await getAuthHeaders();

      const url = mode === 'pdf'
        ? `${API_BASE_URL}/extract-deadlines`
        : `${API_BASE_URL}/import-ics`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          // Note: Don't set Content-Type for FormData in RN, it sets it automatically with boundary
        },
        body: form as any,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setStatus(`${json.count || 0} tâches détectées et insérées.`);
    } catch (e: any) {
      setStatus(e.message || 'Erreur d\'upload');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Importer</Text>
      <Text style={styles.subtitle}>Ajoutez des tâches depuis un PDF (syllabus) ou un calendrier .ics.</Text>

      {status ? (
        <View style={styles.statusBox}><Text style={styles.statusText}>{status}</Text></View>
      ) : null}

      <TouchableOpacity style={styles.button} onPress={() => upload('pdf')} disabled={loading}>
        {loading ? <ActivityIndicator color="#F1F5F9"/> : <Text style={styles.buttonText}>Importer un PDF</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonAlt} onPress={() => upload('ics')} disabled={loading}>
        {loading ? <ActivityIndicator color="#0F172A"/> : <Text style={styles.buttonAltText}>Importer un .ics</Text>}
      </TouchableOpacity>

      <Text style={styles.helper}>
        Astuce: Le PDF sera analysé pour détecter les deadlines. Le fichier .ics importera les événements comme tâches.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0F172A', padding: 20, justifyContent: 'center' },
  title: { color: '#F1F5F9', fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#94A3B8', marginBottom: 20 },
  button: { backgroundColor: '#2563EB', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#F1F5F9', fontWeight: '600' },
  buttonAlt: { backgroundColor: '#F1F5F9', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  buttonAltText: { color: '#0F172A', fontWeight: '700' },
  helper: { color: '#64748B', marginTop: 12 },
  statusBox: { backgroundColor: '#1E293B', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  statusText: { color: '#F1F5F9' },
});

export default UploadScreen;
