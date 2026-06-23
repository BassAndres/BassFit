/**
 * Root navigation. A native-stack so transitions feel like UIKit.
 * Kept minimal per the brief; add screens (History, Routines, Profile) here.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LiveWorkoutTracker } from '@/screens/LiveWorkoutTracker';

export type RootStackParamList = {
  LiveWorkout: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="LiveWorkout"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="LiveWorkout" component={LiveWorkoutTracker} />
    </Stack.Navigator>
  );
}
