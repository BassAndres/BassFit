/** First-launch intro. Sets `onboarded` so it only shows once. */
import React, { useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { usePalette, spacing, typography } from '@/theme';
import { useSettingsStore } from '@/store/settingsStore';

const { width } = Dimensions.get('window');

const SLIDES: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    icon: 'barbell',
    title: 'Registra como un pro',
    body: 'Series, reps, RIR y 1RM con una interfaz nativa iOS, rápida y minimalista.',
  },
  {
    icon: 'trending-up',
    title: 'Coach de sobrecarga',
    body: 'Tras cada serie te dice si subir, mantener o bajar el peso, con el incremento exacto.',
  },
  {
    icon: 'body',
    title: 'Modelo 3D del músculo',
    body: 'Cada ejercicio muestra en 3D qué músculo trabaja, con técnica y dónde sentirlo.',
  },
  {
    icon: 'trophy',
    title: 'Progreso y récords',
    body: 'Historial, rutinas, récords personales y gráficas para no estancarte nunca.',
  },
];

export function OnboardingScreen() {
  const { colors } = usePalette();
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const next = () => {
    if (page < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
    } else {
      setOnboarded(true);
    }
  };

  return (
    <Screen>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.flex}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.tint + '22' }]}>
              <Ionicons name={s.icon} size={64} color={colors.tint} />
            </View>
            <Text style={[styles.title, { color: colors.label }]}>{s.title}</Text>
            <Text style={[styles.body, { color: colors.secondaryLabel }]}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === page ? colors.tint : colors.separator, width: i === page ? 22 : 8 },
              ]}
            />
          ))}
        </View>
        <PrimaryButton label={page < SLIDES.length - 1 ? 'Siguiente' : 'Empezar'} onPress={next} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl, gap: spacing.lg },
  iconWrap: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.title1, textAlign: 'center' },
  body: { ...typography.body, textAlign: 'center', lineHeight: 24 },
  footer: { padding: spacing.xl, gap: spacing.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  dot: { height: 8, borderRadius: 4 },
});
