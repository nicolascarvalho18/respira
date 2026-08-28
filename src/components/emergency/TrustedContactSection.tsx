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
  Switch,
  ActivityIndicator,
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
  ChevronDown,
  Share2,
  Copy,
  AlertCircle,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useBreakpoint } from '../../hooks/useBreakpoint';
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
  const { isDesktop } = useBreakpoint();
  const { showToast } = useToast();

  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<TrustedContact | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Amigo(a)');
  const [isRelationshipDropdownOpen, setIsRelationshipDropdownOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [allowCall, setAllowCall] = useState(true);
  const [allowMessage, setAllowMessage] = useState(true);
  const [contactIsAware, setContactIsAware] = useState(true);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
    setIsRelationshipDropdownOpen(false);
    setPhone('');
    setNotes('');
    setIsPrimary(contacts.length === 0);
    setAllowCall(true);
    setAllowMessage(true);
    setContactIsAware(true);
    setFormError('');
    setIsSaving(false);
    setIsModalOpen(true);
  };

  const openEditModal = (c: TrustedContact) => {
    setEditingContact(c);
    setName(c.name);
    setRelationship(c.relationship || 'Amigo(a)');
    setIsRelationshipDropdownOpen(false);
    setPhone(c.phoneFormatted || c.phone);
    setNotes(c.notes || '');
    setIsPrimary(!!c.isPrimary);
    setAllowCall(c.allowCall);
    setAllowMessage(c.allowMessage);
    setContactIsAware(c.contactIsAware);
    setFormError('');
    setIsSaving(false);
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
      setIsSaving(true);
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

      showToast({ message: 'Contato salvo', type: 'success' });
      setIsModalOpen(false);
      await loadContacts();
    } catch {
      showToast({ message: 'Não foi possível salvar o contato.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!contactToDelete) return;
    try {
      await trustedContactService.deleteContact(contactToDelete.id);
      showToast({ message: 'Contato removido', type: 'success' });
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
    showToast({ message: 'Mensagem copiada', type: 'success' });
  };

  return (
    <View style={styles.container}>
      {/* Título da Seção */}
      <View style={styles.sectionHeaderRow}>
        <Text
          accessibilityRole="header"
          aria-level={2}
          style={[styles.sectionTitle, { color: isDark ? colors.text : '#1F2927' }]}
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
              borderColor: isDark ? colors.border : '#D8DEDB',
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
          <Text style={[styles.emptyText, { color: isDark ? colors.textMuted : '#68736F' }]}>
            Adicione contatos próximos para conversar ou pedir ajuda quando precisar.
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
                  borderColor: isDark ? colors.border : '#D8DEDB',
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
                  <Text style={[styles.contactName, { color: isDark ? colors.text : '#1F2927' }]}>
                    {contact.name}
                  </Text>
                  <Text style={[styles.contactRel, { color: isDark ? colors.textMuted : '#68736F' }]}>
                    {contact.relationship} • {contact.phoneMasked}
                  </Text>
                  {contact.notes ? (
                    <Text style={[styles.contactNote, { color: isDark ? colors.textMuted : '#68736F' }]}>
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
                    <Pencil size={16} color="#68736F" strokeWidth={1.75} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setContactToDelete(contact)}
                    style={styles.iconBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Remover ${contact.name}`}
                  >
                    <Trash2 size={16} color="#C65F4A" strokeWidth={1.75} />
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
                    <Phone size={15} color="#247B74" strokeWidth={1.75} />
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
                    <MessageCircle size={15} color="#247B74" strokeWidth={1.75} />
                    <Text style={[styles.contactActionBtnText, { color: isDark ? colors.text : '#1F2927' }]}>
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
              <UserRoundPlus size={16} color="#247B74" strokeWidth={1.75} />
              <Text style={styles.addAnotherBtnText}>Adicionar outro contato</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Observação de Privacidade com LockKeyhole */}
      <View style={styles.privacyNoteRow}>
        <LockKeyhole
          size={16}
          color="#68736F"
          strokeWidth={1.75}
          style={{ marginRight: 8, marginTop: 1 }}
          aria-hidden={true}
        />
        <Text style={[styles.privacyNoteText, { color: isDark ? colors.textMuted : '#68736F' }]}>
          Estes contatos ficam gravados apenas no seu aparelho e não são compartilhados com ninguém.
        </Text>
      </View>

      {/* Formulário Novo / Editar Contato de Confiança (Bottom Sheet no Mobile, Modal Centralizado no Desktop) */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            isDesktop ? styles.modalOverlayDesktop : styles.modalOverlayMobile,
          ]}
        >
          <View
            style={[
              styles.sheetContainer,
              isDesktop ? styles.sheetContainerDesktop : styles.sheetContainerMobile,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: isDark ? colors.border : '#D8DEDB',
              },
            ]}
          >
            {/* Indicador de arraste no topo no mobile */}
            {!isDesktop && <View style={styles.dragHandle} />}

            {/* Cabeçalho Fixo */}
            <View style={styles.sheetHeader}>
              <Text
                accessibilityRole="header"
                aria-level={2}
                style={[styles.sheetTitle, { color: isDark ? colors.text : '#1F2927' }]}
              >
                {editingContact ? 'Editar contato de confiança' : 'Novo contato de confiança'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Fechar formulário"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.sheetCloseBtn}
              >
                <X size={20} color={isDark ? colors.text : '#1F2927'} strokeWidth={1.75} />
              </TouchableOpacity>
            </View>

            {/* Corpo Rolável do Formulário */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetBodyScroll}
              keyboardShouldPersistTaps="handled"
            >
              {formError ? (
                <View style={styles.errorBox}>
                  <AlertCircle size={15} color="#C65F4A" strokeWidth={1.75} />
                  <Text style={styles.errorText}>{formError}</Text>
                </View>
              ) : null}

              {/* 1. Nome da pessoa */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: isDark ? colors.text : '#1F2927' }]}>
                  Nome da pessoa <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (formError) setFormError('');
                  }}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Ex.: Mariana Silva"
                  placeholderTextColor="#9AA5A1"
                  style={[
                    styles.textInput,
                    {
                      color: isDark ? colors.text : '#1F2927',
                      borderColor:
                        focusedField === 'name'
                          ? '#247B74'
                          : isDark
                          ? colors.border
                          : '#D8DEDB',
                      backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                    },
                  ]}
                />
              </View>

              {/* 2. Vínculo (Campo Select) */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: isDark ? colors.text : '#1F2927' }]}>
                  Vínculo
                </Text>
                <TouchableOpacity
                  onPress={() => setIsRelationshipDropdownOpen(!isRelationshipDropdownOpen)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Vínculo selecionado: ${relationship}. Toque para alterar.`}
                  style={[
                    styles.selectBox,
                    {
                      borderColor:
                        isRelationshipDropdownOpen
                          ? '#247B74'
                          : isDark
                          ? colors.border
                          : '#D8DEDB',
                      backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                    },
                  ]}
                >
                  <Text style={[styles.selectValueText, { color: isDark ? colors.text : '#1F2927' }]}>
                    {relationship || 'Selecione uma opção'}
                  </Text>
                  <ChevronDown size={20} color={isDark ? colors.text : '#1F2927'} strokeWidth={1.75} />
                </TouchableOpacity>

                {/* Dropdown Menu com todas as opções */}
                {isRelationshipDropdownOpen && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      {
                        backgroundColor: isDark ? colors.surface : '#FFFFFF',
                        borderColor: isDark ? colors.border : '#D8DEDB',
                      },
                    ]}
                  >
                    {RELATIONSHIPS.map((rel, index) => {
                      const isSelected = relationship === rel;
                      return (
                        <TouchableOpacity
                          key={rel}
                          onPress={() => {
                            setRelationship(rel);
                            setIsRelationshipDropdownOpen(false);
                          }}
                          style={[
                            styles.dropdownItem,
                            isSelected && { backgroundColor: isDark ? '#1C302D' : '#F0F7F6' },
                            index === RELATIONSHIPS.length - 1 && { borderBottomWidth: 0 },
                          ]}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              {
                                color: isSelected ? '#247B74' : isDark ? colors.text : '#1F2927',
                                fontWeight: isSelected ? '600' : '400',
                              },
                            ]}
                          >
                            {rel}
                          </Text>
                          {isSelected && <Check size={16} color="#247B74" strokeWidth={2} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* 3. Telefone celular */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: isDark ? colors.text : '#1F2927' }]}>
                  Telefone celular <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <View
                  style={[
                    styles.phoneInputContainer,
                    {
                      borderColor:
                        focusedField === 'phone'
                          ? '#247B74'
                          : isDark
                          ? colors.border
                          : '#D8DEDB',
                      backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.phonePrefixBox,
                      {
                        borderRightColor: isDark ? colors.border : '#D8DEDB',
                        backgroundColor: isDark ? colors.surface : '#FFFFFF',
                      },
                    ]}
                  >
                    <Text style={[styles.phonePrefixText, { color: isDark ? colors.text : '#1F2927' }]}>
                      +55
                    </Text>
                  </View>
                  <TextInput
                    value={phone}
                    onChangeText={handlePhoneChange}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    keyboardType="phone-pad"
                    placeholder="(11) 98765-4321"
                    placeholderTextColor="#9AA5A1"
                    maxLength={15}
                    style={[
                      styles.phoneInputField,
                      {
                        color: isDark ? colors.text : '#1F2927',
                      },
                    ]}
                  />
                </View>
              </View>

              {/* 4. Observação */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.fieldLabel, { color: isDark ? colors.text : '#1F2927' }]}>
                    Observação
                  </Text>
                  <Text style={[styles.optionalLabel, { color: isDark ? colors.textMuted : '#68736F' }]}>
                    Opcional
                  </Text>
                </View>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  onFocus={() => setFocusedField('notes')}
                  onBlur={() => setFocusedField(null)}
                  multiline={true}
                  numberOfLines={3}
                  placeholder="Ex.: Mora perto e costuma estar disponível à noite"
                  placeholderTextColor="#9AA5A1"
                  style={[
                    styles.textAreaInput,
                    {
                      color: isDark ? colors.text : '#1F2927',
                      borderColor:
                        focusedField === 'notes'
                          ? '#247B74'
                          : isDark
                          ? colors.border
                          : '#D8DEDB',
                      backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                    },
                  ]}
                />
              </View>

              {/* 5. Seção Permissões */}
              <View style={styles.permissionsGroup}>
                <Text style={[styles.permissionsHeading, { color: isDark ? colors.text : '#1F2927' }]}>
                  Permissões
                </Text>

                <View style={styles.permissionRow}>
                  <Text style={[styles.permissionLabel, { color: isDark ? colors.text : '#1F2927' }]}>
                    Permitir ligação direta
                  </Text>
                  <Switch
                    value={allowCall}
                    onValueChange={setAllowCall}
                    trackColor={{ false: '#ECEFEE', true: '#247B74' }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#ECEFEE"
                  />
                </View>

                <View style={[styles.permissionDivider, { backgroundColor: isDark ? colors.border : '#E8EDEA' }]} />

                <View style={styles.permissionRow}>
                  <Text style={[styles.permissionLabel, { color: isDark ? colors.text : '#1F2927' }]}>
                    Permitir mensagem por WhatsApp ou SMS
                  </Text>
                  <Switch
                    value={allowMessage}
                    onValueChange={setAllowMessage}
                    trackColor={{ false: '#ECEFEE', true: '#247B74' }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#ECEFEE"
                  />
                </View>
              </View>

              {/* 6. Consentimento Obrigatório */}
              <View style={styles.consentBlock}>
                <TouchableOpacity
                  onPress={() => {
                    setContactIsAware(!contactIsAware);
                    if (formError) setFormError('');
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: contactIsAware }}
                  accessibilityLabel="Esta pessoa sabe que foi indicada como meu contato de confiança"
                  style={styles.consentCheckboxRow}
                >
                  <View
                    style={[
                      styles.standardCheckbox,
                      contactIsAware && { backgroundColor: '#247B74', borderColor: '#247B74' },
                    ]}
                  >
                    {contactIsAware && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                  <Text style={[styles.consentText, { color: isDark ? colors.text : '#1F2927' }]}>
                    Esta pessoa sabe que foi indicada como meu contato de confiança.{' '}
                    <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.consentSubtext, { color: isDark ? colors.textMuted : '#68736F' }]}>
                  Você poderá alterar essas permissões depois.
                </Text>
              </View>
            </ScrollView>

            {/* Rodapé Fixo */}
            <View
              style={[
                styles.sheetFooter,
                {
                  backgroundColor: isDark ? colors.surface : '#FFFFFF',
                  borderTopColor: isDark ? colors.border : '#E8EDEA',
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                activeOpacity={0.8}
                disabled={isSaving}
                style={[
                  styles.cancelBtn,
                  {
                    backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                    borderColor: isDark ? colors.border : '#D8DEDB',
                  },
                ]}
              >
                <Text style={[styles.cancelBtnText, { color: isDark ? colors.text : '#1F2927' }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                activeOpacity={0.85}
                disabled={isSaving}
                style={[
                  styles.saveBtn,
                  isSaving && { opacity: 0.7 },
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Salvar contato</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Enviar Mensagem (WhatsApp / SMS) */}
      <Modal
        visible={!!messageModalContact}
        transparent
        animationType="fade"
        onRequestClose={() => setMessageModalContact(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: colors.border },
            ]}
          >
            <View style={styles.modalTop}>
              <Text style={[styles.modalTitle, { color: isDark ? colors.text : '#1F2927' }]}>
                Enviar mensagem para {messageModalContact?.name.split(' ')[0]}
              </Text>
              <TouchableOpacity
                onPress={() => setMessageModalContact(null)}
                accessibilityRole="button"
                accessibilityLabel="Fechar modal de mensagem"
              >
                <X size={20} color="#68736F" strokeWidth={1.75} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.msgPrompt, { color: isDark ? colors.textMuted : '#68736F' }]}>
              Você pode personalizar a mensagem antes de enviar:
            </Text>

            <TextInput
              multiline
              value={customMessage}
              onChangeText={setCustomMessage}
              style={[
                styles.msgInput,
                {
                  color: isDark ? colors.text : '#1F2927',
                  borderColor: isDark ? colors.border : '#D8DEDB',
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
                leftIcon={<MessageCircle size={16} color="#247B74" strokeWidth={1.75} />}
                onPress={handleSendSMS}
              />
              <AppButton
                title="Copiar Texto"
                variant="ghost"
                leftIcon={<Copy size={16} color={isDark ? colors.text : '#1F2927'} strokeWidth={1.75} />}
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
    borderColor: '#247B74',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    flexShrink: 0,
  },
  addInlineBtnText: {
    color: '#247B74',
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
    color: '#247B74',
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
    borderColor: '#247B74',
    backgroundColor: '#E7F3EF',
    gap: 6,
  },
  contactActionBtnOutline: {
    backgroundColor: 'transparent',
    borderColor: '#D8DEDB',
  },
  contactActionBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#247B74',
  },
  addAnotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D8DEDB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  addAnotherBtnText: {
    color: '#247B74',
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

  // Estilos do Bottom Sheet / Modal do Formulário
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 1000,
  },
  modalOverlayMobile: {
    justifyContent: 'flex-end',
    margin: 0,
    padding: 0,
  },
  modalOverlayDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  sheetContainerMobile: {
    width: '100%',
    maxHeight: '92%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetContainerDesktop: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    borderRadius: 16,
    borderWidth: 1,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D8DEDB',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDEA',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  sheetCloseBtn: {
    padding: 4,
  },
  sheetBodyScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 18,
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionalLabel: {
    fontSize: 13,
    fontWeight: '400',
  },
  requiredAsterisk: {
    color: '#C65F4A',
    fontWeight: '700',
  },
  textInput: {
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  selectBox: {
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValueText: {
    fontSize: 16,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F1',
  },
  dropdownItemText: {
    fontSize: 15,
  },
  phoneInputContainer: {
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  phonePrefixBox: {
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
  },
  phonePrefixText: {
    fontSize: 16,
  },
  phoneInputField: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 14,
    fontSize: 16,
  },
  textAreaInput: {
    minHeight: 52,
    maxHeight: 90,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  permissionsGroup: {
    paddingTop: 4,
  },
  permissionsHeading: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  permissionRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permissionLabel: {
    fontSize: 15,
  },
  permissionDivider: {
    height: 1,
  },
  consentBlock: {
    paddingTop: 4,
    gap: 6,
  },
  consentCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  standardCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D8DEDB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  consentText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    fontWeight: '400',
  },
  consentSubtext: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    paddingLeft: 30,
  },
  sheetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#247B74',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F6B7A5',
    backgroundColor: '#FFF7F5',
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C65F4A',
    flex: 1,
  },

  // Modal de mensagem
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
