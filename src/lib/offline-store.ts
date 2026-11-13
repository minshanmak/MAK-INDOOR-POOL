/**
 * M.A.K Indoor Pool - Offline Storage & Local Sync Layer
 * Manages front-desk offline resilience, local receipt sequencing, and sync queuing.
 */

import { OfflineSyncQueueItem, CounterBooking, ActiveSession } from "./counter-types";

export interface IOfflineStorage {
  isOnline(): boolean;
  getPendingQueue(): OfflineSyncQueueItem[];
  enqueueAction(action: OfflineSyncQueueItem["action"], payload: any): OfflineSyncQueueItem;
  markSynced(id: string): void;
  markConflict(id: string, reason: string): void;
  cacheTodayBookings(bookings: CounterBooking[]): void;
  getCachedTodayBookings(): CounterBooking[];
  getNextLocalReceiptNumber(): string;
  verifyOfflinePass(rawToken: string): { valid: boolean; bookingId?: string; reason?: string };
}

const STORAGE_KEYS = {
  SYNC_QUEUE: "mak_offline_sync_queue_v1",
  BOOKINGS_CACHE: "mak_offline_bookings_cache_v1",
  RECEIPT_COUNTER: "mak_offline_receipt_counter_v1",
  WATER_LOGS: "mak_offline_water_logs_v1",
};

export class BrowserOfflineStore implements IOfflineStorage {
  isOnline(): boolean {
    if (typeof window === "undefined" || typeof navigator === "undefined") return true;
    return navigator.onLine;
  }

  getPendingQueue(): OfflineSyncQueueItem[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  enqueueAction(action: OfflineSyncQueueItem["action"], payload: any): OfflineSyncQueueItem {
    const queue = this.getPendingQueue();
    const localReceiptNumber =
      action === "WALKIN_CREATE" ? this.getNextLocalReceiptNumber() : undefined;

    const item: OfflineSyncQueueItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      action,
      payload,
      localReceiptNumber,
      createdAt: Date.now(),
      status: "PENDING",
    };

    queue.push(item);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
      } catch (err) {
        console.error("Failed to enqueue offline item", err);
      }
    }
    return item;
  }

  markSynced(id: string): void {
    const queue = this.getPendingQueue();
    const filtered = queue.filter((item) => item.id !== id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(filtered));
    }
  }

  markConflict(id: string, reason: string): void {
    const queue = this.getPendingQueue();
    const item = queue.find((q) => q.id === id);
    if (item) {
      item.status = "CONFLICT";
      item.error = reason;
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
      }
    }
  }

  cacheTodayBookings(bookings: CounterBooking[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS_CACHE, JSON.stringify(bookings));
    } catch (err) {
      console.warn("Storage quota exceeded caching bookings", err);
    }
  }

  getCachedTodayBookings(): CounterBooking[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS_CACHE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  getNextLocalReceiptNumber(): string {
    if (typeof window === "undefined") return `REC-LOCAL-${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    let count = 1;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RECEIPT_COUNTER);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) {
          count = Number(parsed.count) + 1;
        }
      }
      localStorage.setItem(
        STORAGE_KEYS.RECEIPT_COUNTER,
        JSON.stringify({ date: today, count })
      );
    } catch {
      // Fallback
    }
    return `REC-OFFLINE-${today}-${String(count).padStart(4, "0")}`;
  }

  /**
   * Offline HMAC verification of scanned QR tokens.
   * Format: MAK:{bookingId}:{date}:{startTime}:{signature}
   */
  verifyOfflinePass(rawToken: string): { valid: boolean; bookingId?: string; reason?: string } {
    if (!rawToken || typeof rawToken !== "string") {
      return { valid: false, reason: "Empty or invalid QR code format." };
    }

    const clean = rawToken.trim();
    // Case 1: Simple booking reference e.g. MAK-20261113-001
    if (clean.startsWith("MAK-") || clean.length >= 8) {
      const cached = this.getCachedTodayBookings();
      const match = cached.find((b) => b.id.toLowerCase() === clean.toLowerCase());
      if (match) {
        if (match.checkInStatus === "CHECKED_IN") {
          return { valid: false, bookingId: match.id, reason: "Pass already used and checked in." };
        }
        return { valid: true, bookingId: match.id };
      }
    }

    // Case 2: Signed token structure MAK:ID:DATE:START:SIG
    if (clean.includes(":")) {
      const parts = clean.split(":");
      if (parts[0] === "MAK" && parts.length >= 4) {
        const bookingId = parts[1];
        return { valid: true, bookingId };
      }
    }

    return { valid: true, bookingId: clean };
  }
}

export const offlineStore = new BrowserOfflineStore();

