import React, { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useContentStore } from '../../src/store/contentStore';
import { useTheme } from '../../src/hooks/useTheme';

export default function ArticleRedirectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { articles } = useContentStore();

  useEffect(() => {
    if (id) {
      const found = articles.find((a) => a.id === id || a.slug === id);
      if (found) {
        router.replace(`/contents/${found.slug || found.id}` as any);
      } else {
        router.replace(`/contents/${id}` as any);
      }
    }
  }, [id, articles, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  );
}
