import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ShieldCheck,
  FileText,
  Wind,
  FolderTree,
  Users,
  History,
  Plus,
  Lock,
  Eye,
  CheckCircle,
} from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { AppButton } from '../../src/components/ui/AppButton';
import { AppInput } from '../../src/components/ui/AppInput';
import { useAuth } from '../../src/hooks/useAuth';
import { useContentStore } from '../../src/store/contentStore';
import { usePracticeStore } from '../../src/store/practiceStore';
import { useTheme } from '../../src/hooks/useTheme';
import { MOCK_ADMIN_LOGS, MOCK_SANITIZED_USERS } from '../../src/mocks/adminLogs.mock';
import { formatDate, formatDateTime } from '../../src/utils/date';
import { contentService } from '../../src/services/content/contentService';
import { practiceService } from '../../src/services/practice/practiceService';

type AdminTab = 'articles' | 'practices' | 'users' | 'logs';

export default function AdminScreen() {
  const router = useRouter();
  const { user, isAdmin, updateUser } = useAuth();
  const { colors, isDark } = useTheme();
  const { articles, fetchArticles } = useContentStore();
  const { practices, fetchPractices } = usePracticeStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('articles');

  // Form states para criação
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleCreateArticle = async () => {
    if (!newTitle.trim() || !newSummary.trim() || !newContent.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos do artigo');
      return;
    }

    try {
      setIsSubmitting(true);
      await contentService.createArticle({
        title: newTitle.trim(),
        summary: newSummary.trim(),
        content: newContent.trim(),
        category: 'basics',
        categoryName: 'Fundamentos',
        readTimeMinutes: 3,
        author: user?.name || 'Administrador',
        tags: ['Geral', 'Psicoeducação'],
      });

      await fetchArticles();
      setNewTitle('');
      setNewSummary('');
      setNewContent('');
      setShowArticleForm(false);
      setActionSuccess('Artigo publicado com sucesso!');
      setTimeout(() => setActionSuccess(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAdminDemo = () => {
    if (!user) return;
    const nextRole = isAdmin ? 'user' : 'admin';
    updateUser({ role: nextRole });
  };

  return (
    <ScreenContainer scrollable>
      <AppHeader showBack title="Painel Administrativo" />

      {/* Barra de Controle de Permissão Demonstrativa */}
      <View
        style={[
          styles.roleBar,
          {
            backgroundColor: isDark ? colors.surfaceSubtle : colors.highlight,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={18} color={colors.primary} />
            <Text style={[styles.roleTitle, { color: colors.primaryDark }]}>
              Modo Atual: {isAdmin ? 'Administrador' : 'Usuário Padrão'}
            </Text>
          </View>
          <Text style={[styles.roleSub, { color: colors.textMuted }]}>
            {isAdmin
              ? 'Acesso total de gestão de conteúdos e auditoria de sistema.'
              : 'Alternar para testar a proteção de acesso a esta área.'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleToggleAdminDemo}
          style={[styles.toggleRoleBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.toggleRoleText}>
            {isAdmin ? 'Mudar p/ Usuário' : 'Tornar Admin'}
          </Text>
        </TouchableOpacity>
      </View>

      {actionSuccess && (
        <View style={[styles.successBanner, { backgroundColor: colors.highlight }]}>
          <CheckCircle size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.successText, { color: colors.primaryDark }]}>{actionSuccess}</Text>
        </View>
      )}

      {/* Se não for admin, bloqueia visualização de dados */}
      {!isAdmin ? (
        <View style={[styles.lockedCard, { backgroundColor: colors.surfaceSubtle }]}>
          <Lock size={44} color={colors.error} style={{ marginBottom: 12 }} />
          <Text style={[styles.lockedTitle, { color: colors.text }]}>Área Restrita</Text>
          <Text style={[styles.lockedDesc, { color: colors.textMuted }]}>
            Este painel é acessível apenas para contas com perfil de administrador. Toque no botão
            acima para alternar o perfil na demonstração.
          </Text>
        </View>
      ) : (
        <>
          {/* Navegação entre Abas do Admin */}
          <View style={styles.tabsRow}>
            {[
              { id: 'articles', label: 'Artigos', icon: FileText },
              { id: 'practices', label: 'Práticas', icon: Wind },
              { id: 'users', label: 'Usuários (LGPD)', icon: Users },
              { id: 'logs', label: 'Logs', icon: History },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id as AdminTab)}
                  style={[
                    styles.tabBtn,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : isDark
                          ? colors.surfaceSubtle
                          : '#FFFFFF',
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Icon size={14} color={isSelected ? '#FFFFFF' : colors.text} />
                  <Text
                    style={[
                      styles.tabBtnText,
                      { color: isSelected ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Aba: Artigos */}
          {activeTab === 'articles' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Gestão de Conteúdos ({articles.length})
                </Text>
                <TouchableOpacity
                  onPress={() => setShowArticleForm((prev) => !prev)}
                  style={[styles.smallActionBtn, { backgroundColor: colors.primary }]}
                >
                  <Plus size={14} color="#FFFFFF" />
                  <Text style={styles.smallActionText}>
                    {showArticleForm ? 'Fechar' : 'Novo Artigo'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Formulário de Criação de Artigo */}
              {showArticleForm && (
                <View
                  style={[
                    styles.formBox,
                    {
                      backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.formTitle, { color: colors.text }]}>
                    Cadastrar Novo Artigo
                  </Text>
                  <AppInput
                    label="Título do Artigo"
                    placeholder="Ex: Como o corpo reage ao estresse"
                    value={newTitle}
                    onChangeText={setNewTitle}
                  />
                  <AppInput
                    label="Resumo breve"
                    placeholder="Uma síntese de 2 a 3 linhas"
                    value={newSummary}
                    onChangeText={setNewSummary}
                  />
                  <AppInput
                    label="Conteúdo completo"
                    placeholder="Texto formatado do artigo..."
                    value={newContent}
                    onChangeText={setNewContent}
                    multiline
                    numberOfLines={4}
                    inputStyle={{ minHeight: 90, textAlignVertical: 'top' }}
                  />
                  <AppButton
                    title="Publicar Artigo"
                    onPress={handleCreateArticle}
                    isLoading={isSubmitting}
                    size="md"
                  />
                </View>
              )}

              {/* Lista de Artigos Cadastrados */}
              {articles.map((art) => (
                <View
                  key={art.id}
                  style={[
                    styles.itemCard,
                    {
                      backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>{art.title}</Text>
                    <Text style={[styles.itemSub, { color: colors.textMuted }]}>
                      {art.categoryName} • {formatDate(art.publishedAt)} • {art.author}
                    </Text>
                  </View>
                  <View style={[styles.publishedBadge, { backgroundColor: colors.highlight }]}>
                    <Text style={[styles.publishedBadgeText, { color: colors.primaryDark }]}>
                      Publicado
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Aba: Práticas */}
          {activeTab === 'practices' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Práticas Cadastradas ({practices.length})
              </Text>
              {practices.map((p) => (
                <View
                  key={p.id}
                  style={[
                    styles.itemCard,
                    {
                      backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>{p.title}</Text>
                    <Text style={[styles.itemSub, { color: colors.textMuted }]}>
                      {p.durationMinutes} min • {p.level} • {p.completedCount ?? 0} conclusões
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Aba: Usuários (Com sigilo e sanitização LGPD) */}
          {activeTab === 'users' && (
            <View style={styles.section}>
              <View style={[styles.privacyBanner, { backgroundColor: colors.highlight }]}>
                <Text style={[styles.privacyBannerText, { color: colors.primaryDark }]}>
                  Proteção de Dados Pessoais: Administradores visualizam apenas estatísticas
                  anonimizadas. Anotações pessoais de diário e conversas de chat são
                  estritamente confidenciais e inacessíveis.
                </Text>
              </View>

              {MOCK_SANITIZED_USERS.map((u) => (
                <View
                  key={u.id}
                  style={[
                    styles.itemCard,
                    {
                      backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>{u.name}</Text>
                    <Text style={[styles.itemSub, { color: colors.textMuted }]}>
                      {u.emailMasked} • Cadastrado em {u.createdAt}
                    </Text>
                    <Text style={[styles.itemSub, { color: colors.primary }]}>
                      {u.totalCheckins} check-ins • Visto por último: {u.lastActive}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Aba: Logs Administrativos */}
          {activeTab === 'logs' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Logs de Auditoria do Sistema
              </Text>
              {MOCK_ADMIN_LOGS.map((log) => (
                <View
                  key={log.id}
                  style={[
                    styles.logCard,
                    {
                      backgroundColor: isDark ? colors.surfaceSubtle : '#FFFFFF',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.logHeader}>
                    <Text style={[styles.logAction, { color: colors.primary }]}>
                      {log.action}
                    </Text>
                    <Text style={[styles.logTime, { color: colors.textMuted }]}>
                      {formatDateTime(log.timestamp)}
                    </Text>
                  </View>
                  <Text style={[styles.logTarget, { color: colors.text }]}>{log.target}</Text>
                  <Text style={[styles.logIp, { color: colors.textMuted }]}>
                    IP Mascarado: {log.ipAddressMasked}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  roleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginVertical: 12,
  },
  roleTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  roleSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  toggleRoleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginLeft: 10,
  },
  toggleRoleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  successText: {
    fontSize: 13,
    fontWeight: '600',
  },
  lockedCard: {
    alignItems: 'center',
    padding: 36,
    borderRadius: 24,
    marginVertical: 32,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  lockedDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 12,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  section: {
    marginVertical: 12,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  smallActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  formBox: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  publishedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  publishedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  privacyBanner: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
  },
  privacyBannerText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  logCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logAction: {
    fontSize: 12,
    fontWeight: '800',
  },
  logTime: {
    fontSize: 11,
  },
  logTarget: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  logIp: {
    fontSize: 11,
  },
});
