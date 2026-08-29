import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppShell } from '../../src/components/layout/AppShell';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { UniversalPracticePlayer } from '../../src/components/practices/UniversalPracticePlayer';
import { usePracticeStore } from '../../src/store/practiceStore';
import { Practice } from '../../src/types';

export default function PracticeByIdScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { practices, toggleFavorite, recordCompletion } = usePracticeStore();

  const [activePractice, setActivePractice] = useState<Practice | null>(null);

  useEffect(() => {
    if (practices.length > 0) {
      if (id) {
        const found = practices.find((p) => p.id === id);
        if (found) {
          setActivePractice(found);
          return;
        }
      }
      setActivePractice(practices[0]);
    }
  }, [id, practices]);

  if (!activePractice) {
    return (
      <AppShell>
        <LoadingState message="Carregando prática..." />
      </AppShell>
    );
  }

  const handleSelectPractice = (nextP: Practice) => {
    setActivePractice(nextP);
    router.replace(`/practices/player/${nextP.id}` as any);
  };

  const handleBack = () => {
    router.replace('/(tabs)/practices');
  };

  return (
    <AppShell scrollable={false}>
      <UniversalPracticePlayer
        practice={activePractice}
        allPractices={practices}
        onSelectPractice={handleSelectPractice}
        onRecordCompletion={recordCompletion}
        onToggleFavorite={toggleFavorite}
        onBack={handleBack}
      />
    </AppShell>
  );
}
