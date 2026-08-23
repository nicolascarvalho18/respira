import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Wind, Heart, Square, Compass, Activity, Clock, Bookmark, Play } from 'lucide-react-native';
import { Practice } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { formatTimesRealized } from '../../utils/grammar';

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
    const size = 18;
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
    } else if (practice.id === 'practice-grounding-54321') {
      router.push('/practices/grounding' as any);
    } else if (practice.id === 'practice-pmr-relaxation') {
      router.push('/practices/relaxation' as any);
    } else {
      router.push(`/practices/player/${practice.id}`);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Prática: ${practice.title}, duração ${practice.durationMinutes} minutos`}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderColor: colors.border,
        },
      ]}
    >
      {/* Top row: Icon + Duration + Level + Favorite */}
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <View style={[styles.iconWrap, { backgroundColor: colors.highlight }]}>
            {getIcon()}
          </View>
          <View style={[styles.badge, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F5F4' }]}>
            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
              {practice.durationMinutes} min
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F5F4' }]}>
            <Text style={[styles.badgeText, { color: colors.textMuted }]}>{practice.level}</Text>
          </View>
        </View>

        {onToggleFavorite && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onToggleFavorite(practice.id);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={practice.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
            style={styles.favBtn}
          >
            <Bookmark
              size={17}
              color={practice.isFavorite ? colors.primary : colors.textLight}
              fill={practice.isFavorite ? colors.primary : 'none'}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Title & Subtitle */}
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {practice.title}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={2}>
        {practice.subtitle || practice.description}
      </Text>

      {/* Footer: Completion count + Play button */}
      <View style={styles.footerRow}>
        <Text style={[styles.completionsText, { color: colors.textMuted }]}>
          {formatTimesRealized(practice.completedCount || 0)}
        </Text>

        <View style={[styles.playBtn, { backgroundColor: colors.primary }]}>
          <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={styles.playBtnText}>Iniciar</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 12,
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  favBtn: {
    padding: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F4',
  },
  completionsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  playBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
