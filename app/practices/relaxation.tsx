import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { AppShell } from '../../src/components/layout/AppShell';
import { UniversalPracticePlayer } from '../../src/components/practices/UniversalPracticePlayer';
import { usePracticeStore } from '../../src/store/practiceStore';
import { Practice } from '../../src/types';

export default function RelaxationScreen() {
  const router = useRouter();
  const { practices, toggleFavorite, recordCompletion } = usePracticeStore();

  const defaultRelax =
    practices.find((p) => p.id === 'practice-pmr-relaxation') ||
    practices.find((p) => p.category === 'relaxation') ||
    practices[0];

  const [activePractice, setActivePractice] = useState<Practice>(defaultRelax);

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
