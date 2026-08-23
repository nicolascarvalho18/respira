import { AdminLog } from '../types';

export const MOCK_ADMIN_LOGS: AdminLog[] = [
  {
    id: 'log-1',
    adminId: 'admin-demo-1',
    action: 'ARTICLE_PUBLISHED',
    target: 'Artigo: O que a ciência nos ensina sobre a ansiedade',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    ipAddressMasked: '192.168.***.***',
  },
  {
    id: 'log-2',
    adminId: 'admin-demo-1',
    action: 'PRACTICE_CREATED',
    target: 'Prática: Respiração 4-7-8',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    ipAddressMasked: '192.168.***.***',
  },
  {
    id: 'log-3',
    adminId: 'admin-demo-1',
    action: 'CATEGORY_UPDATED',
    target: 'Categoria: Sono e Descanso',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    ipAddressMasked: '192.168.***.***',
  },
  {
    id: 'log-4',
    adminId: 'admin-demo-1',
    action: 'SYSTEM_BACKUP',
    target: 'Backup automático de configurações',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    ipAddressMasked: '10.0.***.***',
  },
];

export interface SanitizedUserStats {
  id: string;
  name: string;
  emailMasked: string;
  role: string;
  createdAt: string;
  totalCheckins: number;
  lastActive: string;
}

export const MOCK_SANITIZED_USERS: SanitizedUserStats[] = [
  {
    id: 'user-demo-1',
    name: 'Ana',
    emailMasked: 'a***a@exemplo.com',
    role: 'Usuário',
    createdAt: '2024-01-15',
    totalCheckins: 7,
    lastActive: 'Hoje',
  },
  {
    id: 'user-demo-2',
    name: 'Lucas Almeida',
    emailMasked: 'l***s@email.com',
    role: 'Usuário',
    createdAt: '2024-02-01',
    totalCheckins: 14,
    lastActive: 'Ontem',
  },
  {
    id: 'user-demo-3',
    name: 'Mariana Costa',
    emailMasked: 'm***a@servico.com',
    role: 'Usuário',
    createdAt: '2024-02-20',
    totalCheckins: 3,
    lastActive: 'Há 3 dias',
  },
];
