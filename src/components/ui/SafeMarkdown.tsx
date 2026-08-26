import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

export interface SafeMarkdownProps {
  content: string;
  fontSizeMultiplier?: number;
}

export interface InlineToken {
  type: 'text' | 'bold' | 'italic' | 'boldItalic' | 'code' | 'link';
  text: string;
  url?: string;
}

/**
 * Sanitizes input string to prevent script injection or malicious tags
 */
export function sanitizeMarkdown(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onload=/gi, '')
    .replace(/onerror=/gi, '');
}

/**
 * Parses inline markdown tokens: bold (**), italic (*), bold+italic (***), code (`), link ([text](url))
 */
export function parseInlineMarkdown(text: string): InlineToken[] {
  if (!text) return [];

  // Remove stray/trailing formatting asterisks at ends of lines
  const sanitized = text.replace(/\s+\*+$/, '').replace(/^\*+\s+/, '');

  const tokens: InlineToken[] = [];
  const regex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(sanitized)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        text: sanitized.slice(lastIndex, match.index),
      });
    }

    const matchedStr = match[0];

    if (matchedStr.startsWith('***') && matchedStr.endsWith('***')) {
      tokens.push({
        type: 'boldItalic',
        text: matchedStr.slice(3, -3),
      });
    } else if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      tokens.push({
        type: 'bold',
        text: matchedStr.slice(2, -2),
      });
    } else if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
      tokens.push({
        type: 'italic',
        text: matchedStr.slice(1, -1),
      });
    } else if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      tokens.push({
        type: 'code',
        text: matchedStr.slice(1, -1),
      });
    } else if (matchedStr.startsWith('[') && matchedStr.includes('](')) {
      const closingBracket = matchedStr.indexOf('](');
      const label = matchedStr.slice(1, closingBracket);
      const url = matchedStr.slice(closingBracket + 2, -1);
      tokens.push({
        type: 'link',
        text: label,
        url: url.startsWith('http') ? url : undefined,
      });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < sanitized.length) {
    const remaining = sanitized.slice(lastIndex).replace(/\*+$/, '');
    if (remaining) {
      tokens.push({
        type: 'text',
        text: remaining,
      });
    }
  }

  return tokens.length > 0 ? tokens : [{ type: 'text', text: sanitized }];
}

export const SafeMarkdown: React.FC<SafeMarkdownProps> = ({
  content,
  fontSizeMultiplier = 1.0,
}) => {
  const { colors, isDark } = useTheme();

  const sanitizedContent = sanitizeMarkdown(content);
  const blocks = sanitizedContent.split(/\n\n+/);

  const renderInlineTokens = (
    tokens: InlineToken[],
    baseFontSize: number,
    baseColor: string,
    keyPrefix: string
  ) => {
    return tokens.map((tok, idx) => {
      const key = `${keyPrefix}-${idx}`;

      if (tok.type === 'bold') {
        return (
          <Text
            key={key}
            style={{
              fontWeight: '700',
              color: isDark ? colors.text : '#173D3B',
              fontSize: baseFontSize,
            }}
          >
            {tok.text}
          </Text>
        );
      }

      if (tok.type === 'italic') {
        return (
          <Text
            key={key}
            style={{
              fontStyle: 'italic',
              color: baseColor,
              fontSize: baseFontSize,
            }}
          >
            {tok.text}
          </Text>
        );
      }

      if (tok.type === 'boldItalic') {
        return (
          <Text
            key={key}
            style={{
              fontWeight: '700',
              fontStyle: 'italic',
              color: isDark ? colors.text : '#173D3B',
              fontSize: baseFontSize,
            }}
          >
            {tok.text}
          </Text>
        );
      }

      if (tok.type === 'code') {
        return (
          <Text
            key={key}
            style={{
              fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
              backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF',
              color: '#2F7F7C',
              fontSize: baseFontSize * 0.9,
              paddingHorizontal: 4,
              borderRadius: 4,
            }}
          >
            {tok.text}
          </Text>
        );
      }

      if (tok.type === 'link' && tok.url) {
        return (
          <Text
            key={key}
            onPress={() => tok.url && Linking.openURL(tok.url)}
            accessibilityRole="link"
            style={{
              color: '#2F7F7C',
              textDecorationLine: 'underline',
              fontSize: baseFontSize,
              fontWeight: '600',
            }}
          >
            {tok.text}
          </Text>
        );
      }

      return (
        <Text key={key} style={{ color: baseColor, fontSize: baseFontSize }}>
          {tok.text}
        </Text>
      );
    });
  };

  return (
    <View
      style={styles.container}
      {...(Platform.OS === 'web' ? ({ role: 'region', 'aria-label': 'Conteúdo do artigo' } as any) : {})}
    >
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // 1. Heading 2 (## Title)
        if (trimmed.startsWith('## ')) {
          const headingText = trimmed.replace(/^##\s+/, '');
          return (
            <View
              key={bIdx}
              style={styles.sectionWrap}
              {...(Platform.OS === 'web' ? ({ role: 'region' } as any) : {})}
            >
              <Text
                accessibilityRole="header"
                aria-level={2}
                style={[
                  styles.h2,
                  {
                    color: isDark ? colors.text : '#173D3B',
                    fontSize: 20 * fontSizeMultiplier,
                    lineHeight: 28 * fontSizeMultiplier,
                  },
                ]}
              >
                {headingText}
              </Text>
            </View>
          );
        }

        // 2. Heading 3 (### Title)
        if (trimmed.startsWith('### ')) {
          const headingText = trimmed.replace(/^###\s+/, '');
          return (
            <View
              key={bIdx}
              style={styles.sectionWrap}
              {...(Platform.OS === 'web' ? ({ role: 'region' } as any) : {})}
            >
              <Text
                accessibilityRole="header"
                aria-level={3}
                style={[
                  styles.h3,
                  {
                    color: isDark ? colors.text : '#173D3B',
                    fontSize: 17 * fontSizeMultiplier,
                    lineHeight: 24 * fontSizeMultiplier,
                  },
                ]}
              >
                {headingText}
              </Text>
            </View>
          );
        }

        // 3. Heading 4 (#### Title)
        if (trimmed.startsWith('#### ')) {
          const headingText = trimmed.replace(/^####\s+/, '');
          return (
            <View key={bIdx} style={styles.sectionWrap}>
              <Text
                accessibilityRole="header"
                aria-level={4}
                style={[
                  styles.h4,
                  {
                    color: isDark ? colors.text : '#173D3B',
                    fontSize: 15 * fontSizeMultiplier,
                    lineHeight: 22 * fontSizeMultiplier,
                  },
                ]}
              >
                {headingText}
              </Text>
            </View>
          );
        }

        // 4. Callout / Notice Box (*Aviso:* ou >)
        if (
          trimmed.startsWith('*Aviso:') ||
          trimmed.startsWith('Aviso:') ||
          trimmed.startsWith('> ')
        ) {
          const calloutText = trimmed
            .replace(/^\*Aviso:\s*/i, '')
            .replace(/^Aviso:\s*/i, '')
            .replace(/^>\s*/, '')
            .replace(/\*+$/, '')
            .trim();

          const tokens = parseInlineMarkdown(calloutText);

          return (
            <View
              key={bIdx}
              style={[
                styles.calloutCard,
                {
                  backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF',
                  borderColor: isDark ? colors.border : '#C7E5DC',
                },
              ]}
              {...(Platform.OS === 'web' ? ({ role: 'note', 'aria-label': 'Aviso importante' } as any) : {})}
            >
              <ShieldCheck
                size={18}
                color="#2F7F7C"
                style={{ marginTop: 2, marginRight: 10 }}
                aria-hidden={true}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.calloutHeading,
                    { color: '#2F7F7C', fontSize: 13 * fontSizeMultiplier },
                  ]}
                >
                  Aviso Educativo
                </Text>
                <Text
                  style={[
                    styles.calloutContent,
                    {
                      color: isDark ? colors.text : '#3A504E',
                      fontSize: 13 * fontSizeMultiplier,
                      lineHeight: 20 * fontSizeMultiplier,
                    },
                  ]}
                >
                  {renderInlineTokens(
                    tokens,
                    13 * fontSizeMultiplier,
                    isDark ? colors.text : '#3A504E',
                    `callout-${bIdx}`
                  )}
                </Text>
              </View>
            </View>
          );
        }

        // 5. Unordered List (- item or * item) or Ordered List (1. item)
        const lines = trimmed.split('\n');
        const isList = lines.every(
          (line) =>
            /^\s*[-*•]\s+/.test(line) ||
            /^\s*\d+\.\s+/.test(line) ||
            line.trim().length === 0
        );

        if (isList) {
          const isOrdered = lines.some((l) => /^\s*\d+\.\s+/.test(l));

          return (
            <View
              key={bIdx}
              style={styles.listContainer}
              {...(Platform.OS === 'web' ? ({ role: isOrdered ? 'list' : 'list' } as any) : {})}
            >
              {lines.map((line, lIdx) => {
                const lineTrim = line.trim();
                if (!lineTrim) return null;

                const lineIsOrdered = /^\d+\.\s+/.test(lineTrim);
                let bullet = '•';
                let itemText = lineTrim;

                if (lineIsOrdered) {
                  const matchNum = lineTrim.match(/^(\d+\.)\s+/);
                  if (matchNum) {
                    bullet = matchNum[1];
                    itemText = lineTrim.slice(matchNum[0].length);
                  }
                } else {
                  itemText = lineTrim.replace(/^[-*•]\s+/, '');
                }

                const tokens = parseInlineMarkdown(itemText);

                return (
                  <View
                    key={lIdx}
                    style={styles.listItemRow}
                    {...(Platform.OS === 'web' ? ({ role: 'listitem' } as any) : {})}
                  >
                    <Text
                      style={[
                        styles.listBullet,
                        {
                          color: '#2F7F7C',
                          fontSize: (lineIsOrdered ? 13 : 15) * fontSizeMultiplier,
                          minWidth: lineIsOrdered ? 22 : 14,
                        },
                      ]}
                      aria-hidden={true}
                    >
                      {bullet}
                    </Text>
                    <Text
                      style={[
                        styles.listItemText,
                        {
                          color: isDark ? colors.text : '#2C4A47',
                          fontSize: 15 * fontSizeMultiplier,
                          lineHeight: 24 * fontSizeMultiplier,
                        },
                      ]}
                    >
                      {renderInlineTokens(
                        tokens,
                        15 * fontSizeMultiplier,
                        isDark ? colors.text : '#2C4A47',
                        `list-${bIdx}-${lIdx}`
                      )}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        }

        // 6. Regular Paragraph with mixed inline tokens
        const tokens = parseInlineMarkdown(trimmed);

        return (
          <Text
            key={bIdx}
            style={[
              styles.paragraph,
              {
                color: isDark ? colors.text : '#2C4A47',
                fontSize: 15 * fontSizeMultiplier,
                lineHeight: 26 * fontSizeMultiplier,
              },
            ]}
          >
            {renderInlineTokens(
              tokens,
              15 * fontSizeMultiplier,
              isDark ? colors.text : '#2C4A47',
              `p-${bIdx}`
            )}
          </Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 680,
  },
  sectionWrap: {
    marginTop: 18,
    marginBottom: 8,
  },
  h2: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  h3: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  h4: {
    fontWeight: '700',
  },
  paragraph: {
    marginBottom: 16,
  },
  calloutCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginVertical: 14,
  },
  calloutHeading: {
    fontWeight: '700',
    marginBottom: 3,
  },
  calloutContent: {
    fontWeight: '500',
  },
  listContainer: {
    marginVertical: 8,
    gap: 8,
    marginBottom: 16,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listBullet: {
    fontWeight: '700',
    marginRight: 6,
    marginTop: 1,
  },
  listItemText: {
    flex: 1,
  },
});
