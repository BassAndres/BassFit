# BassFit 🏋️

Seguimiento de gimnasio hiper-minimalista, con estética iOS nativa y un motor
de **sobrecarga progresiva** que reemplaza las funciones premium de Hevy/Strong.

Construido con **Expo + React Native + TypeScript**, **Firebase** (Firestore +
Auth), **Zustand**, **Reanimated**, **@gorhom/bottom-sheet**, **expo-blur** y
**expo-haptics**.

## Características

- **Live Workout Tracker** con tarjetas glassmorphism (light/dark automático).
- **Coach Inteligente**: tras cada serie, sugiere subir/mantener/bajar carga
  según reps logradas vs. objetivo y RIR (`useProgressiveOverload`).
- **Bottom sheet** con físicas reales para añadir ejercicios.
- **Haptics** en cada serie registrada.
- Cálculo de 1RM (Epley), volumen y mejores marcas por sesión.

## Puesta en marcha

```bash
npm install
cp .env.example .env   # rellena tus credenciales de Firebase
npm start              # luego pulsa i (iOS) o a (Android)
```

> Los `assets/*.png` incluidos son marcadores 1×1. Sustitúyelos por tu icono
> y splash reales antes de publicar.

## Arquitectura

```
src/
  types/models.ts              # Interfaces del dominio (Workout, Exercise, SetLog, Routine)
  hooks/useProgressiveOverload # Motor de sobrecarga progresiva (lógica pura + hook)
  store/workoutStore.ts        # Estado global de la sesión activa (Zustand)
  services/firebase.ts         # Init de Firebase + esquema Firestore documentado
  utils/strength.ts            # Matemática de fuerza (1RM, incrementos de plato)
  data/exerciseCatalog.ts      # Catálogo semilla de ejercicios
  components/                  # GlassCard, CoachBanner, SetRow
  screens/LiveWorkoutTracker   # Pantalla principal en sesión
  navigation/                  # Native stack
```

### Modelo de datos Firestore (NoSQL)

```
exercises/{exerciseId}                 # catálogo global compartido
users/{uid}/routines/{routineId}       # plantillas de rutina
users/{uid}/workouts/{workoutId}       # historial; los SetLog (peso, reps,
                                       # RIR, RPE, 1RM) se embeben dentro del
                                       # documento de la sesión
```

Los sets se **embeben** en cada workout (se leen/escriben como una unidad), y
el catálogo de ejercicios es una colección de nivel superior referenciada por
id, nunca duplicada.
