/**
 * StudyFlow App
 * 
 * Main entry point for the StudyFlow mobile application.
 * Renders the TodayScreen in a SafeAreaView with dark theme.
 */
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView } from 'react-native';
import TodayScreen from './screens/TodayScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <TodayScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Dark background matching TodayScreen
  },
});
