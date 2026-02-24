import { Quote, QuoteFormData, User, UserFormData } from './types';
import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';

const QUOTES_KEY = 'tahavura_quotes';
const QUOTES_COLLECTION = 'quotes';

// Get all quotes from Firestore and/or localStorage
export async function getAllQuotes(): Promise<Quote[]> {
  try {
    // Try to fetch from Firestore
    const querySnapshot = await getDocs(collection(db, QUOTES_COLLECTION));
    const quotes: Quote[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      quotes.push({
        id: doc.id,
        customerName: data.customerName,
        carPlate: data.carPlate,
        phoneNumber: data.phoneNumber,
        quoteImageUrl: data.quoteImageUrl,
        notes: data.notes,
        status: data.status,
        signatureImageUrl: data.signatureImageUrl || null,
        idNumber: data.idNumber || '',
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        approvedAt: data.approvedAt?.toDate?.() || (data.approvedAt ? new Date(data.approvedAt) : null),
      } as Quote);
    });

    // Save to localStorage as cache
    const quotesMap: Record<string, any> = {};
    quotes.forEach((q) => {
      quotesMap[q.id] = {
        id: q.id,
        customerName: q.customerName,
        carPlate: q.carPlate,
        phoneNumber: q.phoneNumber,
        quoteImageUrl: q.quoteImageUrl,
        notes: q.notes,
        status: q.status,
        signatureImageUrl: q.signatureImageUrl,
        idNumber: q.idNumber,
        createdAt: q.createdAt.toISOString(),
        approvedAt: q.approvedAt?.toISOString() || null,
      };
    });
    localStorage.setItem(QUOTES_KEY, JSON.stringify(quotesMap));

    return quotes;
  } catch (error) {
    console.error('Error fetching from Firestore, using localStorage:', error);
    // Fallback to localStorage if Firestore fails
    const data = localStorage.getItem(QUOTES_KEY);
    const quotesMap = data ? JSON.parse(data) : {};
    
    const quotes = Object.values(quotesMap).map((q: any) => ({
      ...q,
      createdAt: new Date(q.createdAt),
      approvedAt: q.approvedAt ? new Date(q.approvedAt) : null,
    })) as Quote[];

    return quotes;
  }
}

// Get single quote
export async function getQuote(quoteId: string): Promise<Quote | null> {
  try {
    // Try Firestore first
    const docRef = doc(db, QUOTES_COLLECTION, quoteId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const quote = {
        id: docSnap.id,
        customerName: data.customerName,
        carPlate: data.carPlate,
        phoneNumber: data.phoneNumber,
        quoteImageUrl: data.quoteImageUrl,
        notes: data.notes,
        status: data.status,
        signatureImageUrl: data.signatureImageUrl || null,
        idNumber: data.idNumber || '',
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        approvedAt: data.approvedAt?.toDate?.() || (data.approvedAt ? new Date(data.approvedAt) : null),
      } as Quote;

      // Update localStorage cache
      const quotes = JSON.parse(localStorage.getItem(QUOTES_KEY) || '{}');
      quotes[quoteId] = {
        id: quote.id,
        customerName: quote.customerName,
        carPlate: quote.carPlate,
        phoneNumber: quote.phoneNumber,
        quoteImageUrl: quote.quoteImageUrl,
        notes: quote.notes,
        status: quote.status,
        signatureImageUrl: quote.signatureImageUrl,
        idNumber: quote.idNumber,
        createdAt: quote.createdAt.toISOString(),
        approvedAt: quote.approvedAt?.toISOString() || null,
      };
      localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));

      return quote;
    }
  } catch (error) {
    console.error('Error fetching from Firestore, checking localStorage:', error);
  }

  // Fallback to localStorage
  const quotes = JSON.parse(localStorage.getItem(QUOTES_KEY) || '{}');
  const quoteData = quotes[quoteId];
  
  if (!quoteData) {
    return null;
  }

  return {
    ...quoteData,
    createdAt: new Date(quoteData.createdAt),
    approvedAt: quoteData.approvedAt ? new Date(quoteData.approvedAt) : null,
  } as Quote;
}

// Create new quote
export async function createQuote(data: QuoteFormData): Promise<string> {
  const quoteId = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const quoteData = {
    customerName: data.customerName,
    carPlate: data.carPlate,
    phoneNumber: data.phoneNumber,
    quoteImageUrl: data.quoteImageUrl,
    notes: data.notes,
    idNumber: data.idNumber || '',
    status: 'pending',
    signatureImageUrl: null,
    createdAt: Timestamp.now(),
    approvedAt: null,
  };

  try {
    // Save to Firestore
    await setDoc(doc(db, QUOTES_COLLECTION, quoteId), quoteData);
  } catch (error) {
    console.error('Error saving to Firestore, saving to localStorage:', error);
  }

  // Always save to localStorage for offline access
  const quotes = JSON.parse(localStorage.getItem(QUOTES_KEY) || '{}');
  quotes[quoteId] = {
    id: quoteId,
    ...data,
    idNumber: data.idNumber || '',
    status: 'pending',
    signatureImageUrl: null,
    createdAt: new Date().toISOString(),
    approvedAt: null,
  };
  localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));

  return quoteId;
}

// Update quote with signature
export async function updateQuoteWithSignature(
  quoteId: string,
  signatureImageUrl: string,
  idNumber?: string
): Promise<void> {
  const updateData = {
    status: 'approved',
    signatureImageUrl,
    approvedAt: Timestamp.now(),
    ...(idNumber && { idNumber }),
  };

  try {
    // Update Firestore
    await updateDoc(doc(db, QUOTES_COLLECTION, quoteId), updateData);
  } catch (error) {
    console.error('Error updating Firestore, updating localStorage:', error);
  }

  // Always update localStorage
  const quotes = JSON.parse(localStorage.getItem(QUOTES_KEY) || '{}');
  if (quotes[quoteId]) {
    quotes[quoteId] = {
      ...quotes[quoteId],
      ...updateData,
      approvedAt: new Date().toISOString(),
    };
    localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
  }
}

// Delete quote
export async function deleteQuote(quoteId: string): Promise<void> {
  try {
    // Delete from Firestore
    await deleteDoc(doc(db, QUOTES_COLLECTION, quoteId));
  } catch (error) {
    console.error('Error deleting from Firestore, deleting from localStorage:', error);
  }

  // Always delete from localStorage
  const quotes = JSON.parse(localStorage.getItem(QUOTES_KEY) || '{}');
  delete quotes[quoteId];
  localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
}

// Upload image (stores base64 directly in quote, no separate storage)
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

const USERS_COLLECTION = 'users';

// Get all users
export async function getAllUsers(): Promise<User[]> {
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    const users: User[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        role: data.role || 'worker',
        createdAt: data.createdAt?.toDate?.() || new Date(),
        lastLogin: data.lastLogin?.toDate?.() || null,
      } as User);
    });

    return users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    let foundUser: User | null = null;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email === email) {
        foundUser = {
          id: doc.id,
          email: data.email,
          name: data.name,
          passwordHash: data.passwordHash,
          role: data.role || 'worker',
          createdAt: data.createdAt?.toDate?.() || new Date(),
          lastLogin: data.lastLogin?.toDate?.() || null,
        } as User;
      }
    });

    return foundUser;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

// Create new user
export async function createUser(
  email: string,
  passwordHash: string,
  name: string,
  role: 'admin' | 'worker' = 'worker'
): Promise<string> {
  try {
    const docRef = doc(collection(db, USERS_COLLECTION));
    
    await setDoc(docRef, {
      email,
      name,
      passwordHash,
      role,
      createdAt: Timestamp.now(),
      lastLogin: null,
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Update user
export async function updateUser(
  userId: string,
  updates: Partial<User>
): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    
    const dataToUpdate: any = { ...updates };
    
    // Remove fields that shouldn't be updated
    delete dataToUpdate.id;
    delete dataToUpdate.createdAt;

    await updateDoc(userRef, dataToUpdate);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// Update user password
export async function updateUserPassword(
  userId: string,
  newPasswordHash: string
): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, { passwordHash: newPasswordHash });
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
}

// Update last login
export async function updateLastLogin(userId: string): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, { lastLogin: Timestamp.now() });
  } catch (error) {
    console.error('Error updating last login:', error);
    // Don't throw - this is not critical
  }
}

// Delete user
export async function deleteUser(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}
