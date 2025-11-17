/**
 * StudyFlow App
 * 
 * Main entry point for the StudyFlow mobile application.
 * Renders the TodayScreen in a SafeAreaView with dark theme.
 */
import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import TodayScreen from './screens/TodayScreen';
import TasksScreen from './screens/TasksScreen';
import CoursesScreen from './screens/CoursesScreen';
import ProfileScreen from './screens/ProfileScreen';
import StatsScreen from './screens/StatsScreen';
import AuthSignIn from './screens/AuthSignIn';
import AuthSignUp from './screens/AuthSignUp';
import ImportScreen from './screens/ImportScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import supabase from './lib/supabase';
import React from 'react';

export default function App() {
  const Tab = createBottomTabNavigator();
  const Stack = createNativeStackNavigator();
  const [signedIn, setSignedIn] = React.useState<boolean>(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) setSignedIn(!!data.session);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSignedIn(!!session);
    });
    return () => { sub.subscription?.unsubscribe(); mounted = false; };
  }, []);

  const Tabs = () => (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: { backgroundColor: '#0F172A', borderTopColor: '#1E293B' },
          tabBarActiveTintColor: '#60A5FA',
          tabBarInactiveTintColor: '#64748B',
          tabBarIcon: ({ color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'ellipse-outline';
            switch (route.name) {
              case "Aujourd'hui": iconName = 'calendar-outline'; break;
              case 'Mes Tâches': iconName = 'list-outline'; break;
              case 'Mes Cours': iconName = 'book-outline'; break;
              case 'Statistiques': iconName = 'stats-chart-outline'; break;
              case 'Importer': iconName = 'cloud-upload-outline'; break;
              case 'Profil': iconName = 'person-outline'; break;
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Aujourd'hui" component={TodayScreen} />
        <Tab.Screen name="Mes Tâches" component={TasksScreen} />
        <Tab.Screen name="Mes Cours" component={CoursesScreen} />
        <Tab.Screen name="Statistiques" component={StatsScreen} />
        <Tab.Screen name="Importer" component={ImportScreen} />
        <Tab.Screen name="Profil" component={ProfileScreen} />
      </Tab.Navigator>
  );

  const Auth = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignIn">
        {() => <AuthSignIn onSignedIn={() => setSignedIn(true)} onGoSignUp={() => {}} />}
      </Stack.Screen>
      <Stack.Screen name="SignUp">
        {() => <AuthSignUp onSignedUp={() => setSignedIn(true)} onGoSignIn={() => {}} />}
      </Stack.Screen>
    </Stack.Navigator>
  );

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {signedIn ? <Tabs /> : <Auth />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
});
