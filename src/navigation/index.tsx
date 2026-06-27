/**
 * Navigation tree.
 *
 *  RootStack (native stack)
 *   ├─ Tabs: Home · History · Exercises · Routines · Profile
 *   ├─ LiveWorkout      (full-screen modal — the in-session tracker)
 *   ├─ WorkoutDetail    (pushed card)
 *   ├─ ExerciseDetail   (pushed card)
 *   ├─ RoutineEditor    (modal)
 *   ├─ Bodyweight       (modal)
 *   └─ Settings         (modal)
 */
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { usePalette } from '@/theme';
import { useSettingsStore } from '@/store/settingsStore';
import { HomeScreen } from '@/screens/HomeScreen';
import { HistoryScreen } from '@/screens/HistoryScreen';
import { ExercisesScreen } from '@/screens/ExercisesScreen';
import { RoutinesScreen } from '@/screens/RoutinesScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { LiveWorkoutTracker } from '@/screens/LiveWorkoutTracker';
import { WorkoutDetailScreen } from '@/screens/WorkoutDetailScreen';
import { ExerciseDetailScreen } from '@/screens/ExerciseDetailScreen';
import { RoutineEditorScreen } from '@/screens/RoutineEditorScreen';
import { BodyweightScreen } from '@/screens/BodyweightScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { RecordsScreen } from '@/screens/RecordsScreen';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const ICONS: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'barbell',
  History: 'time',
  Exercises: 'fitness',
  Routines: 'list',
  Profile: 'person',
};

function Tabs() {
  const { colors } = usePalette();
  return (
    <Tab.Navigator
      screenListeners={{
        tabPress: () => {
          if (useSettingsStore.getState().haptics) Haptics.selectionAsync();
        },
      }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.secondaryLabel,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.separator },
        tabBarIcon: ({ color, size }) => <Ionicons name={ICONS[route.name]} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Historial' }} />
      <Tab.Screen name="Exercises" component={ExercisesScreen} options={{ title: 'Ejercicios' }} />
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
      <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
      <Stack.Screen name="RoutineEditor" component={RoutineEditorScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Bodyweight" component={BodyweightScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Records" component={RecordsScreen} options={{ presentation: 'card' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
