/**
 * M.A.K Indoor Pool — Digital Wallet Pass Interfaces
 * Strict TypeScript typing for Apple Wallet (.pkpass) and Google Wallet integration.
 */

export interface WalletBookingData {
  id: string;                    // Human-friendly ID, e.g. MAK-20261113-001
  qrToken: string;              // Server-generated unique verification token
  type: "PUBLIC" | "FAMILY" | string;
  status: "CONFIRMED" | "HOLD" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | string;
  bookingDate: string;          // YYYY-MM-DD
  startTime: string;            // HH:mm (e.g. 10:00)
  endTime: string;              // HH:mm (e.g. 12:00)
  durationHours: number;
  guestCount: number;
  customerName: string;
  customerPhone: string;
  customerPlace?: string | null;
  totalAmount: number;
  totalPaid: number;
  balanceAmount: number;
  paymentStatus: string;
  checkInStatus: string;
}

export interface AppleWalletCredentials {
  passTypeIdentifier?: string;
  teamIdentifier?: string;
  certificateBase64?: string;
  certificatePassword?: string;
  wwdrCertificateBase64?: string;
}

export interface GoogleWalletCredentials {
  issuerId?: string;
  serviceAccountEmail?: string;
  privateKey?: string;
  classId?: string;
}

export interface WalletValidationResult {
  valid: boolean;
  statusCode: number;
  error?: string;
  booking?: WalletBookingData;
}
