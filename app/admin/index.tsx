import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
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
  Edit2,
  Trash2,
  Check,
  X,
  Video,
  Headphones,
  Eye,
} from 'lucide-react-native';
import { AppShell } from '../../src/components/layout/AppShell';
import { PageHeader } from '../../src/components/ui/PageHeader';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { AppButton } from '../../src/components/ui/AppButton';
import { Chip } from '../../src/components/ui/Chip';
import { ConfirmationModal } from '../../src/components/ui/ConfirmationModal';
import { useAuth } from '../../src/hooks/useAuth';
import { useContentStore } from '../../src/store/contentStore';
import { usePracticeStore } from '../../src/store/practiceStore';
import { useToast } from '../../src/components/ui/Toast';
import { useTheme } from '../../src/hooks/useTheme';
import { MOCK_ADMIN_LOGS, MOCK_SANITIZED_USERS } from '../../src/mocks/adminLogs.mock';
import { formatDateTime } from '../../src/utils/date';
import { Practice, PracticeCategory, PracticeObjective, PracticeFormat } from '../../src/types';

export default function AdminScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const { articles } = useContentStore();
  const { practices, createPractice, updatePractice, deletePractice } = usePracticeStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'articles' | 'practices' | 'users' | 'logs'>('overview');

  // Práticas Admin State
  const [practiceSearch, setPracticeSearch] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPracticeId, setEditingPracticeId] = useState<string | null>(null);
  const [practiceToDeleteId, setPracticeToDeleteId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<PracticeCategory>('breathing');
  const [formObjective, setFormObjective] = useState<PracticeObjective>('relax');
  const [formFormat, setFormFormat] = useState<PracticeFormat>('video');
  const [formDuration, setFormDuration] = useState('5');
  const [formLevel, setFormLevel] = useState<'Iniciante' | 'Intermediário' | 'Avançado'>('Iniciante');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formAudioUrl, setFormAudioUrl] = useState('');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');
  const [formInstructorName, setFormInstructorName] = useState('');
  const [formInstructorRole, setFormInstructorRole] = useState('');
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('published');
  const [formIsFeatured, setFormIsFeatured] = useState(false);

  // Proteção rigorosa de papel
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

  const handleOpenCreateModal = () => {
    setEditingPracticeId(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('breathing');
    setFormObjective('relax');
    setFormFormat('video');
    setFormDuration('5');
    setFormLevel('Iniciante');
    setFormVideoUrl('');
    setFormAudioUrl('');
    setFormThumbnailUrl('');
    setFormInstructorName('Dra. Clara Silveira');
    setFormInstructorRole('Especialista em Bem-Estar');
    setFormStatus('published');
    setFormIsFeatured(false);
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (prac: Practice) => {
    setEditingPracticeId(prac.id);
    setFormTitle(prac.title);
    setFormDescription(prac.description);
    setFormCategory(prac.category);
    setFormObjective(prac.objective || 'relax');
    setFormFormat(prac.format || 'video');
    setFormDuration(prac.durationMinutes.toString());
    setFormLevel(prac.level);
    setFormVideoUrl(prac.videoUrl || '');
    setFormAudioUrl(prac.audioUrl || '');
    setFormThumbnailUrl(prac.thumbnailUrl || '');
    setFormInstructorName(prac.instructor?.name || '');
    setFormInstructorRole(prac.instructor?.role || '');
    setFormStatus(prac.status || 'published');
    setFormIsFeatured(prac.isFeatured || false);
    setIsEditModalOpen(true);
  };

  const handleSavePractice = async () => {
    if (!formTitle.trim() || !formDescription.trim()) {
      showToast({ message: 'Preencha o título e a descrição da prática.', type: 'error' });
      return;
    }

    const payload: Partial<Practice> = {
      title: formTitle.trim(),
      description: formDescription.trim(),
      category: formCategory,
      objective: formObjective,
      format: formFormat,
      durationMinutes: parseInt(formDuration, 10) || 5,
      level: formLevel,
      videoUrl: formVideoUrl.trim() || undefined,
      audioUrl: formAudioUrl.trim() || undefined,
      thumbnailUrl: formThumbnailUrl.trim() || undefined,
      instructor: formInstructorName.trim()
        ? { name: formInstructorName.trim(), role: formInstructorRole.trim() }
        : undefined,
      status: formStatus,
      isFeatured: formIsFeatured,
    };

    try {
      if (editingPracticeId) {
        await updatePractice(editingPracticeId, payload);
        showToast({ message: 'Prática atualizada', type: 'success' });
      } else {
        await createPractice({
          ...payload,
          subtitle: '',
          guidelinesBeforeStarting: [
            'Acomode-se confortavelmente antes de iniciar.',
            'Mantenha a respiração em ritmo natural.',
          ],
          stages: [
            { step: 1, title: 'Início', instruction: 'Conecte-se com o momento presente.', durationSeconds: 60 },
          ],
          benefits: ['Acalma a mente e relaxa o corpo.'],
          careAndLimitations: ['Interrompa se sentir desconforto.'],
        } as any);
        showToast({ message: 'Prática cadastrada', type: 'success' });
      }
      setIsEditModalOpen(false);
    } catch {
      showToast({ message: 'Erro ao salvar prática.', type: 'error' });
    }
  };

  const handleDeletePractice = async () => {
    if (!practiceToDeleteId) return;
    try {
      await deletePractice(practiceToDeleteId);
      showToast({ message: 'Prática removida', type: 'success' });
      setPracticeToDeleteId(null);
    } catch {
      showToast({ message: 'Erro ao remover prática.', type: 'error' });
    }
  };

  const filteredAdminPractices = practices.filter((p) => {
    const q = practiceSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  });

  const totalCompletions = practices.reduce((acc, p) => acc + (p.completedCount || 0), 0);
  const totalVideos = practices.filter((p) => p.format === 'video').length;
  const totalAudios = practices.filter((p) => p.format === 'audio').length;

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
            <Card variant="bordered" style={styles.metricBox}>
              <Activity size={20} color="#2F7F7C" />
              <Text style={[styles.metricNumber, { color: isDark ? colors.text : '#173D3B' }]}>
                {practices.length}
              </Text>
              <Text style={[styles.metricTitle, { color: isDark ? colors.textMuted : '#667775' }]}>
                Práticas Cadastradas
              </Text>
            </Card>

            <Card variant="bordered" style={styles.metricBox}>
              <Check size={20} color="#79B8A4" />
              <Text style={[styles.metricNumber, { color: isDark ? colors.text : '#173D3B' }]}>
                {totalCompletions}
              </Text>
              <Text style={[styles.metricTitle, { color: isDark ? colors.textMuted : '#667775' }]}>
                Total de Conclusões
              </Text>
            </Card>

            <Card variant="bordered" style={styles.metricBox}>
              <Video size={20} color="#2F7F7C" />
              <Text style={[styles.metricNumber, { color: isDark ? colors.text : '#173D3B' }]}>
                {totalVideos}
              </Text>
              <Text style={[styles.metricTitle, { color: isDark ? colors.textMuted : '#667775' }]}>
                Vídeos Guiados
              </Text>
            </Card>

            <Card variant="bordered" style={styles.metricBox}>
              <Headphones size={20} color="#6A4C93" />
              <Text style={[styles.metricNumber, { color: isDark ? colors.text : '#173D3B' }]}>
                {totalAudios}
              </Text>
              <Text style={[styles.metricTitle, { color: isDark ? colors.textMuted : '#667775' }]}>
                Áudios & Sons
              </Text>
            </Card>
          </View>
        </View>
      )}

      {/* 2. Catálogo de Práticas com CRUD Completo */}
      {activeTab === 'practices' && (
        <View style={styles.tabContent}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#173D3B' }]}>
              Biblioteca de Práticas ({filteredAdminPractices.length})
            </Text>
            <AppButton
              title="Nova Prática"
              leftIcon={<Plus size={16} color="#FFFFFF" />}
              size="sm"
              onPress={handleOpenCreateModal}
            />
          </View>

          {/* Busca na Gestão de Práticas */}
          <View
            style={[
              styles.adminSearchBox,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#DCE5E2' },
            ]}
          >
            <TextInput
              value={practiceSearch}
              onChangeText={setPracticeSearch}
              placeholder="Filtrar práticas por nome ou categoria..."
              placeholderTextColor="#8C9E9B"
              style={[styles.adminSearchInput, { color: isDark ? colors.text : '#173D3B' }]}
            />
            {practiceSearch ? (
              <TouchableOpacity onPress={() => setPracticeSearch('')}>
                <X size={16} color="#8C9E9B" />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={{ gap: 10 }}>
            {filteredAdminPractices.map((prac) => (
              <Card
                key={prac.id}
                variant="bordered"
                style={[
                  styles.itemCard,
                  { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#DCE5E2' },
                ]}
              >
                <View style={styles.itemHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Badge
                      label={prac.format === 'video' ? 'Vídeo' : prac.format === 'audio' ? 'Áudio' : 'Interativo'}
                      variant="primary"
                      size="sm"
                    />
                    <Badge label={prac.level} variant="success" size="sm" />
                    {prac.isFeatured && <Badge label="Destaque" variant="warning" size="sm" />}
                    <Badge
                      label={prac.status === 'draft' ? 'Rascunho' : 'Publicado'}
                      variant={prac.status === 'draft' ? 'warning' : 'info'}
                      size="sm"
                    />
                  </View>

                  <Text style={[styles.itemMeta, { color: isDark ? colors.textMuted : '#667775' }]}>
                    {prac.durationMinutes} min • {prac.completedCount || 0} conclusões
                  </Text>
                </View>

                <Text style={[styles.itemTitle, { color: isDark ? colors.text : '#173D3B' }]}>
                  {prac.title}
                </Text>
                <Text style={[styles.itemDesc, { color: isDark ? colors.textMuted : '#667775' }]} numberOfLines={2}>
                  {prac.description}
                </Text>

                <View style={styles.itemActionsRow}>
                  <TouchableOpacity
                    onPress={() => router.push(`/practices/player/${prac.id}` as any)}
                    style={styles.actionIconTextBtn}
                  >
                    <Eye size={14} color="#2F7F7C" />
                    <Text style={[styles.actionBtnText, { color: '#2F7F7C' }]}>Visualizar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleOpenEditModal(prac)}
                    style={styles.actionIconTextBtn}
                  >
                    <Edit2 size={14} color="#2F7F7C" />
                    <Text style={[styles.actionBtnText, { color: '#2F7F7C' }]}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setPracticeToDeleteId(prac.id)}
                    style={styles.actionIconTextBtn}
                  >
                    <Trash2 size={14} color="#D9534F" />
                    <Text style={[styles.actionBtnText, { color: '#D9534F' }]}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        </View>
      )}

      {/* 3. Artigos */}
      {activeTab === 'articles' && (
        <View style={styles.tabContent}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#173D3B', marginBottom: 12 }]}>
            Artigos e Conteúdos Psicoeducativos ({articles.length})
          </Text>
          {articles.map((art) => (
            <Card key={art.id} variant="bordered" style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Badge label={art.category || art.categoryName || 'Artigo'} variant="primary" size="sm" />
                <Text style={[styles.itemMeta, { color: colors.textMuted }]}>
                  {art.readingTimeMinutes || art.readTimeMinutes || 4} min de leitura
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

      {/* 4. Usuários Anonimizados (LGPD) */}
      {activeTab === 'users' && (
        <View style={styles.tabContent}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#173D3B', marginBottom: 12 }]}>
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
          <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#173D3B', marginBottom: 12 }]}>
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

      {/* Modal de Cadastro e Edição de Prática */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: isDark ? colors.border : '#DCE5E2' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? colors.text : '#173D3B' }]}>
                {editingPracticeId ? 'Editar Prática Guiada' : 'Cadastrar Nova Prática'}
              </Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <X size={20} color={isDark ? colors.text : '#173D3B'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
              {/* Título */}
              <Text style={[styles.formLabel, { color: isDark ? colors.text : '#173D3B' }]}>Título *</Text>
              <TextInput
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="Ex: Respiração 4-7-8"
                placeholderTextColor="#8C9E9B"
                style={[styles.formInput, { color: isDark ? colors.text : '#173D3B' }]}
              />

              {/* Descrição */}
              <Text style={[styles.formLabel, { color: isDark ? colors.text : '#173D3B' }]}>Descrição *</Text>
              <TextInput
                value={formDescription}
                onChangeText={setFormDescription}
                placeholder="Descrição clara e objetiva da atividade..."
                placeholderTextColor="#8C9E9B"
                multiline
                numberOfLines={3}
                style={[styles.formInput, { minHeight: 60, color: isDark ? colors.text : '#173D3B' }]}
              />

              {/* Categoria */}
              <Text style={[styles.formLabel, { color: isDark ? colors.text : '#173D3B' }]}>Categoria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {[
                  { id: 'breathing', label: 'Respiração' },
                  { id: 'guided_meditation', label: 'Meditação' },
                  { id: 'body_movement', label: 'Corpo & Movimento' },
                  { id: 'relaxation', label: 'Relaxamento' },
                  { id: 'sleep', label: 'Sono' },
                  { id: 'mindfulness_focus', label: 'Atenção & Foco' },
                  { id: 'quick_pauses', label: 'Pausas Rápidas' },
                  { id: 'morning_routine', label: 'Rotina Manhã' },
                  { id: 'bedtime_prep', label: 'Prep. Dormir' },
                ].map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setFormCategory(c.id as any)}
                    style={[
                      styles.modalChip,
                      formCategory === c.id && styles.modalChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalChipText,
                        formCategory === c.id && styles.modalChipTextActive,
                      ]}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Formato e Nível */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.formLabel, { color: isDark ? colors.text : '#173D3B' }]}>Formato</Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {(['video', 'audio', 'interactive'] as const).map((f) => (
                      <TouchableOpacity
                        key={f}
                        onPress={() => setFormFormat(f)}
                        style={[
                          styles.modalChip,
                          formFormat === f && styles.modalChipActive,
                        ]}
                      >
                        <Text style={[styles.modalChipText, formFormat === f && styles.modalChipTextActive]}>
                          {f === 'video' ? 'Vídeo' : f === 'audio' ? 'Áudio' : 'Interativo'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.formLabel, { color: isDark ? colors.text : '#173D3B' }]}>Duração (min)</Text>
                  <TextInput
                    value={formDuration}
                    onChangeText={setFormDuration}
                    keyboardType="numeric"
                    style={[styles.formInput, { color: isDark ? colors.text : '#173D3B' }]}
                  />
                </View>
              </View>

              {/* URL do Vídeo ou Áudio */}
              <Text style={[styles.formLabel, { color: isDark ? colors.text : '#173D3B' }]}>
                {formFormat === 'video' ? 'URL do Vídeo (MP4/HLS)' : 'URL do Áudio (MP3/OGG)'}
              </Text>
              <TextInput
                value={formFormat === 'video' ? formVideoUrl : formAudioUrl}
                onChangeText={formFormat === 'video' ? setFormVideoUrl : setFormAudioUrl}
                placeholder="https://..."
                placeholderTextColor="#8C9E9B"
                style={[styles.formInput, { color: isDark ? colors.text : '#173D3B' }]}
              />

              {/* URL da Miniatura */}
              <Text style={[styles.formLabel, { color: isDark ? colors.text : '#173D3B' }]}>URL da Miniatura</Text>
              <TextInput
                value={formThumbnailUrl}
                onChangeText={setFormThumbnailUrl}
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor="#8C9E9B"
                style={[styles.formInput, { color: isDark ? colors.text : '#173D3B' }]}
              />

              {/* Status e Destaque */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => setFormStatus(formStatus === 'published' ? 'draft' : 'published')}
                  style={[
                    styles.modalChip,
                    formStatus === 'published' && styles.modalChipActive,
                  ]}
                >
                  <Text style={[styles.modalChipText, formStatus === 'published' && styles.modalChipTextActive]}>
                    Status: {formStatus === 'published' ? 'Publicado' : 'Rascunho'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setFormIsFeatured(!formIsFeatured)}
                  style={[
                    styles.modalChip,
                    formIsFeatured && styles.modalChipActive,
                  ]}
                >
                  <Text style={[styles.modalChipText, formIsFeatured && styles.modalChipTextActive]}>
                    ⭐ {formIsFeatured ? 'Em Destaque' : 'Comum'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <AppButton
                title="Cancelar"
                variant="outline"
                onPress={() => setIsEditModalOpen(false)}
                size="md"
              />
              <AppButton
                title="Salvar Prática"
                leftIcon={<Check size={16} color="#FFFFFF" />}
                onPress={handleSavePractice}
                size="md"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmação de Exclusão */}
      <ConfirmationModal
        visible={!!practiceToDeleteId}
        title="Excluir Prática?"
        message="Esta prática será removida do catálogo e não ficará mais acessível aos usuários."
        confirmTitle="Excluir"
        isDestructive
        cancelTitle="Cancelar"
        onConfirm={handleDeletePractice}
        onCancel={() => setPracticeToDeleteId(null)}
      />
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
    marginBottom: 8,
  },
  deniedMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  tabContent: {
    gap: 12,
    paddingBottom: 32,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    minWidth: 150,
    padding: 16,
    borderRadius: 16,
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
  },
  metricTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  adminSearchBox: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  adminSearchInput: {
    flex: 1,
    fontSize: 13,
  },
  itemCard: {
    padding: 14,
    borderRadius: 14,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  itemMeta: {
    fontSize: 11,
  },
  itemActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 14,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EBF1EF',
  },
  actionIconTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  userCard: {
    padding: 14,
    borderRadius: 14,
  },
  userCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  userMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  logCard: {
    padding: 14,
    borderRadius: 14,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  logTime: {
    fontSize: 11,
  },
  logTarget: {
    fontSize: 13,
    fontWeight: '700',
  },
  logIp: {
    fontSize: 11,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 580,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#DCE5E2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  modalChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F2F6F5',
    marginRight: 6,
  },
  modalChipActive: {
    backgroundColor: '#2F7F7C',
  },
  modalChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#173D3B',
  },
  modalChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
});
