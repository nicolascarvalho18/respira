import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ShieldCheck,
  Users,
  FileText,
  Activity,
  History,
  Lock,
  Plus,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { PageHeader } from '../../src/components/ui/PageHeader';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { AppButton } from '../../src/components/ui/AppButton';
import { Chip } from '../../src/components/ui/Chip';
import { useAuth } from '../../src/hooks/useAuth';
import { useContentStore } from '../../src/store/contentStore';
import { usePracticeStore } from '../../src/store/practiceStore';
import { useTheme } from '../../src/hooks/useTheme';
import { MOCK_ADMIN_LOGS, MOCK_SANITIZED_USERS } from '../../src/mocks/adminLogs.mock';
import { formatDateTime } from '../../src/utils/date';

export default function AdminScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { articles } = useContentStore();
  const { practices } = usePracticeStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'articles' | 'practices' | 'users' | 'logs'>('overview');

  // Proteção rigorosa de papel: se não for admin, bloqueia
  if (user?.role !== 'admin') {
    return (
      <AppShell>
        <PageHeader showBack title="Acesso Restrito" />
        <Card variant="bordered" style={styles.accessDeniedCard}>
          <View style={[styles.deniedIconCircle, { backgroundColor: isDark ? '#3D1C1C' : '#FDF0F0' }]}>
            <Lock size={36} color={colors.error} />
          </View>
          <Text style={[styles.deniedTitle, { color: colors.error }]}>Acesso Não Autorizado</Text>
          <Text style={[styles.deniedMessage, { color: colors.textMuted }]}>
            Esta área é reservada para administradores e auditores credenciados do Respira.
          </Text>
          <AppButton
            title="Voltar ao Início"
            onPress={() => router.replace('/(tabs)')}
            size="md"
            style={{ marginTop: 16 }}
          />
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        showBack
        title="Painel Administrativo"
        subtitle="Gestão de conteúdos, práticas, auditoria e métricas anonimizadas."
        badge={<Badge label="Acesso Administrativo" variant="warning" size="sm" />}
      />

      {/* Tabs de Navegação Interna */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        <Chip
          label="Visão Geral"
          selected={activeTab === 'overview'}
          onPress={() => setActiveTab('overview')}
        />
        <Chip
          label={`Artigos (${articles.length})`}
          selected={activeTab === 'articles'}
          onPress={() => setActiveTab('articles')}
        />
        <Chip
          label={`Práticas (${practices.length})`}
          selected={activeTab === 'practices'}
          onPress={() => setActiveTab('practices')}
        />
        <Chip
          label="Usuários (LGPD)"
          selected={activeTab === 'users'}
          onPress={() => setActiveTab('users')}
        />
        <Chip
          label="Logs de Auditoria"
          selected={activeTab === 'logs'}
          onPress={() => setActiveTab('logs')}
        />
      </ScrollView>

      {/* 1. Visão Geral */}
      {activeTab === 'overview' && (
        <View style={styles.tabContent}>
          <View style={styles.metricsGrid}>
            <Card variant="bordered" style={styles.metricCard}>
              <Users size={22} color={colors.primary} />
              <Text style={styles.metricValue}>1.420</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Usuários Ativos</Text>
            </Card>

            <Card variant="bordered" style={styles.metricCard}>
              <Activity size={22} color={colors.secondary} />
              <Text style={styles.metricValue}>8.950</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Práticas Concluídas</Text>
            </Card>

            <Card variant="bordered" style={styles.metricCard}>
              <FileText size={22} color="#426E91" />
              <Text style={styles.metricValue}>{articles.length}</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Artigos Publicados</Text>
            </Card>

            <Card variant="bordered" style={styles.metricCard}>
              <History size={22} color="#D47754" />
              <Text style={styles.metricValue}>99.98%</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Disponibilidade</Text>
            </Card>
          </View>

          {/* Aviso Rigoroso de Privacidade LGPD */}
          <Card
            variant="bordered"
            style={
              StyleSheet.flatten([
                styles.privacyNoticeCard,
                {
                  backgroundColor: isDark ? colors.surfaceSecondary : '#EBF6F4',
                  borderColor: colors.primary,
                },
              ])
            }
          >
            <ShieldCheck size={24} color={colors.primary} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.privacyNoticeTitle, { color: colors.primaryDark }]}>
                Proteção Rigorosa de Dados e Sigilo Médico
              </Text>
              <Text style={[styles.privacyNoticeBody, { color: colors.text }]}>
                Em conformidade com a LGPD e princípios éticos de saúde, administradores visualizam
                apenas métricas agregadas e dados mascarados. Diários de humor pessoais e conversas
                são estritamente inacessíveis.
              </Text>
            </View>
          </Card>
        </View>
      )}

      {/* 2. Gestão de Artigos */}
      {activeTab === 'articles' && (
        <View style={styles.tabContent}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Artigos Cadastrados</Text>
            <AppButton
              title="Novo Artigo"
              leftIcon={<Plus size={16} color="#FFFFFF" />}
              size="sm"
              onPress={() => {}}
            />
          </View>

          {articles.map((art) => (
            <Card key={art.id} variant="bordered" style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Badge label={art.categoryName} variant="primary" size="sm" />
                <Text style={[styles.itemMeta, { color: colors.textMuted }]}>
                  {art.readTimeMinutes} min de leitura
                </Text>
              </View>
              <Text style={[styles.itemTitle, { color: colors.text }]}>{art.title}</Text>
              <Text style={[styles.itemDesc, { color: colors.textMuted }]} numberOfLines={2}>
                {art.summary}
              </Text>
            </Card>
          ))}
        </View>
      )}

      {/* 3. Catálogo de Práticas */}
      {activeTab === 'practices' && (
        <View style={styles.tabContent}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Práticas no Catálogo</Text>
            <AppButton
              title="Nova Prática"
              leftIcon={<Plus size={16} color="#FFFFFF" />}
              size="sm"
              onPress={() => {}}
            />
          </View>

          {practices.map((prac) => (
            <Card key={prac.id} variant="bordered" style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Badge label={prac.level} variant="success" size="sm" />
                <Text style={[styles.itemMeta, { color: colors.textMuted }]}>
                  {prac.durationMinutes} min • {prac.completedCount || 0} conclusões
                </Text>
              </View>
              <Text style={[styles.itemTitle, { color: colors.text }]}>{prac.title}</Text>
              <Text style={[styles.itemDesc, { color: colors.textMuted }]}>
                {prac.description}
              </Text>
            </Card>
          ))}
        </View>
      )}

      {/* 4. Usuários Anonimizados (LGPD) */}
      {activeTab === 'users' && (
        <View style={styles.tabContent}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
            Usuários Cadastrados (Dados Anonimizados)
          </Text>

          {MOCK_SANITIZED_USERS.map((usr) => (
            <Card key={usr.id} variant="bordered" style={styles.userCard}>
              <View style={styles.userCardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName, { color: colors.text }]}>{usr.name}</Text>
                  <Text style={[styles.userEmail, { color: colors.textMuted }]}>
                    E-mail mascarado: {usr.emailMasked}
                  </Text>
                  <Text style={[styles.userMeta, { color: colors.textMuted }]}>
                    Cadastro: {usr.createdAt} • Última atividade: {usr.lastActive}
                  </Text>
                </View>
                <Badge label={`${usr.totalCheckins} check-ins`} variant="primary" size="sm" />
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* 5. Logs de Auditoria */}
      {activeTab === 'logs' && (
        <View style={styles.tabContent}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
            Trilha de Auditoria do Sistema
          </Text>

          {MOCK_ADMIN_LOGS.map((log) => (
            <Card key={log.id} variant="bordered" style={styles.logCard}>
              <View style={styles.logHeader}>
                <Badge label={log.action} variant="info" size="sm" />
                <Text style={[styles.logTime, { color: colors.textMuted }]}>
                  {formatDateTime(log.timestamp)}
                </Text>
              </View>
              <Text style={[styles.logTarget, { color: colors.text }]}>{log.target}</Text>
              <Text style={[styles.logIp, { color: colors.textMuted }]}>
                IP registrado: {log.ipAddressMasked}
              </Text>
            </Card>
          ))}
        </View>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  accessDeniedCard: {
    padding: 32,
    alignItems: 'center',
    marginVertical: 32,
  },
  deniedIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deniedTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  deniedMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 10,
    marginBottom: 14,
  },
  tabContent: {
    gap: 14,
    paddingBottom: 32,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    width: '48%',
    flexGrow: 1,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 12,
  },
  privacyNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  privacyNoticeTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  privacyNoticeBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  itemCard: {
    gap: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemMeta: {
    fontSize: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  itemDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  userCard: {
    padding: 16,
  },
  userCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  userMeta: {
    fontSize: 11,
    marginTop: 4,
  },
  logCard: {
    gap: 6,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logTime: {
    fontSize: 11,
  },
  logTarget: {
    fontSize: 14,
    fontWeight: '700',
  },
  logIp: {
    fontSize: 11,
  },
});
