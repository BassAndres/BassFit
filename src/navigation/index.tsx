/**
 * Navigation tree.
 *
 *  RootStack (native stack)
 *   ├─ Tabs (bottom tabs): Home · History · Routines · Profile
 *   ├─ LiveWorkout      (full-screen modal — the in-session tracker)
 *   ├─ WorkoutDetail    (pushed card)
 *   └─ RoutineEditor    (pushed card)
 */
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { usePalette } from '@/theme';
import { HomeScreen } from '@/screens/HomeScreen';
import { HistoryScreen } from '@/screens/HistoryScreen';
import { RoutinesScreen } from '@/screens/RoutinesScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { LiveWorkoutTracker } from '@/screens/LiveWorkoutTracker';
import { WorkoutDetailScreen } from '@/screens/WorkoutDetailScreen';
import { RoutineEditorScreen } from '@/screens/RoutineEditorScreen';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const ICONS: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'barbell',
  History: 'time',
  Routines: 'list',
  Profile: 'person',
};

function Tabs() {
  const { colors } = usePalette();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.secondaryLabel,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.separator,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Historial' }} />
      <Tab.Screen name="Routines" component={RoutinesScreen} options={{ title: 'Rutinas' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen
        name="LiveWorkout"
        component={LiveWorkoutTracker}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="WorkoutDetail"
        component={WorkoutDetailScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="RoutineEditor"
        component={RoutineEditorScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
