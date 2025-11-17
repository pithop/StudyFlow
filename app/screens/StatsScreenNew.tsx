/**
 * StatsScreen - Light Mode Professional
 * Cartes statistiques minimalistes (pas de couleurs vives)
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { getAuthHeaders } from '../hooks/useAuth';
import { colors, typography, spacing, borderRadius, shadows, components } from '../theme/design';
import { LineChart, PieChart } from 'react-native-chart-kit';

// API Configuration
const API_BASE_URL = 'http://172.20.10.2:5050/v1';

const screenWidth = Dimensions.get('window').width;

interface Stats {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  completion_rate: number;
  avg_completion_time: number;
  tasks_this_week: number;
}

export default function StatsScreenNew() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const headers = await getAuthHeaders();
      // TODO: Créer endpoint stats dans le backend
      // Pour l'instant, données mockées
      setStats({
        total_tasks: 47,
        completed_tasks: 32,
        pending_tasks: 15,
        completion_rate: 68,
        avg_completion_time: 85,
        tasks_this_week: 12,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistiques</Text>
        <Text style={styles.headerSubtitle}>Votre progression</Text>
      </View>

      {/* Today's Overview - Cartes KPI minimalistes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vue d'ensemble</Text>

        <View style={styles.kpiGrid}>
          {/* Total Tasks */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{stats?.total_tasks || 0}</Text>
            <Text style={styles.kpiLabel}>Total tâches</Text>
            <View style={styles.kpiIcon}>
              <Text style={styles.kpiEmoji}>📋</Text>
            </View>
          </View>

          {/* Completed */}
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: colors.success }]}>
              {stats?.completed_tasks || 0}
            </Text>
            <Text style={styles.kpiLabel}>Terminées</Text>
            <View style={styles.kpiIcon}>
              <Text style={styles.kpiEmoji}>✅</Text>
            </View>
          </View>

          {/* Pending */}
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: colors.high }]}>
              {stats?.pending_tasks || 0}
            </Text>
            <Text style={styles.kpiLabel}>En cours</Text>
            <View style={styles.kpiIcon}>
              <Text style={styles.kpiEmoji}>⏳</Text>
            </View>
          </View>

          {/* This Week */}
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: colors.primary }]}>
              {stats?.tasks_this_week || 0}
            </Text>
            <Text style={styles.kpiLabel}>Cette semaine</Text>
            <View style={styles.kpiIcon}>
              <Text style={styles.kpiEmoji}>📅</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Completion Rate */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Taux de complétion</Text>

        <View style={styles.chartCard}>
          <View style={styles.completionHeader}>
            <Text style={styles.completionValue}>{stats?.completion_rate}%</Text>
            <Text style={styles.completionLabel}>de vos tâches terminées</Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${stats?.completion_rate || 0}%` },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Tasks by Type - Pie Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Répartition par type</Text>

        <View style={styles.chartCard}>
          <PieChart
            data={[
              {
                name: 'Devoirs',
                population: 15,
                color: colors.primary,
                legendFontColor: colors.textSecondary,
              },
              {
                name: 'Projets',
                population: 8,
                color: colors.high,
                legendFontColor: colors.textSecondary,
              },
              {
                name: 'Examens',
                population: 5,
                color: colors.urgent,
                legendFontColor: colors.textSecondary,
              },
              {
                name: 'TP/TD',
                population: 12,
                color: colors.success,
                legendFontColor: colors.textSecondary,
              },
            ]}
            width={screenWidth - spacing.md * 2}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
          />
        </View>
      </View>

      {/* Activity This Week - Line Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activité de la semaine</Text>

        <View style={styles.chartCard}>
          <LineChart
            data={{
              labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
              datasets: [
                {
                  data: [3, 5, 2, 4, 6, 1, 2],
                  color: (opacity = 1) => colors.primary,
                  strokeWidth: 3,
                },
              ],
            }}
            width={screenWidth - spacing.md * 2 - spacing.md * 2}
            height={220}
            chartConfig={{
              backgroundColor: colors.background,
              backgroundGradientFrom: colors.background,
              backgroundGradientTo: colors.background,
              decimalPlaces: 0,
              color: (opacity = 1) => colors.primary,
              labelColor: (opacity = 1) => colors.textSecondary,
              style: {
                borderRadius: borderRadius.md,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: colors.primary,
                fill: colors.background,
              },
            }}
            bezier
            style={{
              marginVertical: spacing.sm,
            }}
          />
        </View>
      </View>

      {/* Spacer */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h1,
  },
  headerSubtitle: {
    ...typography.bodySecondary,
    marginTop: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  kpiCard: {
    ...components.card,
    flex: 1,
    minWidth: (screenWidth - spacing.md * 2 - spacing.sm) / 2 - spacing.sm / 2,
    paddingVertical: spacing.lg,
    position: 'relative',
  },
  kpiValue: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  kpiLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  kpiIcon: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    opacity: 0.3,
  },
  kpiEmoji: {
    fontSize: 24,
  },
  chartCard: {
    ...components.card,
    padding: spacing.lg,
  },
  completionHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  completionValue: {
    ...typography.h1,
    fontSize: 48,
    color: colors.primary,
  },
  completionLabel: {
    ...typography.bodySecondary,
    marginTop: spacing.xs,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
});
