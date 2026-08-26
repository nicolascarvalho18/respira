import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  badge?: React.ReactNode;
  style?: ViewStyle;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  rightAction,
  badge,
  style,
}) => {
  const router = useRouter();
  const { colors } = useTheme();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.headerContainer, style]}>
      <View style={styles.leftRow}>
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar para a tela anterior"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
        )}

        <View style={styles.titleWrap}>
          {badge && <View style={{ marginBottom: 6 }}>{badge}</View>}
          <Text
            accessibilityRole="header"
            aria-level={1}
            style={[styles.title, { color: colors.text }]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          )}
        </View>
      </View>

      {rightAction && <View style={styles.rightWrap}>{rightAction}</View>}
    </View>
  );
};

export interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onActionPress?: () => void;
  icon?: React.ReactNode;
  badge?: string;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionText,
  onActionPress,
  icon,
  badge,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.sectionContainer, style]}>
      <View style={styles.sectionTitleRow}>
        {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
        <Text
          accessibilityRole="header"
          aria-level={2}
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          {title}
        </Text>
        {badge && (
          <View style={[styles.sectionBadge, { backgroundColor: colors.highlight }]}>
            <Text style={[styles.sectionBadgeText, { color: colors.primaryDark }]}>{badge}</Text>
          </View>
        )}
      </View>

      {actionText && onActionPress && (
        <TouchableOpacity
          onPress={onActionPress}
          accessibilityRole="button"
          accessibilityLabel={actionText}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.actionText, { color: colors.primary }]}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 8,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
    lineHeight: 20,
  },
  rightWrap: {
    marginLeft: 12,
  },
  sectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
