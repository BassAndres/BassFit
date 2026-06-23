/** Centralized navigation param lists (shared by navigators and screens). */
import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Routines: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  LiveWorkout: undefined;
  WorkoutDetail: { workoutId: string };
  RoutineEditor: { routineId?: string } | undefined;
};
