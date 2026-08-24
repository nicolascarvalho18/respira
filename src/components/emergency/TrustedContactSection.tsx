import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Linking,
  ScrollView,
  Platform,
} from 'react-native';
import {
  HeartHandshake,
  Phone,
  MessageCircle,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Share2,
  Copy,
  AlertCircle,
  PhoneCall,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ui/Toast';
import { Card } from '../ui/Card';
import { AppButton } from '../ui/AppButton';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import {
  trustedContactService,
  TrustedContact,
} from '../../services/emergency/trustedContactService';

const RELATIONSHIPS = [
  'Familiar',
  'Amigo',
  'Responsável',
  'Parceiro(a)',
  'Profissional de confiança',
  'Outro',
];

export const TrustedContactSection: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<TrustedContact | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Amigo');
  const [phone, setPhone] = useState('');
  const [allowCall, setAllowCall] = useState(true);
  const [allowMessage, setAllowMessage] = useState(true);
  const [contactIsAware, setContactIsAware] = useState(true);
  const [formError, setFormError] = useState('');

  // Call & Message modals
  const [contactToCall, setContactToCall] = useState<TrustedContact | null>(null);
  const [messageModalContact, setMessageModalContact] = useState<TrustedContact | null>(null);
  const [customMessage, setCustomMessage] = useState(
    'Oi, não estou me sentindo bem e gostaria de conversar. Pode me ligar quando puder?'
  );
  const [contactToDelete, setContactToDelete] = useState<TrustedContact | null>(null);

  const loadContacts = async () => {
    try {
      const data = await trustedContactService.getContacts(user?.id);
      setContacts(data);
    } catch {
      showToast({ message: 'Erro ao carregar contatos de confiança.', type: 'error' });
    }
  };

  useEffect(() => {
    loadContacts();
  }, [user?.id]);

  const openAddModal = () => {
    setEditingContact(null);
    setName('');
    setRelationship('Amigo');
    setPhone('');
    setAllowCall(true);
    setAllowMessage(true);
    setContactIsAware(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: TrustedContact) => {
    setEditingContact(c);
    setName(c.name);
    setRelationship(c.relationship);
    setPhone(c.phone);
    setAllowCall(c.allowCall);
    setAllowMessage(c.allowMessage);
    setContactIsAware(c.contactIsAware);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setFormError('Por favor, informe o nome do contato.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      setFormError('Informe um telefone brasileiro válido com DDD (ex: 11987654321).');
      return;
    }
    if (!contactIsAware) {
      setFormError('Confirme que o contato está ciente de que foi adicionado como pessoa de confiança.');
      return;
    }

    try {
      await trustedContactService.saveContact({
        id: editingContact?.id,
        userId: user?.id || 'user-demo-1',
        name: name.trim(),
        relationship,
        phone: cleanPhone,
        allowCall,
        allowMessage,
        contactIsAware,
      });

      showToast({ message: 'Contato de confiança salvo com sucesso!', type: 'success' });
      setIsModalOpen(false);
      await loadContacts();
    } catch {
      showToast({ message: 'Não foi possível salvar o contato.', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!contactToDelete) return;
    try {
      await trustedContactService.deleteContact(contactToDelete.id);
      showToast({ message: 'Contato removido.', type: 'success' });
      setContactToDelete(null);
      await loadContacts();
    } catch {
      showToast({ message: 'Erro ao remover contato.', type: 'error' });
    }
  };

  const handleCallConfirm = () => {
    if (!contactToCall) return;
    const cleanNumber = contactToCall.phone.replace(/\D/g, '');
    Linking.openURL(`tel:${cleanNumber}`);
    setContactToCall(null);
  };

  const handleSendWhatsApp = () => {
    if (!messageModalContact) return;
    const cleanNumber = messageModalContact.phone.replace(/\D/g, '');
    const encoded = encodeURIComponent(customMessage);
    Linking.openURL(`https://wa.me/55${cleanNumber}?text=${encoded}`);
    setMessageModalContact(null);
  };

  const handleSendSMS = () => {
    if (!messageModalContact) return;
    const cleanNumber = messageModalContact.phone.replace(/\D/g, '');
    const encoded = encodeURIComponent(customMessage);
    const separator = Platform.OS === 'ios' ? '&' : '?';
    Linking.openURL(`sms:${cleanNumber}${separator}body=${encoded}`);
    setMessageModalContact(null);
  };

  const handleCopyMessage = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(customMessage);
    }
    showToast({ message: 'Mensagem copiada para a área de transferência!', type: 'success' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <HeartHandshake size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Seu contato de confiança</Text>
        </View>
        {contacts.length > 0 && (
          <TouchableOpacity onPress={openAddModal} style={styles.addSmallBtn}>
            <Plus size={16} color={colors.primary} />
            <Text style={[styles.addSmallText, { color: colors.primary }]}>Adicionar</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Cadastre alguém com quem você se sinta seguro para conversar quando precisar de apoio.
      </Text>

      {contacts.length === 0 ? (
        <Card variant="bordered" style={styles.emptyCard}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum contato adicionado</Text>
          <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
            Ter uma pessoa de confiança cadastrada facilita o contato rápido em momentos de sobrecarga.
          </Text>
          <AppButton
            title="Adicionar contato de confiança"
            leftIcon={<Plus size={18} color="#FFFFFF" />}
            onPress={openAddModal}
            size="md"
            style={{ marginTop: 12 }}
          />
        </Card>
      ) : (
        <View style={{ gap: 12 }}>
          {contacts.map((contact) => (
            <Card key={contact.id} variant="bordered" style={styles.contactCard}>
              <View style={styles.contactHeader}>
                <View style={[styles.avatarCircle, { backgroundColor: colors.secondaryLight }]}>
                  <Text style={[styles.avatarText, { color: colors.secondaryDark }]}>
                    {contact.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                  <Text style={[styles.contactRel, { color: colors.textMuted }]}>
                    {contact.relationship} • {contact.phoneMasked}
                  </Text>
                </View>
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    onPress={() => openEditModal(contact)}
                    style={styles.iconBtn}
                    accessibilityLabel={`Editar ${contact.name}`}
                  >
                    <Edit2 size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setContactToDelete(contact)}
                    style={styles.iconBtn}
                    accessibilityLabel={`Remover ${contact.name}`}
                  >
                    <Trash2 size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Botões de Ação */}
              <View style={styles.btnRow}>
                {contact.allowCall && (
                  <TouchableOpacity
                    onPress={() => setContactToCall(contact)}
                    style={[styles.actionBtn, { backgroundColor: colors.highlight, borderColor: colors.primary }]}
                  >
                    <PhoneCall size={16} color={colors.primary} />
                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                      Ligar para {contact.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                )}

                {contact.allowMessage && (
                  <TouchableOpacity
                    onPress={() => setMessageModalContact(contact)}
                    style={[styles.actionBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.secondary }]}
                  >
                    <MessageCircle size={16} color={colors.secondary} />
                    <Text style={[styles.actionBtnText, { color: colors.secondaryDark }]}>
                      Enviar mensagem
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Modal de Cadastro / Edição */}
      <Modal visible={isModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: colors.border },
            ]}
          >
            <View style={styles.modalTop}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingContact ? 'Editar contato' : 'Novo contato de confiança'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
              {formError ? (
                <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
                  <AlertCircle size={16} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{formError}</Text>
                </View>
              ) : null}

              <View>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Nome completo</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Ex: Mariana Silva"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.inputField,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                    },
                  ]}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Relação</Text>
                <View style={styles.relWrap}>
                  {RELATIONSHIPS.map((rel) => {
                    const isSelected = relationship === rel;
                    return (
                      <TouchableOpacity
                        key={rel}
                        onPress={() => setRelationship(rel)}
                        style={[
                          styles.relChip,
                          {
                            backgroundColor: isSelected ? colors.primary : isDark ? colors.surfaceSecondary : '#FFFFFF',
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.relText,
                            { color: isSelected ? '#FFFFFF' : colors.text, fontWeight: isSelected ? '700' : '500' },
                          ]}
                        >
                          {rel}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Telefone celular (DDD + Número)</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="Ex: 11987654321"
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.inputField,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                    },
                  ]}
                />
              </View>

              {/* Opções de Comunicação */}
              <TouchableOpacity
                onPress={() => setAllowCall(!allowCall)}
                style={styles.checkRow}
              >
                <View style={[styles.checkbox, allowCall && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  {allowCall && <Check size={14} color="#FFFFFF" />}
                </View>
                <Text style={[styles.checkText, { color: colors.text }]}>Permitir botão de ligação</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAllowMessage(!allowMessage)}
                style={styles.checkRow}
              >
                <View style={[styles.checkbox, allowMessage && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  {allowMessage && <Check size={14} color="#FFFFFF" />}
                </View>
                <Text style={[styles.checkText, { color: colors.text }]}>Permitir envio de mensagem</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setContactIsAware(!contactIsAware)}
                style={styles.checkRow}
              >
                <View style={[styles.checkbox, contactIsAware && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  {contactIsAware && <Check size={14} color="#FFFFFF" />}
                </View>
                <Text style={[styles.checkText, { color: colors.text }]}>
                  Esta pessoa sabe que foi indicada como meu contato de apoio
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <AppButton
                  title="Cancelar"
                  variant="outline"
                  onPress={() => setIsModalOpen(false)}
                  style={{ flex: 1 }}
                />
                <AppButton
                  title="Salvar Contato"
                  onPress={handleSave}
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Enviar Mensagem */}
      <Modal visible={!!messageModalContact} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: colors.border },
            ]}
          >
            <View style={styles.modalTop}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Enviar mensagem para {messageModalContact?.name.split(' ')[0]}
              </Text>
              <TouchableOpacity onPress={() => setMessageModalContact(null)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.msgPrompt, { color: colors.textSecondary }]}>
              Você pode editar a mensagem antes de enviar:
            </Text>

            <TextInput
              multiline
              value={customMessage}
              onChangeText={setCustomMessage}
              style={[
                styles.msgInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                },
              ]}
            />

            <View style={styles.msgOptionsCol}>
              <AppButton
                title="Abrir no WhatsApp"
                leftIcon={<Share2 size={16} color="#FFFFFF" />}
                onPress={handleSendWhatsApp}
                style={{ backgroundColor: '#25D366' }}
              />
              <AppButton
                title="Enviar por SMS"
                variant="outline"
                leftIcon={<MessageCircle size={16} color={colors.primary} />}
                onPress={handleSendSMS}
              />
              <AppButton
                title="Copiar Texto"
                variant="ghost"
                leftIcon={<Copy size={16} color={colors.text} />}
                onPress={handleCopyMessage}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Diálogo de Confirmação de Ligação */}
      <ConfirmationModal
        visible={!!contactToCall}
        title={`Ligar para ${contactToCall?.name}?`}
        message="Seu celular abrirá a chamada para o contato escolhido."
        confirmTitle="Ligar agora"
        cancelTitle="Cancelar"
        onConfirm={handleCallConfirm}
        onCancel={() => setContactToCall(null)}
      />

      {/* Diálogo de Confirmação de Exclusão */}
      <ConfirmationModal
        visible={!!contactToDelete}
        title="Remover contato de confiança?"
        message={`Deseja realmente remover ${contactToDelete?.name} da sua lista de contatos de confiança?`}
        confirmTitle="Remover"
        cancelTitle="Cancelar"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setContactToDelete(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  addSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addSmallText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 18,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  contactCard: {
    padding: 16,
    borderRadius: 18,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
  },
  contactRel: {
    fontSize: 12,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    padding: 6,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  modalBox: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  modalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputField: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  relWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  relChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  relText: {
    fontSize: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#DDE5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontSize: 13,
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  msgPrompt: {
    fontSize: 13,
    marginBottom: 8,
  },
  msgInput: {
    minHeight: 80,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  msgOptionsCol: {
    gap: 8,
  },
});
