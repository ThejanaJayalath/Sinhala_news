export const ADMIN_EMAIL = 'admin@sinhala.news';
export const ADMIN_PASSWORD = 'SinhalaNews#2025';

export const validateAdminCredentials = (email: string, password: string) =>
  email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD;

