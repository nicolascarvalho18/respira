import { storage } from '../storage/asyncStorage';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { logger } from '../../utils/logger';

export interface TrustedContact {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  phone: string; // Plain digits (e.g., 11987654321)
  phoneMasked: string; // (11) 9****-4321
  phoneFormatted: string; // (11) 98765-4321
  isPrimary?: boolean;
  notes?: string;
  allowCall: boolean;
  allowMessage: boolean;
  contactIsAware: boolean;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'respira_trusted_contacts';

const VALID_DDDS = new Set([
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '21', '22', '24', '27', '28',
  '31', '32', '33', '34', '35', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48', '49',
  '51', '53', '54', '55',
  '61', '62', '63', '64', '65', '66', '67', '68', '69',
  '71', '73', '74', '75', '77', '79',
  '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '91', '92', '93', '94', '95', '96', '97', '98', '99',
]);

export function validateBrazilianPhone(phone: string): { isValid: boolean; message?: string } {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 11) {
    return { isValid: false, message: 'O telefone deve conter DDD + 8 ou 9 dígitos (10 ou 11 números).' };
  }

  const ddd = digits.slice(0, 2);
  if (!VALID_DDDS.has(ddd)) {
    return { isValid: false, message: `O DDD (${ddd}) não é um DDD brasileiro válido.` };
  }

  if (digits.length === 11 && digits.charAt(2) !== '9') {
    return { isValid: false, message: 'Celulares de 11 dígitos no Brasil devem iniciar com o dígito 9.' };
  }

  return { isValid: true };
}

export function formatBrazilianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';

  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return phone;

  const ddd = digits.slice(0, 2);
  const firstDigit = digits.length === 11 ? digits.slice(2, 3) : '';
  const lastFour = digits.slice(-4);

  if (digits.length === 11) {
    return `(${ddd}) ${firstDigit}****-${lastFour}`;
  }
  return `(${ddd}) ****-${lastFour}`;
}

class TrustedContactService {
  async getContacts(userId?: string): Promise<TrustedContact[]> {
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const targetUserId = userId || user?.id;

        if (targetUserId) {
          const { data, error } = await supabase
            .from('trusted_contacts')
            .select('*')
            .eq('user_id', targetUserId)
            .order('is_primary', { ascending: false })
            .order('created_at', { ascending: true });

          if (!error && data) {
            return data.map((c) => ({
              id: c.id,
              userId: c.user_id,
              name: c.name,
              relationship: c.relationship,
              phone: c.phone_encrypted || c.phone,
              phoneMasked: c.phone_masked || maskPhoneNumber(c.phone_encrypted || c.phone || ''),
              phoneFormatted: formatBrazilianPhone(c.phone_encrypted || c.phone || ''),
              isPrimary: !!c.is_primary,
              notes: c.notes || undefined,
              allowCall: c.allow_call !== false,
              allowMessage: c.allow_message !== false,
              contactIsAware: c.contact_is_aware !== false,
              createdAt: c.created_at,
              updatedAt: c.updated_at,
            }));
          }
        }
      } catch (err) {
        logger.warn('Error fetching trusted contacts from Supabase:', err);
      }
    }

    const local = (await storage.getItem<TrustedContact[]>(STORAGE_KEY)) || [];
    return local;
  }

  async saveContact(
    contact: Omit<TrustedContact, 'id' | 'createdAt' | 'updatedAt' | 'phoneMasked' | 'phoneFormatted'> & { id?: string }
  ): Promise<TrustedContact> {
    const cleanDigits = contact.phone.replace(/\D/g, '');
    const masked = maskPhoneNumber(cleanDigits);
    const formatted = formatBrazilianPhone(cleanDigits);
    const now = new Date().toISOString();
    const id = contact.id || `tc-${Date.now()}`;

    const newContact: TrustedContact = {
      ...contact,
      phone: cleanDigits,
      id,
      phoneMasked: masked,
      phoneFormatted: formatted,
      isPrimary: !!contact.isPrimary,
      notes: contact.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const payload = {
            id: contact.id || undefined,
            user_id: user.id,
            name: contact.name,
            relationship: contact.relationship,
            phone_masked: masked,
            phone_encrypted: cleanDigits,
            is_primary: !!contact.isPrimary,
            notes: contact.notes?.trim() || null,
            allow_call: contact.allowCall,
            allow_message: contact.allowMessage,
            contact_is_aware: contact.contactIsAware,
            updated_at: now,
          };

          const { data, error } = await supabase
            .from('trusted_contacts')
            .upsert(payload)
            .select()
            .single();

          if (!error && data) {
            newContact.id = data.id;
          }
        }
      } catch (err) {
        logger.warn('Error saving trusted contact to Supabase:', err);
      }
    }

    const existing = await this.getContacts(contact.userId);
    // If set as primary, unmark others
    const updatedList = existing.map((c) =>
      contact.isPrimary && c.id !== newContact.id ? { ...c, isPrimary: false } : c
    );

    const filtered = updatedList.filter((c) => c.id !== newContact.id);
    const updated = [newContact, ...filtered];
    await storage.setItem(STORAGE_KEY, updated);

    return newContact;
  }

  async setPrimaryContact(id: string, userId?: string): Promise<void> {
    const existing = await this.getContacts(userId);
    const updated = existing.map((c) => ({
      ...c,
      isPrimary: c.id === id,
    }));
    await storage.setItem(STORAGE_KEY, updated);

    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const targetUserId = userId || user?.id;
        if (targetUserId) {
          await supabase
            .from('trusted_contacts')
            .update({ is_primary: false })
            .eq('user_id', targetUserId);

          await supabase
            .from('trusted_contacts')
            .update({ is_primary: true })
            .eq('id', id);
        }
      } catch (err) {
        logger.warn('Error updating primary contact in Supabase:', err);
      }
    }
  }

  async deleteContact(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('trusted_contacts').delete().eq('id', id);
      } catch (err) {
        logger.warn('Error deleting trusted contact from Supabase:', err);
      }
    }

    const existing = await this.getContacts();
    const filtered = existing.filter((c) => c.id !== id);
    await storage.setItem(STORAGE_KEY, filtered);
    return true;
  }
}

export const trustedContactService = new TrustedContactService();
