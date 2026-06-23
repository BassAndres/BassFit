/**
 * Sign-in / sign-up gate. Email+password with a "continue as guest"
 * (anonymous) fallback so the app is usable immediately.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { usePalette, spacing, radius, typography } from '@/theme';
import { signInEmail, signUpEmail, signInGuest } from '@/services/authService';

type Mode = 'signIn' | 'signUp';

export function AuthScreen() {
  const { colors } = usePalette();
  const [mode, setMode] = useState<Mode>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(humanizeAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = () =>
    run(() =>
      mode === 'signIn'
        ? signInEmail(email, password)
        : signUpEmail(email, password, name || undefined)
    );

  const input = (
    placeholder: string,
    value: string,
    onChangeText: (t: string) => void,
    opts?: { secure?: boolean; email?: boolean }
  ) => (
    <TextInput
      style={[styles.input, { backgroundColor: colors.surface, color: colors.label, borderColor: colors.separator }]}
      placeholder={placeholder}
      placeholderTextColor={colors.tertiaryLabel}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={opts?.secure}
      autoCapitalize={opts?.email ? 'none' : 'words'}
      keyboardType={opts?.email ? 'email-address' : 'default'}
      autoCorrect={false}
    />
  );

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          <Text style={[styles.brand, { color: colors.label }]}>BassFit</Text>
          <Text style={[styles.tagline, { color: colors.secondaryLabel }]}>
            {mode === 'signIn' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </Text>

          {mode === 'signUp' && input('Nombre', name, setName)}
          {input('Email', email, setEmail, { email: true })}
          {input('Contraseña', password, setPassword, { secure: true })}

          {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

          <PrimaryButton
            label={mode === 'signIn' ? 'Iniciar sesión' : 'Registrarme'}
            onPress={onSubmit}
            disabled={busy || !email || password.length < 6}
            style={styles.cta}
          />

          <Pressable
            onPress={() => {
              setError(null);
              setMode((m) => (m === 'signIn' ? 'signUp' : 'signIn'));
            }}
            style={styles.switch}
          >
            <Text style={[styles.switchText, { color: colors.tint }]}>
              {mode === 'signIn'
                ? '¿No tienes cuenta? Regístrate'
                : '¿Ya tienes cuenta? Inicia sesión'}
            </Text>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.separator }]} />

          <PrimaryButton
            label="Continuar como invitado"
            variant="tinted"
            onPress={() => run(signInGuest)}
            disabled={busy}
          />

          {busy && <ActivityIndicator style={styles.spinner} color={colors.tint} />}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function humanizeAuthError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  if (code.includes('invalid-credential') || code.includes('wrong-password'))
    return 'Email o contraseña incorrectos.';
  if (code.includes('email-already-in-use')) return 'Ese email ya está registrado.';
  if (code.includes('invalid-email')) return 'Email no válido.';
  if (code.includes('weak-password')) return 'La contraseña debe tener 6+ caracteres.';
  if (code.includes('network')) return 'Sin conexión. Revisa tu red.';
  return 'No se pudo completar. Revisa tu configuración de Firebase.';
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.md },
  brand: { ...typography.largeTitle, textAlign: 'center' },
  tagline: { ...typography.body, textAlign: 'center', marginBottom: spacing.lg },
  input: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    ...typography.body,
  },
  error: { ...typography.footnote, textAlign: 'center' },
  cta: { marginTop: spacing.sm },
  switch: { alignItems: 'center', paddingVertical: spacing.sm },
  switchText: { ...typography.callout, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.md },
  spinner: { marginTop: spacing.md },
});
