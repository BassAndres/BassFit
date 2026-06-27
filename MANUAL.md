# 📘 Manual de usuario — BassFit

Guía completa de la app de seguimiento de gimnasio **BassFit**. Cubre desde la
instalación hasta cada función, además de los conceptos de hipertrofia que usa
el motor inteligente.

---

## Índice

1. [Qué es BassFit](#1-qué-es-bassfit)
2. [Instalación y puesta en marcha](#2-instalación-y-puesta-en-marcha)
3. [Configurar Firebase](#3-configurar-firebase)
4. [Primer arranque: cuenta o invitado](#4-primer-arranque-cuenta-o-invitado)
5. [Mapa de la app](#5-mapa-de-la-app)
6. [Entrenar: el Live Workout Tracker](#6-entrenar-el-live-workout-tracker)
7. [Rutinas](#7-rutinas)
8. [Historial](#8-historial)
9. [Ejercicios y progreso](#9-ejercicios-y-progreso)
10. [Perfil y estadísticas](#10-perfil-y-estadísticas)
11. [Peso corporal](#11-peso-corporal)
12. [Ajustes](#12-ajustes)
13. [Conceptos: RIR, RPE, 1RM y sobrecarga progresiva](#13-conceptos-rir-rpe-1rm-y-sobrecarga-progresiva)
14. [Consejos de uso](#14-consejos-de-uso)
15. [Solución de problemas (FAQ)](#15-solución-de-problemas-faq)
16. [Privacidad y datos](#16-privacidad-y-datos)

---

## 1. Qué es BassFit

BassFit es una app móvil (iOS/Android, hecha con Expo + React Native) para
registrar tus entrenamientos de fuerza con una estética **idéntica a iOS**
(glassmorphism, tipografía San Francisco, haptics). Su rasgo diferencial es el
**Coach Inteligente**: tras cada serie te dice exactamente si subir, mantener o
bajar el peso, aplicando principios de **sobrecarga progresiva** para
hipertrofia. Reemplaza las funciones premium de apps como Hevy o Strong.

---

## 2. Instalación y puesta en marcha

**Requisitos:** Node 18+, y para verla en el móvil la app **Expo Go**
(App Store / Play Store) o un simulador iOS (Mac + Xcode) / emulador Android.

```bash
git clone https://github.com/BassAndres/BassFit.git
cd BassFit
npm install
cp .env.example .env     # rellena tus credenciales de Firebase (ver §3)
npm start
```

En la terminal de Expo:
- **`i`** → simulador iOS (requiere Mac + Xcode)
- **`a`** → emulador Android (requiere Android Studio)
- **Escanea el QR** con la cámara (iOS) o con Expo Go (Android) para usarla en tu móvil

Comandos útiles:
- `npm run typecheck` → comprueba tipos (TypeScript).
- `npm test` → ejecuta los tests del motor de sobrecarga y utilidades.

> Los `assets/*.png` incluidos son marcadores 1×1; sustitúyelos por tu icono y
> splash reales antes de publicar en tiendas.

---

## 3. Configurar Firebase

El login y el guardado en la nube necesitan un proyecto de Firebase (gratis).

1. Entra en [console.firebase.google.com](https://console.firebase.google.com) y crea un proyecto.
2. Añade una **app Web** y copia el bloque `firebaseConfig` a tu archivo `.env`:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   EXPO_PUBLIC_FIREBASE_SENDER_ID=...
   EXPO_PUBLIC_FIREBASE_APP_ID=...
   ```
3. **Authentication** → activa los métodos **Email/Password** y **Anonymous**.
4. **Cloud Firestore** → crea la base de datos y aplica reglas por usuario:
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

> **¿Solo quieres ver la app sin backend?** Pulsa **“Continuar como invitado”**.
> La navegación, el tracker, el coach, el temporizador y los haptics funcionan;
> únicamente el guardado en la nube y el historial requieren Firebase.

---

## 4. Primer arranque: cuenta o invitado

Al abrir la app por primera vez verás la pantalla de acceso:

- **Iniciar sesión** con email y contraseña.
- **Registrarme** (crea una cuenta nueva; puedes añadir tu nombre).
- **Continuar como invitado**: entra sin cuenta (modo anónimo). Tu sesión queda
  guardada en el dispositivo.

Tu sesión **persiste**: no tendrás que iniciar sesión cada vez que abras la app.

---

## 5. Mapa de la app

La barra inferior tiene 5 pestañas:

| Pestaña | Icono | Para qué sirve |
|---------|-------|----------------|
| **Inicio** | 🏋️ | Empezar entrenamiento, reanudar sesión, iniciar una rutina, ver lo reciente |
| **Historial** | 🕓 | Lista de todos tus entrenamientos guardados |
| **Ejercicios** | 💪 | Catálogo de ejercicios + progreso por ejercicio |
| **Rutinas** | 📋 | Crear, editar e iniciar plantillas de entrenamiento |
| **Perfil** | 👤 | Estadísticas, gráficas, peso corporal y ajustes |

---

## 6. Entrenar: el Live Workout Tracker

Es la pantalla principal. Se abre al pulsar **“Empezar entrenamiento vacío”**
(Inicio) o al iniciar una rutina.

### Empezar y nombrar
- El nombre de la sesión es editable: toca el título en la cabecera y escríbelo.
- El cronómetro de la cabecera muestra la **duración** en vivo.

### Añadir ejercicios
- Pulsa **“Añadir ejercicio”** (abajo). Se abre una hoja deslizable con físicas
  reales.
- **Busca** por nombre o filtra por **grupo muscular** con los chips.
- ¿No está el ejercicio? Pulsa **“＋ Crear”** para añadir uno **personalizado**
  (nombre, músculo y equipo). Queda guardado en tu catálogo.

### Registrar series
Cada ejercicio muestra una tabla con columnas **# · KG/LB · REPS · RIR · ✓**:
- Escribe el **peso**, las **reps** logradas y el **RIR** (reps en reserva).
- Pulsa **“+ Serie”** para añadir otra (copia los valores de la anterior).
- Marca la casilla **✓** para dar la serie por completada → vibración de
  confirmación y arranque del **temporizador de descanso**.

### Tipos de serie
Toca el **número de serie** para cambiar su tipo, en ciclo:
**Normal → Calentamiento (W) → Drop (D) → Fallo (F)**.
Las series de **calentamiento no cuentan** para el volumen ni para los récords.
> **Mantén pulsado** el número de serie para **eliminarla**.

### Calentamiento automático
Pulsa **“Calent.”** en un ejercicio (cuando ya tenga una serie con peso) y la
app generará una rampa de aproximación: **50%×8, 70%×5, 85%×3** del peso más
alto, insertada antes de tus series de trabajo.

### Temporizador de descanso
Al completar una serie aparece una barra flotante con cuenta atrás:
- **+15s** para añadir tiempo.
- **Saltar** para terminar el descanso.
(Se puede desactivar el arranque automático en Ajustes.)

### Coach Inteligente 🧠
Al marcar una serie, un banner sutil te da la recomendación para la **siguiente**:
- **Sube el peso** 💪 — lograste las reps con RIR alto (>2).
- **Mantén el peso** — buen estímulo, cerca del fallo (RIR 1–2).
- **Consolida la carga** — llegaste al fallo (RIR 0).
- **Completa el rango** — te faltó ~1 rep con algo en reserva.
- **Baja el peso** — fallaste el rango; reduce para cuidar la técnica.
Incluye el incremento exacto sugerido (p. ej. “+2.5 kg”).

### Récords personales (PR) 🏆
Si una serie supera tu mejor 1RM estimado o tu peso máximo histórico en ese
ejercicio, salta una felicitación de **récord personal** con vibración fuerte.

### Calculadora de discos 🏋️
Pulsa el botón **🏋️** (abajo a la izquierda). Introduce el peso objetivo y te
dice **qué discos cargar por lado**, según el peso de barra configurado.

### Reordenar y notas
- Usa **▲ / ▼** en la cabecera de cada ejercicio para reordenarlos.
- Cada ejercicio tiene un campo **“Nota…”** para apuntes (ajuste de máquina, etc.).

### Finalizar o descartar
- **Finalizar** (arriba a la derecha) → confirma y guarda la sesión en tu
  historial, mostrando volumen total, series y mejor 1RM. Necesitas al menos
  una serie completada.
- **Cancelar** (arriba a la izquierda) → descarta la sesión.

### Reanudar
Si cierras la app a mitad de un entrenamiento, **no se pierde**: al volver a
Inicio verás **“Entrenamiento en curso”** con un botón **Continuar**.

---

## 7. Rutinas

Plantillas reutilizables (tu “Push A”, “Pierna”, etc.).

- **Crear:** pestaña Rutinas → **“＋ Nueva”**. Pon nombre, añade ejercicios y
  ajusta por cada uno: **nº de series, reps objetivo, RIR objetivo y descanso**
  con los steppers **− / ＋**.
- **Editar:** toca una rutina.
- **Eliminar:** mantén pulsada una rutina.
- **Iniciar:** desde Inicio, pulsa una rutina y empieza una sesión ya
  **pre-poblada** con sus ejercicios y series.

---

## 8. Historial

Lista de todos los entrenamientos guardados, del más reciente al más antiguo.
- Tira hacia abajo para **refrescar**.
- Cada fila muestra fecha, nº de ejercicios, duración y volumen.
- Toca una sesión para ver el **detalle por serie** (peso × reps, RIR, 1RM).
- Dentro del detalle puedes **eliminar** el entrenamiento.

---

## 9. Ejercicios y progreso

Pestaña **Ejercicios**:
- **Catálogo** completo (los de serie + los tuyos personalizados), con buscador
  y filtro por músculo.
- Toca un ejercicio para ver su **progreso**:
  - **Mejor 1RM** y **peso máximo** históricos (récords).
  - **Gráfica** de 1RM estimado de las últimas sesiones.
  - **Historial** completo de ese movimiento (peso máximo × reps y volumen por día).

---

## 10. Perfil y estadísticas

Pestaña **Perfil**:
- Tu identidad (nombre / email / invitado).
- **Agregados de por vida:** sesiones, volumen total, series totales, mejor 1RM.
- **Gráfica de volumen por sesión** (tendencia).
- **Volumen por músculo** (distribución de tu trabajo).
- Acceso a **Peso corporal** y, con el icono ⚙️ (arriba a la derecha), a
  **Ajustes**.
- **Cerrar sesión**.

---

## 11. Peso corporal

Desde Perfil → **Peso corporal**:
- Escribe tu peso actual y pulsa **Registrar**.
- Verás una **gráfica de tendencia** y la lista de registros.
- **Mantén pulsado** un registro para eliminarlo.
- Se muestra en tu unidad (kg/lb) según Ajustes.

---

## 12. Ajustes

Perfil → ⚙️:
- **Unidad de peso:** kg / lb (afecta a toda la app; los datos se guardan en kg).
- **Tema:** Sistema / Claro / Oscuro.
- **Iniciar descanso automáticamente:** activa/desactiva el temporizador al
  completar una serie.
- **Descanso por defecto:** tiempo base para nuevos ejercicios.
- **Haptics:** activa/desactiva las vibraciones.
- **Peso de la barra:** usado por la calculadora de discos (por defecto 20 kg).

---

## 13. Conceptos: RIR, RPE, 1RM y sobrecarga progresiva

- **RIR (Reps In Reserve):** cuántas repeticiones te quedaban “en el tanque” al
  acabar la serie. `RIR 0` = fallo muscular; `RIR 3` = podrías haber hecho 3 más.
  Es la base de la **autorregulación**: ajustas la carga según cómo te sientes.
- **RPE (Rate of Perceived Exertion):** esfuerzo percibido (1–10).
  Aproximadamente `RPE = 10 − RIR`.
- **1RM estimado:** el peso teórico que moverías **una sola vez**. BassFit lo
  calcula con la fórmula de **Epley**: `1RM = peso × (1 + reps/30)`.
- **Sobrecarga progresiva:** para crecer (hipertrofia) hay que aumentar el
  estímulo con el tiempo (más peso, más reps o más series). El Coach aplica
  **doble progresión**: primero llenas el rango de reps con buen RIR, luego
  subes el peso.
- **Volumen:** `peso × reps` sumado de las series efectivas; es uno de los
  motores principales de la hipertrofia. Las series de calentamiento se excluyen.

---

## 14. Consejos de uso

- Sé honesto con el **RIR**: es lo que alimenta las sugerencias del Coach.
- Marca tus calentamientos como tipo **W** para que no inflen tu volumen ni
  falseen tus récords.
- Usa **rutinas** para no montar la sesión desde cero cada día.
- Revisa **Ejercicios → progreso** cada pocas semanas para confirmar que tu 1RM
  sube; si se estanca, considera variar reps, descanso o ejercicio.
- Registra tu **peso corporal** 1–2 veces por semana, en ayunas, para una
  tendencia fiable.

---

## 15. Solución de problemas (FAQ)

**No puedo iniciar sesión / no se guardan los entrenamientos.**
Revisa que tu `.env` tiene las credenciales correctas y que activaste
Authentication y Firestore en Firebase (§3). Sin configurar, usa el modo
invitado para probar la UI.

**Inicié sesión como invitado y quiero conservar mis datos.**
Los datos de invitado viven en esa cuenta anónima del dispositivo. Para no
perderlos al reinstalar, crea una cuenta con email desde el principio.

**El temporizador de descanso no aparece.**
Actívalo en Ajustes → “Iniciar descanso automáticamente”, y asegúrate de que el
ejercicio tiene un descanso > 0.

**Cambié a libras pero el historial antiguo se ve raro.**
Todo se guarda internamente en kg y se convierte al mostrarse; cambiar de unidad
no altera tus datos.

**Cerré la app y perdí el entrenamiento.**
No debería: la sesión activa se guarda automáticamente. Vuelve a Inicio y pulsa
**Continuar** en “Entrenamiento en curso”.

---

## 16. Privacidad y datos

- Tus datos (rutinas, entrenamientos, ejercicios personalizados, peso corporal)
  se guardan **bajo tu usuario** en tu propio proyecto de Firestore.
- Las reglas recomendadas (§3) impiden que un usuario lea o escriba los datos de
  otro.
- El peso siempre se almacena en **kilogramos**; la unidad es solo de
  visualización.

---

¿Dudas o ideas de mejora? Abre un issue en el repositorio. ¡A entrenar! 💪
