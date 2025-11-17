/**
 * StudyFlow App - Light Mode Professional
 * Navigation avec les nouveaux écrans refactored
 */
import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import supabase from './lib/supabase';
import React from 'react';

// New Light Mode Screens
import TodayScreenNew from './screens/TodayScreenNew';
import TasksScreenNew from './screens/TasksScreenNew';
import StatsScreenNew from './screens/StatsScreenNew';
import ProfileScreenNew from './screens/ProfileScreenNew';
import CoursesScreenNew from './screens/CoursesScreenNew';
import ImportScreenNew from './screens/ImportScreenNew';
import AuthSignInNew from './screens/AuthSignInNew';
import AuthSignUpNew from './screens/AuthSignUpNew';

// Theme
import { colors } from './theme/design';

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
    return () => {
      sub.subscription?.unsubscribe();
      mounted = false;
    };
  }, []);

  const Tabs = () => (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse-outline';

          switch (route.name) {
            case 'Today':
              iconName = focused ? 'today' : 'today-outline';
              break;
            case 'Tasks':
              iconName = focused ? 'checkmark-done-circle' : 'checkmark-done-circle-outline';
              break;
            case 'Courses':
              iconName = focused ? 'book' : 'book-outline';
              break;
            case 'Stats':
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
              break;
            case 'Import':
              iconName = focused ? 'cloud-upload' : 'cloud-upload-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreenNew}
        options={{ tabBarLabel: 'Today' }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreenNew}
        options={{ tabBarLabel: 'Tâches' }}
      />
      <Tab.Screen
        name="Courses"
        component={CoursesScreenNew}
        options={{ tabBarLabel: 'Cours' }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreenNew}
        options={{ tabBarLabel: 'Stats' }}
      />
      <Tab.Screen
        name="Import"
        component={ImportScreenNew}
        options={{ tabBarLabel: 'Import' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreenNew}
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );

  const Auth = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignIn">
        {() => <AuthSignInNew onSignedIn={() => setSignedIn(true)} onGoSignUp={() => {}} />}
      </Stack.Screen>
      <Stack.Screen name="SignUp">
        {() => <AuthSignUpNew onSignedUp={() => setSignedIn(true)} onGoSignIn={() => {}} />}
      </Stack.Screen>
    </Stack.Navigator>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="dark" />
        {signedIn ? <Tabs /> : <Auth />}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
