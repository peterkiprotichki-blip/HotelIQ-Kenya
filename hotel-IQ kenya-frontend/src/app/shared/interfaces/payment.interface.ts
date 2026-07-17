export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'partial';
export type PaymentMethod = 'mpesa' | 'bank_transfer' | 'cash' | 'cheque' | 'card' | 'other';
export type PaymentType = 'rent' | 'deposit' | 'late_fee' | 'damage' | 'utility' | 'other';

export interface Payment {
  _id: string;
  tenantId: string;
  leaseId: string;
  propertyTenantId: string;
  propertyId: string;
  amount: number;
  currency: string;
  paymentDate: string | Date;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  status: PaymentStatus;
  mpesaTransactionId?: string;
  mpesaPhoneNumber?: string;
  bankReference?: string;
  chequeNumber?: string;
  receiptNumber: string;
  paymentPeriod?: string;
  notes?: string;
  propertyName?: string;
  propertyTenantName?: string;
  recordedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentDto {
  leaseId: string;
  propertyTenantId: string;
  propertyId: string;
  amount: number;
  currency?: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  paymentType?: PaymentType;
  mpesaTransactionId?: string;
  mpesaPhoneNumber?: string;
  bankReference?: string;
  chequeNumber?: string;
  receiptNumber?: string;
  paymentPeriod?: string;
  notes?: string;
  propertyName?: string;
  propertyTenantName?: string;
}

export interface PaymentFilter {
  propertyId?: string;
  unitId?: string;
  propertyTenantId?: string;
  paymentType?: PaymentType;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  status?: PaymentStatus;
}

export interface PaginatedPaymentResponse {
  data: Payment[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaymentStats {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  totalCompleted: number;
  totalPending: number;
  monthlyRevenue?: number;
}
