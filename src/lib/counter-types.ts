/**
 * M.A.K Indoor Pool - Front Desk & Operations Types
 * Strict typing for the Counter Operations Dashboard, Offline Queue, and PWA Layer.
 */

export type SessionSegment = "PUBLIC" | "FAMILY";

export type SessionUrgency = "OVERDUE" | "EXPIRING_SOON" | "ACTIVE";

export type PaymentMethod = "CASH" | "UPI" | "GATEWAY";

export interface CounterBooking {
  id: string;
  type: SessionSegment;
  status: "CONFIRMED" | "HOLD" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  bookingDate: string; // YYYY-MM-DD
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  durationHours: number;
  guestCount: number;
  source: "ONLINE" | "WALKIN" | "STAFF_HOLD";
  customerName: string;
  customerPhone: string;
  customerPlace?: string | null;
  basePrice: number;
  extraGuestPrice: number;
  totalAmount: number;
  advancePaid: number;
  balanceAmount: number;
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  checkInStatus: "PENDING" | "CHECKED_IN" | "CHECKED_OUT";
  admittedAt?: string | null;
  notes?: string | null;
}

export interface ActiveSession {
  id: string; // Booking ID or WalkIn ID
  sessionId: string;
  sourceType: "BOOKING" | "WALKIN";
  segment: SessionSegment;
  guestCount: number;
  customerName: string;
  customerPhone: string;
  checkInTime: string;   // ISO string or HH:mm
  plannedEndTime: string;// HH:mm
  durationHours: number;
  balanceDue: number;
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  paymentMethod?: PaymentMethod | string;
  isOverdue: boolean;
  overdueMinutes: number;
  urgency: SessionUrgency;
  projectedOverstayCharge: number;
}

export interface CounterPayment {
  id: string;
  bookingId?: string | null;
  walkInId?: string | null;
  amount: number;
  method: PaymentMethod;
  status: "SUCCESS" | "PENDING" | "FAILED";
  timestamp: string;
  staffUserId?: string | null;
  transactionRef?: string | null;
  isOffline?: boolean;
}

export interface WaterLog {
  id: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:mm
  chlorinePpm: number;// Ideal: 1.5 - 3.0
  phLevel: number;    // Ideal: 7.2 - 7.6
  filterStatus: "OPTIMAL" | "RUNNING" | "BACKWASH_NEEDED" | "ISSUE";
  waterClarity?: "CLEAR" | "SLIGHTLY_HAZY" | "HAZY" | "TURBID";
  isOutOfRange: boolean;
  remarks?: string | null;
  staffUserId?: string | null;
  createdAt: string;
}

export interface DayRegister {
  date: string;            // YYYY-MM-DD
  expectedCash: number;
  actualCashCounted: number;
  cashVariance: number;
  expectedUpi: number;
  actualUpiCounted: number;
  upiVariance: number;
  onlineAdvances: number;
  totalExpectedRevenue: number;
  totalActualCollections: number;
  totalVariance: number;
  pendingBalancesList: Array<{
    bookingId: string;
    customerName: string;
    customerPhone: string;
    type: SessionSegment;
    unpaidBalance: number;
  }>;
  status: "DRAFT" | "SUBMITTED" | "APPROVED";
  notes?: string | null;
  approvedBy?: string | null;
  closedAt?: string | null;
}

export interface CounterSettings {
  bufferMinutes: number;         // Default: 15 min between private sessions
  graceMinutesPublic: number;    // Default: 5 min grace
  waterLogTimes: string[];       // Default: ["09:00", "15:00"]
  maxCapacityPublic: number;     // Default: 25
  publicSessionEnd: string;      // Default: "16:00"
  familySessionStart: string;    // Default: "16:00"
  turnoverWarningTime: string;   // Default: "15:45"
  defaultPublicRate: number;     // Default: 150
  defaultFamilyBaseRate: number; // Default: 1500
  familyBaseGuests: number;      // Default: 12
  familyExtraRate: number;       // Default: 100
  familyAdvanceAmount: number;   // Default: 750
}

export const DEFAULT_COUNTER_SETTINGS: CounterSettings = {
  bufferMinutes: 15,
  graceMinutesPublic: 5,
  waterLogTimes: ["09:00", "15:00"],
  maxCapacityPublic: 25,
  publicSessionEnd: "16:00",
  familySessionStart: "16:00",
  turnoverWarningTime: "15:45",
  defaultPublicRate: 150,
  defaultFamilyBaseRate: 1500,
  familyBaseGuests: 12,
  familyExtraRate: 100,
  familyAdvanceAmount: 750,
};

export interface OfflineSyncQueueItem {
  id: string;
  action: "WALKIN_CREATE" | "CHECK_IN" | "CHECK_OUT" | "PAYMENT_COLLECT" | "WATER_LOG";
  payload: any;
  localReceiptNumber?: string;
  createdAt: number;
  status: "PENDING" | "SYNCED" | "CONFLICT";
  error?: string;
}
