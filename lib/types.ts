export interface Quote {
  id: string;
  customerName: string;
  idNumber?: string;
  carPlate: string;
  phoneNumber: string;
  quoteImageUrl: string;
  quoteImageUrl2?: string; // Optional second image
  quoteNumber: string;
  quoteAmount: string;
  notes: string;
  status: 'pending' | 'approved';
  signatureImageUrl: string | null;
  createdAt: Date;
  approvedAt: Date | null;
}

export type QuoteFormData = Omit<Quote, 'id' | 'status' | 'signatureImageUrl' | 'createdAt' | 'approvedAt'>;

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'admin' | 'worker';
  createdAt: Date;
  lastLogin: Date | null;
}

export type UserFormData = Omit<User, 'id' | 'passwordHash' | 'createdAt' | 'lastLogin'>;
