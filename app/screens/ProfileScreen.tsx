/**
 * ProfileScreen
 *
 * Displays and updates user profile settings (study hours, preferred times).
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuthHeaders } from '../hooks/useAuth';
import supabase from '../lib/supabase';
import LevelProgressBar from '../components/LevelProgressBar';
import { loadPlayerStats, PlayerStats, BADGES, getUnlockedBadges, getLockedBadges } from '../utils/gamification';

const API_BASE_URL = 'http://172.20.10.2:5050/v1';

interface Profile {
  id: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  timezone?: string | null;
  study_hours_per_day?: number | null;
  preferred_study_start_time?: string | null;
  preferred_study_end_time?: string | null;
}

interface ProfileResponse {
  profile: Profile;
}

const ProfileScreen: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);

  const [fullName, setFullName] = useState('');
  const [studyHours, setStudyHours] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', onPress: async () => {
          await supabase.auth.signOut();
        }}
      ]
    );
  };

  const load = useCallback(async () => {
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/profile`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ProfileResponse = await res.json();
      setProfile(data.profile);
      setFullName(data.profile.full_name || '');
      setStudyHours(data.profile.study_hours_per_day?.toString() || '');
      setStartTime((data.profile.preferred_study_start_time || '09:00').slice(0,5));
      setEndTime((data.profile.preferred_study_end_time || '17:00').slice(0,5));
      
      // Load gamification stats
      const stats = await loadPlayerStats();
      setPlayerStats(stats);
    } catch (e: any) {
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const headers = await getAuthHeaders();
      const payload = {
        full_name: fullName.trim() || undefined,
        study_hours_per_day: studyHours ? parseInt(studyHours, 10) : undefined,
        preferred_study_start_time: startTime ? new Date(`1970-01-01T${startTime}:00Z`) : undefined,
        preferred_study_end_time: endTime ? new Date(`1970-01-01T${endTime}:00Z`) : undefined,
      };
      const res = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json();
      setSaving(false);
      load();
    } catch (e: any) {
      setSaving(false);
      setError(e.message || 'Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60A5FA" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60A5FA" />}
      >
        <Text style={styles.headerTitle}>Profil</Text>
        {error && (
          <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
        )}

        {/* Gamification Section */}
        {playerStats && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎮 Votre Progression</Text>
              <LevelProgressBar currentLevel={playerStats.currentLevel} totalXP={playerStats.totalXP} />
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle" size={28} color="#10B981" />
                <Text style={styles.statValue}>{playerStats.tasksCompleted}</Text>
                <Text style={styles.statLabel}>Tâches</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="flame" size={28} color="#F59E0B" />
                <Text style={styles.statValue}>{playerStats.currentStreak}</Text>
                <Text style={styles.statLabel}>Jours</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="timer" size={28} color="#8B5CF6" />
                <Text style={styles.statValue}>{playerStats.pomodoroSessions}</Text>
                <Text style={styles.statLabel}>Pomodoros</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏆 Badges ({getUnlockedBadges(playerStats).length}/{BADGES.length})</Text>
              <View style={styles.badgesGrid}>
                {[...getUnlockedBadges(playerStats), ...getLockedBadges(playerStats).slice(0, 6)].map((badge, index) => (
                  <View key={badge.id} style={[styles.badgeCard, !badge.unlocked && styles.badgeCardLocked]}>
                    <Ionicons 
                      name={badge.icon as any} 
                      size={32} 
                      color={badge.unlocked ? badge.color : '#475569'} 
                    />
                    <Text style={[styles.badgeName, !badge.unlocked && styles.badgeNameLocked]}>
                      {badge.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identité</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom complet"
            placeholderTextColor="#64748B"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Étude quotidienne</Text>
          <TextInput
            style={styles.input}
            placeholder="Heures d'étude par jour (ex: 4)"
            placeholderTextColor="#64748B"
            keyboardType="numeric"
            value={studyHours}
            onChangeText={setStudyHours}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disponibilités (heures locales)</Text>
          <View style={styles.inlineRow}>
            <TextInput
              style={[styles.input, styles.inlineInput]}
              placeholder="Début (HH:MM)"
              placeholderTextColor="#64748B"
              value={startTime}
              onChangeText={setStartTime}
            />
            <TextInput
              style={[styles.input, styles.inlineInput]}
              placeholder="Fin (HH:MM)"
              placeholderTextColor="#64748B"
              value={endTime}
              onChangeText={setEndTime}
            />
          </View>
          <Text style={styles.helperText}>Ces heures seront utilisées pour planifier la semaine.</Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={save} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? '...' : 'Sauvegarder'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scrollContent: { padding: 20, paddingBottom: 60 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#F1F5F9', marginBottom: 12 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#94A3B8' },
  errorBox: { marginBottom: 16, padding: 12, backgroundColor: '#B91C1C', borderRadius: 8 },
  errorText: { color: '#F1F5F9', fontSize: 14 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#F1F5F9', marginBottom: 12 },
  input: { backgroundColor: '#1E293B', color: '#F1F5F9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  inlineRow: { flexDirection: 'row', justifyContent: 'space-between' },
  inlineInput: { flex: 1, marginRight: 8 },
  helperText: { fontSize: 12, color: '#64748B' },
  saveButton: { backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  saveButtonText: { color: '#F1F5F9', fontWeight: '600', fontSize: 16 },
  logoutButton: { backgroundColor: '#B91C1C', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  logoutButtonText: { color: '#F1F5F9', fontWeight: '600', fontSize: 16 },
  statsGrid: { 
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 24,
  },
  statCard: { 
    flex: 1, 
    backgroundColor: '#1E293B', 
    borderRadius: 12, 
    padding: 16, 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
  },
  statValue: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: '#F1F5F9', 
    marginTop: 8,
  },
  statLabel: { 
    fontSize: 12, 
    color: '#94A3B8', 
    marginTop: 4,
    fontWeight: '600',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  badgeCardLocked: {
    borderColor: '#334155',
    opacity: 0.5,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F1F5F9',
    marginTop: 6,
    textAlign: 'center',
  },
  badgeNameLocked: {
    color: '#64748B',
  },
});

export default ProfileScreen;
