import { storage } from '../storage/asyncStorage';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { logger } from '../../utils/logger';

export interface TrustedContact {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  phone: string; // Plain phone for dialer
  phoneMasked: string; // (11) 9****-4321
  allowCall: boolean;
  allowMessage: boolean;
  contactIsAware: boolean;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'respira_trusted_contacts';

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
            .order('created_at', { ascending: true });

          if (!error && data) {
            return data.map((c) => ({
              id: c.id,
              userId: c.user_id,
              name: c.name,
              relationship: c.relationship,
              phone: c.phone_encrypted, // Decrypted in real client or stored safely
              phoneMasked: c.phone_masked,
              allowCall: c.allow_call,
              allowMessage: c.allow_message,
              contactIsAware: c.contact_is_aware,
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

  async saveContact(contact: Omit<TrustedContact, 'id' | 'createdAt' | 'updatedAt' | 'phoneMasked'> & { id?: string }): Promise<TrustedContact> {
    const masked = maskPhoneNumber(contact.phone);
    const now = new Date().toISOString();
    const id = contact.id || `tc-${Date.now()}`;

    const newContact: TrustedContact = {
      ...contact,
      id,
      phoneMasked: masked,
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
            phone_encrypted: contact.phone,
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
    const filtered = existing.filter((c) => c.id !== newContact.id);
    const updated = [...filtered, newContact];
    await storage.setItem(STORAGE_KEY, updated);

    return newContact;
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
