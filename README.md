# BassFit 🏋️

Seguimiento de gimnasio hiper-minimalista, con estética iOS nativa y un motor
de **sobrecarga progresiva** que reemplaza las funciones premium de Hevy/Strong.

Construido con **Expo + React Native + TypeScript**, **Firebase** (Firestore +
Auth), **Zustand**, **Reanimated**, **@gorhom/bottom-sheet**, **expo-blur** y
**expo-haptics**.

## Características

- **Autenticación**: email/contraseña + modo invitado (anónimo), con sesión
  persistente (AsyncStorage).
- **Navegación por tabs**: Inicio · Historial · Rutinas · Perfil.
- **Live Workout Tracker** con tarjetas glassmorphism (light/dark automático),
  bottom sheet con físicas reales para añadir ejercicios y haptics en cada serie.
- **Coach Inteligente**: tras cada serie, sugiere subir/mantener/bajar carga
  según reps logradas vs. objetivo y RIR (`useProgressiveOverload`).
- **Temporizador de descanso** flotante con +15s / saltar y barra de progreso.
- **Rutinas**: crear, editar e iniciar una sesión pre-poblada desde una rutina.
- **Historial** persistido en Firestore, con detalle por serie y borrado.
- **Perfil** con agregados de por vida (volumen, series, mejor 1RM) y gráfico
  de volumen por sesión.
- Cálculo de 1RM (Epley), volumen y mejores marcas por sesión.

## Puesta en marcha

```bash
npm install
cp .env.example .env   # rellena tus credenciales de Firebase
npm start              # luego pulsa i (iOS) o a (Android)
```

> Los `assets/*.png` incluidos son marcadores 1×1. Sustitúyelos por tu icono
> y splash reales antes de publicar.

### Configurar Firebase

1. Crea un proyecto en la [consola de Firebase](https://console.firebase.google.com/).
2. Añade una **app Web** y copia las credenciales a tu `.env`.
3. Activa **Authentication** → métodos *Email/Password* y *Anonymous*.
4. Crea una base de datos **Cloud Firestore** (modo producción) y aplica reglas
   por usuario, por ejemplo:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{db}/documents {
       match /users/{uid}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
       match /exercises/{id} {
         allow read: if request.auth != null;
       }
     }
   }
   ```

## Arquitectura

```
src/
  types/models.ts              # Interfaces del dominio (Workout, Exercise, SetLog, Routine)
  hooks/
    useProgressiveOverload.ts  # Motor de sobrecarga progresiva (lógica pura + hook)
    useRestTimer.ts            # Cuenta atrás de descanso
  store/
    workoutStore.ts            # Estado de la sesión activa (Zustand)
    authStore.ts               # Estado de autenticación (Zustand + listener Firebase)
  services/
    firebase.ts                # Init de Firebase + esquema Firestore documentado
    authService.ts             # Wrapper de Firebase Auth
    workoutRepository.ts       # CRUD de sesiones
    routineRepository.ts       # CRUD de rutinas
  utils/
    strength.ts                # Matemática de fuerza (1RM, incrementos de plato)
    format.ts                  # Formateadores (duración, fecha, volumen)
  data/exerciseCatalog.ts      # Catálogo semilla de ejercicios
  components/                  # GlassCard, CoachBanner, SetRow, RestTimerBar,
                               # PrimaryButton, StatPill, BarChart, Screen
  screens/                     # Auth, Home, History, WorkoutDetail, Routines,
                               # RoutineEditor, Profile, LiveWorkoutTracker
  navigation/                  # Root stack + bottom tabs
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
