// Input validation utilities
// Client and server-side validation functions

/**
 * Validate and clean car plate number
 * Accepts: "1234567", "12-345-67", "12 345 67", "AB-123-45"
 * Returns: cleaned version without dashes/spaces
 */
export function validateCarPlate(plate: string): { valid: boolean; cleaned: string; error?: string } {
  if (!plate || plate.trim().length === 0) {
    return { valid: false, cleaned: '', error: 'מספר רישוי נדרש' };
  }

  // Remove dashes, spaces, and trim
  const cleaned = plate.replace(/[-\s]/g, '').trim().toUpperCase();

  // Israeli plates are typically 7-8 characters (numbers and/or letters)
  if (cleaned.length < 6 || cleaned.length > 8) {
    return { valid: false, cleaned: '', error: 'מספר רישוי חייב להיות 6-8 תווים' };
  }

  // Only alphanumeric characters
  if (!/^[A-Z0-9]+$/.test(cleaned)) {
    return { valid: false, cleaned: '', error: 'מספר רישוי יכול להכיל רק אותיות ומספרים' };
  }

  return { valid: true, cleaned };
}

/**
 * Validate and clean Israeli phone number
 * Accepts: "0501234567", "050-123-4567", "+972501234567", "972501234567"
 * Returns: international format "+972501234567"
 */
export function validatePhoneNumber(phone: string): { valid: boolean; cleaned: string; error?: string } {
  if (!phone || phone.trim().length === 0) {
    return { valid: false, cleaned: '', error: 'מספר טלפון נדרש' };
  }

  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Handle different formats
  if (cleaned.startsWith('+972')) {
    // Already in international format: +972501234567
    cleaned = cleaned;
  } else if (cleaned.startsWith('972')) {
    // Missing +: 972501234567
    cleaned = '+' + cleaned;
  } else if (cleaned.startsWith('0')) {
    // Israeli format: 0501234567
    cleaned = '+972' + cleaned.substring(1);
  } else {
    return { valid: false, cleaned: '', error: 'פורמט טלפון לא תקין' };
  }

  // Validate length: +972 + 9 digits = 13 characters
  if (cleaned.length !== 13) {
    return { valid: false, cleaned: '', error: 'מספר טלפון חייב להכיל 10 ספרות (כולל קידומת)' };
  }

  return { valid: true, cleaned };
}

/**
 * Validate and clean quote amount
 * Accepts: "5000", "5,000", "5000.50"
 * Returns: cleaned numeric string
 */
export function validateQuoteAmount(amount: string): { valid: boolean; cleaned: string; error?: string } {
  if (!amount || amount.trim().length === 0) {
    return { valid: false, cleaned: '', error: 'סכום הצעה נדרש' };
  }

  // Remove commas and spaces
  const cleaned = amount.replace(/[,\s]/g, '').trim();

  // Check if it's a valid number
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return { valid: false, cleaned: '', error: 'סכום חייב להיות מספר תקין' };
  }

  // Check if amount is reasonable (not zero, not negative)
  const numValue = parseFloat(cleaned);
  if (numValue <= 0) {
    return { valid: false, cleaned: '', error: 'סכום חייב להיות גדול מאפס' };
  }

  if (numValue > 10000000) {
    return { valid: false, cleaned: '', error: 'סכום גבוה מדי' };
  }

  return { valid: true, cleaned };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'אימייל נדרש' };
  }

  const trimmed = email.trim().toLowerCase();

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'פורמט אימייל לא תקין' };
  }

  return { valid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string; strength?: 'weak' | 'medium' | 'strong' } {
  if (!password || password.length === 0) {
    return { valid: false, error: 'סיסמה נדרשת' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'סיסמה חייבת להיות לפחות 6 תווים' };
  }

  // Check strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isLong = password.length >= 10;

  if (hasNumber && hasLetter && password.length >= 8) {
    strength = 'medium';
  }

  if (hasNumber && hasLetter && hasSpecial && isLong) {
    strength = 'strong';
  }

  return { valid: true, strength };
}

/**
 * Validate customer name
 */
export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'שם נדרש' };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: 'שם חייב להכיל לפחות 2 תווים' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'שם ארוך מדי' };
  }

  // Allow letters (Hebrew, English), spaces, and common punctuation
  if (!/^[\u0590-\u05FFa-zA-Z\s.'"-]+$/.test(trimmed)) {
    return { valid: false, error: 'שם יכול להכיל רק אותיות ורווחים' };
  }

  return { valid: true };
}

/**
 * Validate quote number
 */
export function validateQuoteNumber(quoteNum: string): { valid: boolean; error?: string } {
  if (!quoteNum || quoteNum.trim().length === 0) {
    return { valid: false, error: 'מספר הצעה נדרש' };
  }

  const trimmed = quoteNum.trim();

  // Allow numbers and common separators
  if (!/^[0-9/-]+$/.test(trimmed)) {
    return { valid: false, error: 'מספר הצעה יכול להכיל רק מספרים, / או -' };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: 'מספר הצעה ארוך מדי' };
  }

  return { valid: true };
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (!input) return '';

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .substring(0, 1000); // Limit length
}
