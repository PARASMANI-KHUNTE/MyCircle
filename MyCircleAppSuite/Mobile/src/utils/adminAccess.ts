export const isAdminUser = (user: { role?: string } | null | undefined): boolean => user?.role === 'admin';

export const ADMIN_ROLES = ['admin'];
