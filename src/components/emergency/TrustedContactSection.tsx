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
  Star,
  Shield,
  Info,
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
  formatBrazilianPhone,
  validateBrazilianPhone,
} from '../../services/emergency/trustedContactService';

const RELATIONSHIPS = [
  'Familiar',
  'Amigo(a)',
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
  const [relationship, setRelationship] = useState('Amigo(a)');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
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
    setRelationship('Amigo(a)');
    setPhone('');
    setNotes('');
    setIsPrimary(contacts.length === 0);
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
    setPhone(c.phoneFormatted || c.phone);
    setNotes(c.notes || '');
    setIsPrimary(!!c.isPrimary);
    setAllowCall(c.allowCall);
    setAllowMessage(c.allowMessage);
    setContactIsAware(c.contactIsAware);
    setFormError('');
    setIsModalOpen(true);
  };

  const handlePhoneChange = (val: string) => {
    const formatted = formatBrazilianPhone(val);
    setPhone(formatted);
    if (formError) setFormError('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setFormError('Por favor, informe o nome do contato.');
      return;
    }

    const validation = validateBrazilianPhone(phone);
    if (!validation.isValid) {
      setFormError(validation.message || 'Telefone brasileiro inválido.');
      return;
    }

    if (!contactIsAware) {
      setFormError('Confirme que o contato está ciente de que foi indicado como sua pessoa de confiança.');
      return;
    }

    try {
      await trustedContactService.saveContact({
        id: editingContact?.id,
        userId: user?.id || 'user-demo-1',
        name: name.trim(),
        relationship,
        phone,
        notes: notes.trim() || undefined,
        isPrimary,
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
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      showToast({ message: 'Não foi possível abrir o discador.', type: 'error' });
    });
    setContactToCall(null);
  };

  const handleSendWhatsApp = () => {
    if (!messageModalContact) return;
    const cleanNumber = messageModalContact.phone.replace(/\D/g, '');
    const encoded = encodeURIComponent(customMessage);
    Linking.openURL(`https://wa.me/55${cleanNumber}?text=${encoded}`).catch(() => {
      showToast({ message: 'Não foi possível abrir o WhatsApp.', type: 'error' });
    });
    setMessageModalContact(null);
  };

  const handleSendSMS = () => {
    if (!messageModalContact) return;
    const cleanNumber = messageModalContact.phone.replace(/\D/g, '');
    const encoded = encodeURIComponent(customMessage);
    const separator = Platform.OS === 'ios' ? '&' : '?';
    Linking.openURL(`sms:${cleanNumber}${separator}body=${encoded}`).catch(() => {
      showToast({ message: 'Não foi possível abrir o aplicativo de SMS.', type: 'error' });
    });
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
          <Text style={[styles.title, { color: isDark ? colors.text : '#173D3B' }]}>
            Contatos de Confiança
          </Text>
        </View>
        {contacts.length > 0 && (
          <TouchableOpacity onPress={openAddModal} style={styles.addSmallBtn}>
            <Plus size={16} color={colors.primary} />
            <Text style={[styles.addSmallText, { color: colors.primary }]}>Novo contato</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.subtitle, { color: isDark ? colors.textMuted : '#667775' }]}>
        Cadastre pessoas próximas e de sua confiança para apoio em momentos difíceis.
      </Text>

      {/* Aviso Explicativo e Ético */}
      <View
        style={[
          styles.disclaimerBox,
          {
            backgroundColor: isDark ? colors.surfaceSecondary : '#F0F7F6',
            borderColor: isDark ? colors.border : '#D8EBE4',
          },
        ]}
      >
        <Info size={15} color={colors.primary} style={{ marginRight: 6, marginTop: 1 }} />
        <Text style={[styles.disclaimerText, { color: isDark ? colors.textMuted : '#567571' }]}>
          Este recurso facilita o contato rápido com uma pessoa de sua confiança, mas não substitui
          serviços profissionais ou de emergência. Nenhuma mensagem ou ligação é realizada automaticamente.
        </Text>
      </View>

      {contacts.length === 0 ? (
        <Card
          variant="bordered"
          style={[
            styles.emptyCard,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#DCE5E2',
            },
          ]}
        >
          <Text style={[styles.emptyTitle, { color: isDark ? colors.text : '#173D3B' }]}>
            Nenhum contato cadastrado
          </Text>
          <Text style={[styles.emptyDesc, { color: isDark ? colors.textMuted : '#667775' }]}>
            Ter uma pessoa de confiança cadastrada facilita o contato rápido em momentos de sobrecarga.
          </Text>
          <AppButton
            title="Adicionar contato de confiança"
            leftIcon={<Plus size={18} color="#FFFFFF" />}
            onPress={openAddModal}
            size="md"
            style={{ marginTop: 14 }}
          />
        </Card>
      ) : (
        <View style={{ gap: 12 }}>
          {contacts.map((contact) => (
            <Card
              key={contact.id}
              variant="bordered"
              style={[
                styles.contactCard,
                contact.isPrimary && {
                  borderColor: '#2F7F7C',
                  borderWidth: 1.5,
                },
                {
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                },
              ]}
            >
              <View style={styles.contactHeader}>
                <View
                  style={[
                    styles.avatarCircle,
                    { backgroundColor: contact.isPrimary ? '#2F7F7C' : isDark ? colors.surfaceSecondary : '#E7F3EF' },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarText,
                      { color: contact.isPrimary ? '#FFFFFF' : '#2F7F7C' },
                    ]}
                  >
                    {contact.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.contactName, { color: isDark ? colors.text : '#173D3B' }]}>
                      {contact.name}
                    </Text>
                    {contact.isPrimary && (
                      <View style={styles.primaryBadge}>
                        <Star size={10} color="#FFFFFF" fill="#FFFFFF" style={{ marginRight: 3 }} />
                        <Text style={styles.primaryBadgeText}>Principal</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.contactRel, { color: isDark ? colors.textMuted : '#667775' }]}>
                    {contact.relationship} • {contact.phoneMasked}
                  </Text>
                  {contact.notes ? (
                    <Text style={[styles.contactNote, { color: isDark ? colors.textMuted : '#8C9E9B' }]}>
                      Obs: {contact.notes}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    onPress={() => openEditModal(contact)}
                    style={styles.iconBtn}
                    accessibilityLabel={`Editar ${contact.name}`}
                  >
                    <Edit2 size={16} color={isDark ? colors.textMuted : '#667775'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setContactToDelete(contact)}
                    style={styles.iconBtn}
                    accessibilityLabel={`Remover ${contact.name}`}
                  >
                    <Trash2 size={16} color="#D9534F" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Botões de Ação */}
              <View style={styles.btnRow}>
                {contact.allowCall && (
                  <TouchableOpacity
                    onPress={() => setContactToCall(contact)}
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF',
                        borderColor: '#2F7F7C',
                      },
                    ]}
                  >
                    <PhoneCall size={15} color="#2F7F7C" />
                    <Text style={[styles.actionBtnText, { color: '#2F7F7C' }]}>
                      Ligar para {contact.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                )}

                {contact.allowMessage && (
                  <TouchableOpacity
                    onPress={() => setMessageModalContact(contact)}
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFA',
                        borderColor: isDark ? colors.border : '#DCE5E2',
                      },
                    ]}
                  >
                    <MessageCircle size={15} color="#2F7F7C" />
                    <Text style={[styles.actionBtnText, { color: isDark ? colors.text : '#173D3B' }]}>
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
      <Modal visible={isModalOpen} transparent animationType="fade" onRequestClose={() => setIsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: colors.border },
            ]}
          >
            <View style={styles.modalTop}>
              <Text style={[styles.modalTitle, { color: isDark ? colors.text : '#173D3B' }]}>
                {editingContact ? 'Editar contato de confiança' : 'Novo contato de confiança'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X size={20} color="#8C9E9B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {formError ? (
                <View style={[styles.errorBox, { backgroundColor: '#FDF0F0', borderColor: '#F2B5A0' }]}>
                  <AlertCircle size={15} color="#D9534F" />
                  <Text style={[styles.errorText, { color: '#D9534F' }]}>{formError}</Text>
                </View>
              ) : null}

              <View>
                <Text style={[styles.inputLabel, { color: isDark ? colors.text : '#173D3B' }]}>
                  Nome da pessoa *
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Ex: Mariana Silva"
                  placeholderTextColor="#8C9E9B"
                  style={[
                    styles.inputField,
                    {
                      color: isDark ? colors.text : '#173D3B',
                      borderColor: isDark ? colors.border : '#DCE5E2',
                      backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                    },
                  ]}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: isDark ? colors.text : '#173D3B' }]}>
                  Vínculo / Parentesco
                </Text>
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
                            backgroundColor: isSelected
                              ? '#2F7F7C'
                              : isDark
                              ? colors.surfaceSecondary
                              : '#FFFFFF',
                            borderColor: isSelected ? '#2F7F7C' : isDark ? colors.border : '#DCE5E2',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.relText,
                            {
                              color: isSelected ? '#FFFFFF' : isDark ? colors.text : '#173D3B',
                              fontWeight: isSelected ? '700' : '500',
                            },
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
                <Text style={[styles.inputLabel, { color: isDark ? colors.text : '#173D3B' }]}>
                  Telefone celular com DDD *
                </Text>
                <TextInput
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  placeholder="(11) 98765-4321"
                  placeholderTextColor="#8C9E9B"
                  maxLength={15}
                  style={[
                    styles.inputField,
                    {
                      color: isDark ? colors.text : '#173D3B',
                      borderColor: isDark ? colors.border : '#DCE5E2',
                      backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                    },
                  ]}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: isDark ? colors.text : '#173D3B' }]}>
                  Observação opcional
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Ex: Mora perto, disponível à noite"
                  placeholderTextColor="#8C9E9B"
                  style={[
                    styles.inputField,
                    {
                      color: isDark ? colors.text : '#173D3B',
                      borderColor: isDark ? colors.border : '#DCE5E2',
                      backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                    },
                  ]}
                />
              </View>

              {/* Definir como Contato Principal */}
              <TouchableOpacity
                onPress={() => setIsPrimary(!isPrimary)}
                style={styles.checkRow}
              >
                <View
                  style={[
                    styles.checkbox,
                    isPrimary && { backgroundColor: '#2F7F7C', borderColor: '#2F7F7C' },
                  ]}
                >
                  {isPrimary && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={[styles.checkText, { color: isDark ? colors.text : '#173D3B' }]}>
                  Destacar como meu contato principal de apoio
                </Text>
              </TouchableOpacity>

              {/* Opções de Comunicação */}
              <TouchableOpacity
                onPress={() => setAllowCall(!allowCall)}
                style={styles.checkRow}
              >
                <View
                  style={[
                    styles.checkbox,
                    allowCall && { backgroundColor: '#2F7F7C', borderColor: '#2F7F7C' },
                  ]}
                >
                  {allowCall && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={[styles.checkText, { color: isDark ? colors.text : '#173D3B' }]}>
                  Permitir botão de ligação direta
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAllowMessage(!allowMessage)}
                style={styles.checkRow}
              >
                <View
                  style={[
                    styles.checkbox,
                    allowMessage && { backgroundColor: '#2F7F7C', borderColor: '#2F7F7C' },
                  ]}
                >
                  {allowMessage && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={[styles.checkText, { color: isDark ? colors.text : '#173D3B' }]}>
                  Permitir envio de mensagem (WhatsApp / SMS)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setContactIsAware(!contactIsAware)}
                style={styles.checkRow}
              >
                <View
                  style={[
                    styles.checkbox,
                    contactIsAware && { backgroundColor: '#2F7F7C', borderColor: '#2F7F7C' },
                  ]}
                >
                  {contactIsAware && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={[styles.checkText, { color: isDark ? colors.text : '#173D3B' }]}>
                  Esta pessoa sabe que foi indicada como meu contato de confiança *
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <AppButton
                    title="Cancelar"
                    variant="outline"
                    onPress={() => setIsModalOpen(false)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppButton
                    title="Salvar Contato"
                    onPress={handleSave}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Enviar Mensagem (WhatsApp / SMS) */}
      <Modal visible={!!messageModalContact} transparent animationType="fade" onRequestClose={() => setMessageModalContact(null)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: colors.border },
            ]}
          >
            <View style={styles.modalTop}>
              <Text style={[styles.modalTitle, { color: isDark ? colors.text : '#173D3B' }]}>
                Enviar mensagem para {messageModalContact?.name.split(' ')[0]}
              </Text>
              <TouchableOpacity onPress={() => setMessageModalContact(null)}>
                <X size={20} color="#8C9E9B" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.msgPrompt, { color: isDark ? colors.textMuted : '#667775' }]}>
              Você pode personalizar a mensagem antes de enviar:
            </Text>

            <TextInput
              multiline
              value={customMessage}
              onChangeText={setCustomMessage}
              style={[
                styles.msgInput,
                {
                  color: isDark ? colors.text : '#173D3B',
                  borderColor: isDark ? colors.border : '#DCE5E2',
                  backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFA',
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
                leftIcon={<MessageCircle size={16} color="#2F7F7C" />}
                onPress={handleSendSMS}
              />
              <AppButton
                title="Copiar Texto"
                variant="ghost"
                leftIcon={<Copy size={16} color={isDark ? colors.text : '#173D3B'} />}
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
        message="Seu aplicativo de chamadas será aberto com o número pronto para ligar."
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
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
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
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
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
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '800',
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2F7F7C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  primaryBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  contactRel: {
    fontSize: 12,
    marginTop: 2,
  },
  contactNote: {
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
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
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    zIndex: 1000,
  },
  modalBox: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
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
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputField: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  relWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  relChip: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  relText: {
    fontSize: 11,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 3,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#8C9E9B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontSize: 12,
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 9,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  msgPrompt: {
    fontSize: 12,
    marginBottom: 8,
  },
  msgInput: {
    minHeight: 70,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    fontSize: 13,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  msgOptionsCol: {
    gap: 8,
  },
});
