import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { AppShell } from '../../src/components/layout/AppShell';
import { UniversalPracticePlayer } from '../../src/components/practices/UniversalPracticePlayer';
import { usePracticeStore } from '../../src/store/practiceStore';
import { Practice } from '../../src/types';

export default function GroundingScreen() {
  const router = useRouter();
  const { practices, toggleFavorite, recordCompletion } = usePracticeStore();

  const defaultGrounding =
    practices.find((p) => p.id === 'practice-grounding-54321') ||
    practices.find((p) => p.category === 'mindfulness') ||
    practices[0];

  const [activePractice, setActivePractice] = useState<Practice>(defaultGrounding);

  return (
    <AppShell>
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
