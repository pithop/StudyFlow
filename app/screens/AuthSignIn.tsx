import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import supabase from '../lib/supabase';

interface Props { onSignedIn?: () => void; onGoSignUp?: () => void; }

const AuthSignIn: React.FC<Props> = ({ onSignedIn, onGoSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setLoading(true); setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onSignedIn?.();
    } catch (e: any) {
      setError(e.message || 'Connexion échouée');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Se connecter</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#64748B"
        autoCapitalize='none'
        keyboardType='email-address'
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        placeholderTextColor="#64748B"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.button} onPress={signIn} disabled={loading}>
        {loading ? <ActivityIndicator color="#F1F5F9"/> : <Text style={styles.buttonText}>Connexion</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={onGoSignUp}>
        <Text style={styles.linkText}>Créer un compte</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 20, justifyContent: 'center' },
  title: { color: '#F1F5F9', fontSize: 24, fontWeight: '700', marginBottom: 16 },
  input: { backgroundColor: '#1E293B', color: '#F1F5F9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  button: { backgroundColor: '#2563EB', padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#F1F5F9', fontWeight: '600' },
  error: { color: '#FCA5A5', marginBottom: 8 },
  link: { marginTop: 12, alignItems: 'center' },
  linkText: { color: '#93C5FD' },
});

export default AuthSignIn;
