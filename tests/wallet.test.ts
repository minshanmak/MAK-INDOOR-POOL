import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import { generateKeyPairSync } from "crypto";
import { SignJWT, importPKCS8 } from "jose";
import {
  buildApplePassJson,
  generateAppleWalletPass,
  getAppleWalletCredentials,
} from "@/lib/wallet/apple-pass";
import {
  buildGooglePassObject,
  generateGoogleWalletPass,
  getGoogleWalletCredentials,
} from "@/lib/wallet/google-pass";
import { validateWalletBookingRequest } from "@/lib/wallet/validation";
import { createZipArchive, calculateCrc32 } from "@/lib/wallet/zip-util";
import { WalletBookingData } from "@/lib/wallet/types";
import { prisma } from "@/lib/prisma";

const mockBooking: WalletBookingData = {
  id: "MAK-20261113-001",
  qrToken: "MAKPASS-MOCK-TOKEN-XYZ123",
  type: "FAMILY",
  status: "CONFIRMED",
  bookingDate: "2026-11-13",
  startTime: "16:00",
  endTime: "18:00",
  durationHours: 2,
  guestCount: 14,
  customerName: "Rashid Ali",
  customerPhone: "+919876543210",
  customerPlace: "Moonniyur",
  totalAmount: 3400,
  totalPaid: 750,
  balanceAmount: 2650,
  paymentStatus: "PARTIAL",
  checkInStatus: "PENDING",
};

describe("Apple Wallet Pass Architecture", () => {
  it("builds Apple Wallet pass.json reusing the exact existing QR scan token", () => {
    const origin = "https://makindoorpool.com";
    const passJson = buildApplePassJson(mockBooking, origin);

    expect(passJson.formatVersion).toBe(1);
    expect(passJson.organizationName).toBe("M.A.K Indoor Pool");
    expect(passJson.serialNumber).toBe("MAK-20261113-001");
    expect(passJson.backgroundColor).toBe("rgb(2, 132, 199)"); // #0284C7
    
    // Reuses existing QR code payload
    const expectedBarcodeMessage = "https://makindoorpool.com/admin/scan?code=MAKPASS-MOCK-TOKEN-XYZ123";
    expect(passJson.barcode.message).toBe(expectedBarcodeMessage);
    expect(passJson.barcode.format).toBe("PKBarcodeFormatQR");
    expect(passJson.barcodes[0].message).toBe(expectedBarcodeMessage);

    // Verify fields
    const fields = passJson.eventTicket;
    expect(fields.primaryFields[0].value).toBe("Exclusive Family");
    expect(fields.secondaryFields[1].value).toBe("14 Guests");
    expect(fields.headerFields[0].value).toBe("₹2650"); // Balance due
  });

  it("gracefully detects missing Apple signing credentials without crashing", async () => {
    // Clear credentials in test environment
    delete process.env.APPLE_PASS_TYPE_IDENTIFIER;
    delete process.env.APPLE_PASS_CERTIFICATE;

    const { isConfigured, missing } = getAppleWalletCredentials();
    expect(isConfigured).toBe(false);
    expect(missing).toContain("APPLE_PASS_TYPE_IDENTIFIER");
    expect(missing).toContain("APPLE_PASS_CERTIFICATE");

    const result = await generateAppleWalletPass(mockBooking, "http://localhost:3000");
    expect(result.success).toBe(false);
    expect(result.missingCredentials).toBeDefined();
    expect(result.missingCredentials?.length).toBeGreaterThan(0);
  });
});

describe("Google Wallet Pass Architecture", () => {
  it("builds Google Wallet GenericObject reusing existing QR barcode", () => {
    const origin = "https://makindoorpool.com";
    const issuerId = "3388000000022345678";
    const classId = `${issuerId}.mak_indoor_pool_pass`;

    const passObj = buildGooglePassObject(mockBooking, origin, issuerId, classId);

    expect(passObj.id).toBe(`${issuerId}.MAK_20261113_001`);
    expect(passObj.classId).toBe(classId);
    expect(passObj.cardTitle.defaultValue.value).toBe("M.A.K INDOOR POOL");
    expect(passObj.hexBackgroundColor).toBe("#0284c7");
    
    // Reuses existing QR code payload
    expect(passObj.barcode.value).toBe("https://makindoorpool.com/admin/scan?code=MAKPASS-MOCK-TOKEN-XYZ123");
    expect(passObj.barcode.type).toBe("QR_CODE");
    expect(passObj.barcode.alternateText).toBe("MAK-20261113-001");
  });

  it("signs Google Wallet JWT when valid RSA service account credentials are provided", async () => {
    // Generate ephemeral RSA keypair to simulate Google Cloud Service Account
    const { privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    process.env.GOOGLE_WALLET_ISSUER_ID = "3388000000022345678";
    process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL = "mak-service@project.iam.gserviceaccount.com";
    process.env.GOOGLE_WALLET_PRIVATE_KEY = privateKey;

    const result = await generateGoogleWalletPass(mockBooking, "https://makindoorpool.com");
    expect(result.success).toBe(true);
    expect(result.saveUrl).toBeDefined();
    expect(result.saveUrl).toMatch(/^https:\/\/pay\.google\.com\/gp\/v\/save\//);
  });

  it("detects missing Google service account credentials gracefully", async () => {
    delete process.env.GOOGLE_WALLET_ISSUER_ID;
    delete process.env.GOOGLE_WALLET_PRIVATE_KEY;

    const { isConfigured, missing } = getGoogleWalletCredentials();
    expect(isConfigured).toBe(false);
    expect(missing).toContain("GOOGLE_WALLET_ISSUER_ID");
    expect(missing).toContain("GOOGLE_WALLET_PRIVATE_KEY");

    const result = await generateGoogleWalletPass(mockBooking, "http://localhost:3000");
    expect(result.success).toBe(false);
    expect(result.missingCredentials).toBeDefined();
  });
});

describe("Zip & PKPass Packaging Utilities", () => {
  it("calculates IEEE 802.3 CRC32 accurately", () => {
    const data = Buffer.from("123456789", "utf-8");
    const crc = calculateCrc32(data);
    // Standard IEEE 802.3 CRC32 of "123456789" is 0xCBF43926 (3421780262)
    expect(crc).toBe(0xcbf43926);
  });

  it("compiles a valid standards-compliant ZIP archive buffer", () => {
    const files = [
      { filename: "pass.json", data: '{"formatVersion":1}' },
      { filename: "manifest.json", data: "{}" },
    ];
    const zipBuffer = createZipArchive(files);

    expect(Buffer.isBuffer(zipBuffer)).toBe(true);
    expect(zipBuffer.length).toBeGreaterThan(50);
    // Standard PKZIP header magic bytes: 0x50, 0x4B, 0x03, 0x04 (PK\x03\x04)
    expect(zipBuffer[0]).toBe(0x50);
    expect(zipBuffer[1]).toBe(0x4b);
    expect(zipBuffer[2]).toBe(0x03);
    expect(zipBuffer[3]).toBe(0x04);
  });
});

describe("Wallet Security & Lifecycle Authorization Validation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects unauthorized pass requests without matching token or phone", async () => {
    vi.spyOn(prisma.booking, "findUnique").mockResolvedValue({
      id: "MAK-TEST-WALLET-01",
      type: "PUBLIC",
      status: "CONFIRMED",
      bookingDate: "2026-11-13",
      startTime: "10:00",
      endTime: "11:00",
      durationHours: 1,
      guestCount: 2,
      basePrice: 300,
      extraGuestPrice: 0,
      totalAmount: 300,
      advanceRequired: 300,
      totalPaid: 300,
      balanceAmount: 0,
      paymentStatus: "PAID",
      customerId: null,
      customerName: "Test Swimmer",
      customerPhone: "+919876500000",
      customerEmail: null,
      customerPlace: null,
      notes: null,
      isStaffCreated: false,
      createdByUserId: null,
      checkInStatus: "PENDING",
      admittedAt: null,
      admittedByUserId: null,
      qrToken: "MAKPASS-SECRET-TOKEN",
      cancellationReason: null,
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await validateWalletBookingRequest("MAK-TEST-WALLET-01", "WRONG_TOKEN");
    expect(result.valid).toBe(false);
    expect(result.statusCode).toBe(403);
  });

  it("rejects cancelled bookings from generating wallet passes", async () => {
    vi.spyOn(prisma.booking, "findUnique").mockResolvedValue({
      id: "MAK-TEST-WALLET-01",
      type: "PUBLIC",
      status: "CANCELLED",
      bookingDate: "2026-11-13",
      startTime: "10:00",
      endTime: "11:00",
      durationHours: 1,
      guestCount: 2,
      basePrice: 300,
      extraGuestPrice: 0,
      totalAmount: 300,
      advanceRequired: 300,
      totalPaid: 300,
      balanceAmount: 0,
      paymentStatus: "REFUNDED",
      customerId: null,
      customerName: "Cancelled Swimmer",
      customerPhone: "+919876500000",
      customerEmail: null,
      customerPlace: null,
      notes: null,
      isStaffCreated: false,
      createdByUserId: null,
      checkInStatus: "PENDING",
      admittedAt: null,
      admittedByUserId: null,
      qrToken: "MAKPASS-CANCELLED-TOKEN",
      cancellationReason: "Customer requested cancellation",
      cancelledAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await validateWalletBookingRequest("MAK-TEST-WALLET-01", "MAKPASS-CANCELLED-TOKEN");
    expect(result.valid).toBe(false);
    expect(result.statusCode).toBe(409);
    expect(result.error).toContain("cancelled");
  });

  it("allows valid confirmed bookings with matching token", async () => {
    vi.spyOn(prisma.booking, "findUnique").mockResolvedValue({
      id: "MAK-TEST-WALLET-01",
      type: "PUBLIC",
      status: "CONFIRMED",
      bookingDate: "2026-11-13",
      startTime: "10:00",
      endTime: "11:00",
      durationHours: 1,
      guestCount: 2,
      basePrice: 300,
      extraGuestPrice: 0,
      totalAmount: 300,
      advanceRequired: 300,
      totalPaid: 300,
      balanceAmount: 0,
      paymentStatus: "PAID",
      customerId: null,
      customerName: "Confirmed Swimmer",
      customerPhone: "+919876500000",
      customerEmail: null,
      customerPlace: null,
      notes: null,
      isStaffCreated: false,
      createdByUserId: null,
      checkInStatus: "PENDING",
      admittedAt: null,
      admittedByUserId: null,
      qrToken: "MAKPASS-VALID-TOKEN",
      cancellationReason: null,
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await validateWalletBookingRequest("MAK-TEST-WALLET-01", "MAKPASS-VALID-TOKEN");
    expect(result.valid).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.booking?.customerName).toBe("Confirmed Swimmer");
    expect(result.booking?.qrToken).toBe("MAKPASS-VALID-TOKEN");
  });
});
