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
  UserRoundPlus,
  LockKeyhole,
  Phone,
  MessageCircle,
  Pencil,
  Trash2,
  Check,
  X,
  Share2,
  Copy,
  AlertCircle,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ui/Toast';
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
      {/* Título da Seção */}
      <View style={styles.sectionHeaderRow}>
        <Text
          accessibilityRole="header"
          aria-level={2}
          style={[styles.sectionTitle, { color: isDark ? colors.text : '#123F3A' }]}
        >
          Contatos de confiança
        </Text>
      </View>

      {/* Estado sem contatos — Estrutura Horizontal Limpa */}
      {contacts.length === 0 ? (
        <View
          style={[
            styles.emptyRowCard,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? colors.border : '#E8EDEA',
            },
          ]}
        >
          <UserRoundPlus
            size={20}
            color="#44514F"
            strokeWidth={1.75}
            style={styles.emptyIcon}
            aria-hidden={true}
          />
          <Text style={[styles.emptyText, { color: isDark ? colors.textMuted : '#65736F' }]}>
            Cadastre até 3 pessoas de confiança para acionar rapidamente em momentos difíceis.
          </Text>
          <TouchableOpacity
            onPress={openAddModal}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Adicionar contato de confiança"
            style={styles.addInlineBtn}
          >
            <Text style={styles.addInlineBtnText}>Adicionar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.contactsListWrap}>
          {contacts.map((contact) => (
            <View
              key={contact.id}
              style={[
                styles.contactCard,
                {
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                  borderColor: isDark ? colors.border : '#E8EDEA',
                },
              ]}
            >
              <View style={styles.contactHeader}>
                <View
                  style={[
                    styles.avatarCircle,
                    { backgroundColor: isDark ? colors.surfaceSecondary : '#E7F3EF' },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {contact.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.contactName, { color: isDark ? colors.text : '#123F3A' }]}>
                    {contact.name}
                  </Text>
                  <Text style={[styles.contactRel, { color: isDark ? colors.textMuted : '#65736F' }]}>
                    {contact.relationship} • {contact.phoneMasked}
                  </Text>
                  {contact.notes ? (
                    <Text style={[styles.contactNote, { color: isDark ? colors.textMuted : '#65736F' }]}>
                      Obs: {contact.notes}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    onPress={() => openEditModal(contact)}
                    style={styles.iconBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Editar ${contact.name}`}
                  >
                    <Pencil size={16} color="#65736F" strokeWidth={1.75} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setContactToDelete(contact)}
                    style={styles.iconBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Remover ${contact.name}`}
                  >
                    <Trash2 size={16} color="#E64A2E" strokeWidth={1.75} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Botões de Ação */}
              <View style={styles.btnRow}>
                {contact.allowCall && (
                  <TouchableOpacity
                    onPress={() => setContactToCall(contact)}
                    style={styles.contactActionBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Ligar para ${contact.name}`}
                  >
                    <Phone size={15} color="#147D78" strokeWidth={1.75} />
                    <Text style={styles.contactActionBtnText}>
                      Ligar para {contact.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                )}

                {contact.allowMessage && (
                  <TouchableOpacity
                    onPress={() => setMessageModalContact(contact)}
                    style={[styles.contactActionBtn, styles.contactActionBtnOutline]}
                    accessibilityRole="button"
                    accessibilityLabel={`Enviar mensagem para ${contact.name}`}
                  >
                    <MessageCircle size={15} color="#147D78" strokeWidth={1.75} />
                    <Text style={[styles.contactActionBtnText, { color: isDark ? colors.text : '#123F3A' }]}>
                      Enviar mensagem
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {contacts.length < 3 && (
            <TouchableOpacity
              onPress={openAddModal}
              activeOpacity={0.8}
              style={styles.addAnotherBtn}
            >
              <UserRoundPlus size={16} color="#147D78" strokeWidth={1.75} />
              <Text style={styles.addAnotherBtnText}>Adicionar outro contato de confiança</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Observação de Privacidade com LockKeyhole */}
      <View style={styles.privacyNoteRow}>
        <LockKeyhole
          size={16}
          color="#65736F"
          strokeWidth={1.75}
          style={{ marginRight: 8, marginTop: 1 }}
          aria-hidden={true}
        />
        <Text style={[styles.privacyNoteText, { color: isDark ? colors.textMuted : '#65736F' }]}>
          Seus contatos são salvos apenas no seu dispositivo e protegidos com segurança.
        </Text>
      </View>

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
              <Text style={[styles.modalTitle, { color: isDark ? colors.text : '#123F3A' }]}>
                {editingContact ? 'Editar contato de confiança' : 'Novo contato de confiança'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar formulário"
              >
                <X size={20} color="#65736F" strokeWidth={1.75} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {formError ? (
                <View style={styles.errorBox}>
                  <AlertCircle size={15} color="#E64A2E" strokeWidth={1.75} />
                  <Text style={styles.errorText}>{formError}</Text>
                </View>
              ) : null}

              <View>
                <Text style={[styles.inputLabel, { color: isDark ? colors.text : '#123F3A' }]}>
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
                      color: isDark ? colors.text : '#123F3A',
                      borderColor: isDark ? colors.border : '#E8EDEA',
                      backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                    },
                  ]}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: isDark ? colors.text : '#123F3A' }]}>
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
                              ? '#147D78'
                              : isDark
                              ? colors.surfaceSecondary
                              : '#FFFFFF',
                            borderColor: isSelected ? '#147D78' : isDark ? colors.border : '#E8EDEA',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.relText,
                            {
                              color: isSelected ? '#FFFFFF' : isDark ? colors.text : '#123F3A',
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
                <Text style={[styles.inputLabel, { color: isDark ? colors.text : '#123F3A' }]}>
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
                      color: isDark ? colors.text : '#123F3A',
                      borderColor: isDark ? colors.border : '#E8EDEA',
                      backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                    },
                  ]}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: isDark ? colors.text : '#123F3A' }]}>
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
                      color: isDark ? colors.text : '#123F3A',
                      borderColor: isDark ? colors.border : '#E8EDEA',
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
                <View
                  style={[
                    styles.checkbox,
                    allowCall && { backgroundColor: '#147D78', borderColor: '#147D78' },
                  ]}
                >
                  {allowCall && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={[styles.checkText, { color: isDark ? colors.text : '#123F3A' }]}>
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
                    allowMessage && { backgroundColor: '#147D78', borderColor: '#147D78' },
                  ]}
                >
                  {allowMessage && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={[styles.checkText, { color: isDark ? colors.text : '#123F3A' }]}>
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
                    contactIsAware && { backgroundColor: '#147D78', borderColor: '#147D78' },
                  ]}
                >
                  {contactIsAware && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={[styles.checkText, { color: isDark ? colors.text : '#123F3A' }]}>
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
              <Text style={[styles.modalTitle, { color: isDark ? colors.text : '#123F3A' }]}>
                Enviar mensagem para {messageModalContact?.name.split(' ')[0]}
              </Text>
              <TouchableOpacity
                onPress={() => setMessageModalContact(null)}
                accessibilityRole="button"
                accessibilityLabel="Fechar modal de mensagem"
              >
                <X size={20} color="#65736F" strokeWidth={1.75} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.msgPrompt, { color: isDark ? colors.textMuted : '#65736F' }]}>
              Você pode personalizar a mensagem antes de enviar:
            </Text>

            <TextInput
              multiline
              value={customMessage}
              onChangeText={setCustomMessage}
              style={[
                styles.msgInput,
                {
                  color: isDark ? colors.text : '#123F3A',
                  borderColor: isDark ? colors.border : '#E8EDEA',
                  backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFA',
                },
              ]}
            />

            <View style={styles.msgOptionsCol}>
              <AppButton
                title="Abrir no WhatsApp"
                leftIcon={<Share2 size={16} color="#FFFFFF" strokeWidth={1.75} />}
                onPress={handleSendWhatsApp}
                style={{ backgroundColor: '#25D366' }}
              />
              <AppButton
                title="Enviar por SMS"
                variant="outline"
                leftIcon={<MessageCircle size={16} color="#147D78" strokeWidth={1.75} />}
                onPress={handleSendSMS}
              />
              <AppButton
                title="Copiar Texto"
                variant="ghost"
                leftIcon={<Copy size={16} color={isDark ? colors.text : '#123F3A'} strokeWidth={1.75} />}
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
  sectionHeaderRow: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  emptyRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#123F3A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyIcon: {
    flexShrink: 0,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  addInlineBtn: {
    backgroundColor: '#E7F3EF',
    borderColor: '#147D78',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    flexShrink: 0,
  },
  addInlineBtnText: {
    color: '#147D78',
    fontSize: 13,
    fontWeight: '600',
  },
  contactsListWrap: {
    gap: 10,
  },
  contactCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#147D78',
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
  },
  contactRel: {
    fontSize: 12.5,
    marginTop: 2,
  },
  contactNote: {
    fontSize: 11.5,
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
    marginTop: 10,
  },
  contactActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#147D78',
    backgroundColor: '#E7F3EF',
    gap: 6,
  },
  contactActionBtnOutline: {
    backgroundColor: 'transparent',
    borderColor: '#E8EDEA',
  },
  contactActionBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#147D78',
  },
  addAnotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E8EDEA',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  addAnotherBtnText: {
    color: '#147D78',
    fontSize: 13,
    fontWeight: '600',
  },
  privacyNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 2,
  },
  privacyNoteText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
  modalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputField: {
    height: 42,
    borderRadius: 8,
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
    borderRadius: 6,
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
    borderRadius: 4,
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
    borderColor: '#F6B7A5',
    backgroundColor: '#FFF7F5',
    gap: 6,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E64A2E',
    flex: 1,
  },
  msgPrompt: {
    fontSize: 12,
    marginBottom: 8,
  },
  msgInput: {
    minHeight: 70,
    borderRadius: 8,
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
