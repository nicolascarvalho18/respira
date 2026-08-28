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
 * Normaliza fórmulas matemáticas LaTeX simples para texto limpo e legível.
 */
export function cleanLatexFormulas(text: string): string {
  if (!text) return '';
  return text.replace(/\$\$\\text\{([^}]+)\}\s*=\s*\\text\{([^}]+)\}\s*\\times\s*\\text\{([^}]+)\}\$\$/g, '$1 = $2 × $3')
    .replace(/\$\$([^$]+)\$\$/g, '$1')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\times/g, '×');
}

/**
 * Parses inline markdown and HTML tokens:
 * - <strong>texto</strong>, <b>texto</b>, **texto**
 * - <em>texto</em>, <i>texto</i>, *texto*
 * - <strong><em>texto</em></strong>, ***texto***
 * - `code`
 * - [label](url)
 */
export function parseInlineMarkdown(text: string): InlineToken[] {
  if (!text) return [];

  // Remove LaTeX wrappers se houver e remove asteriscos soltos no início/fim
  let cleaned = cleanLatexFormulas(text);

  const tokens: InlineToken[] = [];
  // Regex que reconhece tags HTML e marcações de markdown de forma segura e não gulosa
  const regex = /(<strong><em>[\s\S]+?<\/em><\/strong>|<em><strong>[\s\S]+?<\/strong><\/em>|\*\*\*[\s\S]+?\*\*\*|<strong>[\s\S]+?<\/strong>|<b>[\s\S]+?<\/b>|\*\*[\s\S]+?\*\*|<em>[\s\S]+?<\/em>|<i>[\s\S]+?<\/i>|\*[^*\n]+?\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      // Texto normal intermediário (limpa asteriscos residuais)
      const rawPiece = cleaned.slice(lastIndex, match.index).replace(/\*/g, '');
      if (rawPiece) {
        tokens.push({
          type: 'text',
          text: rawPiece,
        });
      }
    }

    const matchedStr = match[0];

    // Bold + Italic
    if (
      (matchedStr.toLowerCase().startsWith('<strong><em>') && matchedStr.toLowerCase().endsWith('</em></strong>')) ||
      (matchedStr.toLowerCase().startsWith('<em><strong>') && matchedStr.toLowerCase().endsWith('</strong></em>'))
    ) {
      const inner = matchedStr.replace(/<\/?(strong|em|b|i)>/gi, '').replace(/\*/g, '');
      tokens.push({ type: 'boldItalic', text: inner });
    } else if (matchedStr.startsWith('***') && matchedStr.endsWith('***') && matchedStr.length >= 6) {
      tokens.push({ type: 'boldItalic', text: matchedStr.slice(3, -3) });
    }
    // Bold: <strong>, <b>, **
    else if (matchedStr.toLowerCase().startsWith('<strong>') && matchedStr.toLowerCase().endsWith('</strong>')) {
      const inner = matchedStr.slice(8, -9).replace(/\*/g, '');
      tokens.push({ type: 'bold', text: inner });
    } else if (matchedStr.toLowerCase().startsWith('<b>') && matchedStr.toLowerCase().endsWith('</b>')) {
      const inner = matchedStr.slice(3, -4).replace(/\*/g, '');
      tokens.push({ type: 'bold', text: inner });
    } else if (matchedStr.startsWith('**') && matchedStr.endsWith('**') && matchedStr.length >= 4) {
      tokens.push({ type: 'bold', text: matchedStr.slice(2, -2) });
    }
    // Italic: <em>, <i>, *
    else if (matchedStr.toLowerCase().startsWith('<em>') && matchedStr.toLowerCase().endsWith('</em>')) {
      const inner = matchedStr.slice(4, -5).replace(/\*/g, '');
      tokens.push({ type: 'italic', text: inner });
    } else if (matchedStr.toLowerCase().startsWith('<i>') && matchedStr.toLowerCase().endsWith('</i>')) {
      const inner = matchedStr.slice(3, -4).replace(/\*/g, '');
      tokens.push({ type: 'italic', text: inner });
    } else if (matchedStr.startsWith('*') && matchedStr.endsWith('*') && matchedStr.length >= 2 && !matchedStr.startsWith('**')) {
      tokens.push({ type: 'italic', text: matchedStr.slice(1, -1) });
    }
    // Code: `
    else if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      tokens.push({ type: 'code', text: matchedStr.slice(1, -1) });
    }
    // Link: [label](url)
    else if (matchedStr.startsWith('[') && matchedStr.includes('](')) {
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

  if (lastIndex < cleaned.length) {
    const remaining = cleaned.slice(lastIndex).replace(/\*/g, '');
    if (remaining) {
      tokens.push({
        type: 'text',
        text: remaining,
      });
    }
  }

  return tokens.length > 0 ? tokens : [{ type: 'text', text: cleaned.replace(/\*/g, '') }];
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
          const headingText = trimmed.replace(/^##\s+/, '').replace(/\*\*/g, '').replace(/<\/?strong>/gi, '');
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
          const headingText = trimmed.replace(/^###\s+/, '').replace(/\*\*/g, '').replace(/<\/?strong>/gi, '');
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
          const headingText = trimmed.replace(/^####\s+/, '').replace(/\*\*/g, '').replace(/<\/?strong>/gi, '');
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
          trimmed.startsWith('<em>Aviso:') ||
          trimmed.startsWith('<strong>Aviso:') ||
          trimmed.startsWith('> ')
        ) {
          const calloutText = trimmed
            .replace(/^\*Aviso:\s*/i, '')
            .replace(/^Aviso:\s*/i, '')
            .replace(/^<em>Aviso:\s*<\/em>\s*/i, '')
            .replace(/^<strong>Aviso:\s*<\/strong>\s*/i, '')
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

        // 5. Bloco de Fórmula Matemática LaTeX
        if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
          const formulaClean = cleanLatexFormulas(trimmed);
          return (
            <View
              key={bIdx}
              style={[
                styles.formulaCard,
                {
                  backgroundColor: isDark ? colors.surfaceSecondary : '#F2F8F6',
                  borderColor: isDark ? colors.border : '#D5E6E1',
                },
              ]}
            >
              <Text
                style={[
                  styles.formulaText,
                  {
                    color: isDark ? '#5ECFC3' : '#238C82',
                    fontSize: 15 * fontSizeMultiplier,
                  },
                ]}
              >
                {formulaClean}
              </Text>
            </View>
          );
        }

        // 6. Unordered List (- item or * item) or Ordered List (1. item)
        const rawLines = trimmed.split('\n');
        // Se todas as linhas forem itens de lista ou se for um bloco misto de introdução + lista:
        const isPureList = rawLines.every(
          (line) =>
            /^\s*[-*•]\s+/.test(line) ||
            /^\s*\d+\.\s+/.test(line) ||
            line.trim().length === 0
        );

        if (isPureList) {
          const isOrdered = rawLines.some((l) => /^\s*\d+\.\s+/.test(l));

          return (
            <View
              key={bIdx}
              style={styles.listContainer}
              {...(Platform.OS === 'web' ? ({ role: 'list' } as any) : {})}
            >
              {rawLines.map((line, lIdx) => {
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

        // 7. Regular Paragraph (se contiver quebras de linha com listas embutidas, renderiza cada linha com espaçamento)
        return (
          <View key={bIdx} style={styles.paragraphWrap}>
            {rawLines.map((line, lIdx) => {
              const lineTrim = line.trim();
              if (!lineTrim) return null;

              // Linha que começa com bullet ou número
              const isListItem = /^\s*[-*•]\s+/.test(lineTrim);
              const isNumItem = /^\s*\d+\.\s+/.test(lineTrim);

              if (isListItem || isNumItem) {
                let bullet = '•';
                let itemText = lineTrim;

                if (isNumItem) {
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
                  <View key={`line-${lIdx}`} style={styles.listItemRow}>
                    <Text
                      style={[
                        styles.listBullet,
                        {
                          color: '#2F7F7C',
                          fontSize: (isNumItem ? 13 : 15) * fontSizeMultiplier,
                          minWidth: isNumItem ? 22 : 14,
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
                        `paralist-${bIdx}-${lIdx}`
                      )}
                    </Text>
                  </View>
                );
              }

              const tokens = parseInlineMarkdown(lineTrim);

              return (
                <Text
                  key={`line-${lIdx}`}
                  style={[
                    styles.paragraph,
                    {
                      color: isDark ? colors.text : '#2C4A47',
                      fontSize: 15 * fontSizeMultiplier,
                      lineHeight: 25 * fontSizeMultiplier,
                      marginBottom: lIdx === rawLines.length - 1 ? 0 : 8,
                    },
                  ]}
                >
                  {renderInlineTokens(
                    tokens,
                    15 * fontSizeMultiplier,
                    isDark ? colors.text : '#2C4A47',
                    `p-${bIdx}-${lIdx}`
                  )}
                </Text>
              );
            })}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  sectionWrap: {
    marginTop: 18,
    marginBottom: 8,
  },
  h2: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h3: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  h4: {
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  paragraphWrap: {
    marginBottom: 16,
  },
  paragraph: {
    fontWeight: '400',
  },
  formulaCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formulaText: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  calloutCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 14,
  },
  calloutHeading: {
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calloutContent: {
    fontWeight: '400',
  },
  listContainer: {
    marginVertical: 8,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 4,
  },
  listBullet: {
    fontWeight: '700',
    marginTop: 1,
    marginRight: 6,
  },
  listItemText: {
    flex: 1,
    fontWeight: '400',
  },
});
