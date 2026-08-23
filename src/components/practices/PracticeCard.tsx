import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Wind, Heart, Square, Compass, Activity, Clock, Bookmark, Play } from 'lucide-react-native';
import { Practice } from '../../types';
import { useTheme } from '../../hooks/useTheme';

export interface PracticeCardProps {
  practice: Practice;
  onToggleFavorite?: (id: string) => void;
  onPress?: () => void;
}

export const PracticeCard: React.FC<PracticeCardProps> = ({
  practice,
  onToggleFavorite,
  onPress,
}) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const getIcon = () => {
    const size = 22;
    const color = colors.primary;
    switch (practice.icon) {
      case 'wind':
        return <Wind size={size} color={color} />;
      case 'heart':
        return <Heart size={size} color={color} />;
      case 'square':
        return <Square size={size} color={color} />;
      case 'compass':
        return <Compass size={size} color={color} />;
      case 'activity':
        return <Activity size={size} color={color} />;
      case 'clock':
      default:
        return <Clock size={size} color={color} />;
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (practice.category === 'breathing') {
      router.push('/practices/breathing');
    } else {
      router.push(`/practices/player/${practice.id}`);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Prática: ${practice.title}, duração ${practice.durationMinutes} minutos`}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconWrapper, { backgroundColor: colors.highlight }]}>
          {getIcon()}
        </View>

        <View style={styles.headerMeta}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: isDark ? '#23383B' : '#EAF5F1' }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>
                {practice.durationMinutes} min
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: isDark ? '#2D3740' : '#F1F5F9' }]}>
              <Text style={[styles.badgeText, { color: colors.textMuted }]}>{practice.level}</Text>
            </View>
          </View>
        </View>

        {onToggleFavorite && (
          <TouchableOpacity
            onPress={() => onToggleFavorite(practice.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={practice.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
            style={styles.favButton}
          >
            <Bookmark
              size={20}
              color={practice.isFavorite ? colors.primary : colors.textLight}
              fill={practice.isFavorite ? colors.primary : 'none'}
            />
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{practice.title}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={2}>
        {practice.subtitle || practice.description}
      </Text>

      <View style={styles.footerRow}>
        <Text style={[styles.completions, { color: colors.textMuted }]}>
          {practice.completedCount ? `${practice.completedCount} vezes realizada` : 'Novo exercício'}
        </Text>

        <View style={[styles.playButton, { backgroundColor: colors.primary }]}>
          <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={styles.playText}>Iniciar</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerMeta: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  favButton: {
    padding: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  completions: {
    fontSize: 12,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  playText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
