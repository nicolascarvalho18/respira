import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppShell } from '../../src/components/layout/AppShell';
import { UniversalPracticePlayer } from '../../src/components/practices/UniversalPracticePlayer';
import { usePracticeStore } from '../../src/store/practiceStore';
import { Practice } from '../../src/types';

export default function BreathingScreen() {
  const router = useRouter();
  const { tech } = useLocalSearchParams<{ tech?: string }>();
  const { practices, toggleFavorite, recordCompletion } = usePracticeStore();

  const defaultBreathing =
    practices.find((p) => (tech ? p.id.includes(tech) : p.id === 'practice-breathing-478')) ||
    practices.find((p) => p.category === 'breathing') ||
    practices[0];

  const [activePractice, setActivePractice] = useState<Practice>(defaultBreathing);

  useEffect(() => {
    if (tech && practices.length > 0) {
      const match = practices.find((p) => p.id.includes(tech));
      if (match) setActivePractice(match);
    }
  }, [tech, practices]);

  return (
    <AppShell scrollable={false}>
      <UniversalPracticePlayer
        practice={activePractice}
        allPractices={practices}
        onSelectPractice={(nextP) => setActivePractice(nextP)}
        onRecordCompletion={recordCompletion}
        onToggleFavorite={toggleFavorite}
        onBack={() => router.replace('/(tabs)/practices')}
      />
    </AppShell>
  );
}
