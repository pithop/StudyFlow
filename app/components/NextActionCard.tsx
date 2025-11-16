/**
 * NextActionCard Component
 * 
 * Displays the next most important task/action for the student.
 * Styled with dark theme as per design specifications.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface NextActionCardProps {
  title: string;
  reason?: string;
  onPress: () => void;
}

const NextActionCard: React.FC<NextActionCardProps> = ({ title, reason, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.label}>NEXT ACTION</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {reason && <Text style={styles.reason}>{reason}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B', // Dark background
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#60A5FA', // Blue accent
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F1F5F9', // Light text
    marginBottom: 8,
    lineHeight: 32,
  },
  reason: {
    fontSize: 14,
    color: '#94A3B8', // Muted text
    lineHeight: 20,
  },
});

export default NextActionCard;
