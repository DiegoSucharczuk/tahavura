// Client-side Firestore operations
// Now using API routes for secure database access

import { Quote, QuoteFormData, User, UserFormData } from './types';

// =====================
// QUOTE OPERATIONS
// =====================

/**
 * Get all quotes (authenticated users only)
 * Calls API route that validates session
 */
export async function getAllQuotes(): Promise<Quote[]> {
  try {
    const response = await fetch('/api/quotes', {
      credentials: 'include', // Send cookies
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized - redirect to login
        console.error('Session expired - redirecting to login');
        window.location.href = '/login';
        return [];
      }
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to fetch quotes:', errorData);
      throw new Error(errorData.error || 'Failed to fetch quotes');
    }

    const { quotes } = await response.json();

    return quotes.map((q: any) => ({
      ...q,
      createdAt: new Date(q.createdAt),
      approvedAt: q.approvedAt ? new Date(q.approvedAt) : null,
    }));
  } catch (error) {
    console.error('Error fetching quotes:', error);
    throw error;
  }
}

/**
 * Get single quote by ID (public for customer approval)
 */
export async function getQuote(quoteId: string): Promise<Quote | null> {
  try {
    const response = await fetch(`/api/quotes/${quoteId}`);

    if (!response.ok) {
      return null;
    }

    const { quote } = await response.json();

    return {
      ...quote,
      createdAt: new Date(quote.createdAt),
      approvedAt: quote.approvedAt ? new Date(quote.approvedAt) : null,
    };
  } catch (error) {
    console.error('Error fetching quote:', error);
    return null;
  }
}

/**
 * Create new quote (authenticated users only)
 */
export async function createQuote(data: QuoteFormData): Promise<string> {
  try {
    const response = await fetch('/api/quotes/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create quote');
    }

    const { quoteId } = await response.json();
    return quoteId;
  } catch (error) {
    console.error('Error creating quote:', error);
    throw error;
  }
}

/**
 * Update quote with signature (public for customer approval)
 */
export async function updateQuoteWithSignature(
  quoteId: string,
  signatureImageUrl: string,
  idNumber?: string
): Promise<void> {
  try {
    const response = await fetch(`/api/quotes/${quoteId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ signatureImageUrl, idNumber }),
    });

    if (!response.ok) {
      throw new Error('Failed to approve quote');
    }
  } catch (error) {
    console.error('Error approving quote:', error);
    throw error;
  }
}

/**
 * Delete quote (authenticated users only)
 */
export async function deleteQuote(quoteId: string): Promise<void> {
  try {
    const response = await fetch(`/api/quotes/${quoteId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete quote');
    }
  } catch (error) {
    console.error('Error deleting quote:', error);
    throw error;
  }
}

// =====================
// IMAGE UPLOAD
// =====================

/**
 * Upload image (stores base64 directly)
 * NOTE: For production, consider moving to Firebase Storage
 */
export async function uploadImage(
  file: File | Blob,
  path: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      resolve(dataUrl); // Return base64 directly
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadImageFromDataUrl(
  dataUrl: string,
  path: string
): Promise<string> {
  return dataUrl; // Return base64 directly
}

// =====================
// USER MANAGEMENT
// =====================

/**
 * Get all users (admin only)
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const response = await fetch('/api/users', {
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Unauthorized - redirect to login
        console.error('Session expired or insufficient permissions - redirecting to login');
        window.location.href = '/login';
        return [];
      }
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to fetch users:', errorData);
      throw new Error(errorData.error || 'Failed to fetch users');
    }

    const { users } = await response.json();

    return users.map((u: any) => ({
      ...u,
      createdAt: new Date(u.createdAt),
      lastLogin: u.lastLogin ? new Date(u.lastLogin) : null,
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

/**
 * Create new user (admin only)
 * Password is hashed server-side
 */
export async function createUser(
  email: string,
  password: string,
  name: string,
  role: 'admin' | 'worker' = 'worker'
): Promise<string> {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, name, role }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create user');
    }

    const { userId } = await response.json();
    return userId;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

/**
 * Update user password
 * For own password: requires current password
 * For admin changing others: no current password needed
 */
export async function updateUserPassword(
  userId: string,
  newPassword: string,
  currentPassword?: string
): Promise<void> {
  try {
    const response = await fetch(`/api/users/${userId}/password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ newPassword, currentPassword }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to update password');
    }
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
}

// Legacy functions (kept for backwards compatibility)
export async function getUserByEmail(email: string): Promise<User | null> {
  console.warn('getUserByEmail is deprecated - use API routes instead');
  return null;
}

export async function updateUser(
  userId: string,
  updates: Partial<User>
): Promise<void> {
  console.warn('updateUser is deprecated - use specific API routes instead');
}

export async function updateLastLogin(userId: string): Promise<void> {
  // Now handled server-side in login API
}
