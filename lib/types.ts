export interface Quote {
  id: string;
  customerName: string;
  idNumber?: string;
  carPlate: string;
  phoneNumber: string;
  quoteImageUrl: string;
  notes: string;
  status: 'pending' | 'approved';
  signatureImageUrl: string | null;
  createdAt: Date;
  approvedAt: Date | null;
}

export type QuoteFormData = Omit<Quote, 'id' | 'status' | 'signatureImageUrl' | 'createdAt' | 'approvedAt'>;
