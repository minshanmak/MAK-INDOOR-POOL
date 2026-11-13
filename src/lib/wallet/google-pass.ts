/**
 * M.A.K Indoor Pool — Google Wallet (Google Pay Passes) Generator
 * Generates signed JWTs and official save links with existing barcode reuse.
 */

import { SignJWT, importPKCS8 } from "jose";
import { formatSlotTime } from "@/lib/timezone";
import { WalletBookingData, GoogleWalletCredentials } from "./types";

export interface GooglePassBuildResult {
  success: boolean;
  saveUrl?: string;
  missingCredentials?: string[];
  error?: string;
}

export function getGoogleWalletCredentials(): {
  credentials: GoogleWalletCredentials;
  isConfigured: boolean;
  missing: string[];
} {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY;
  const classId =
    process.env.GOOGLE_WALLET_CLASS_ID ||
    (issuerId ? `${issuerId}.mak_indoor_pool_pass` : undefined);

  const missing: string[] = [];
  if (!issuerId) missing.push("GOOGLE_WALLET_ISSUER_ID");
  if (!serviceAccountEmail) missing.push("GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL");
  if (!privateKey) missing.push("GOOGLE_WALLET_PRIVATE_KEY");

  return {
    credentials: {
      issuerId,
      serviceAccountEmail,
      privateKey,
      classId,
    },
    isConfigured: missing.length === 0,
    missing,
  };
}

/**
 * Builds the Google Wallet GenericObject / Pass definition.
 */
export function buildGooglePassObject(
  booking: WalletBookingData,
  origin: string,
  issuerId: string,
  classId: string
) {
  const isFamily = booking.type === "FAMILY";
  const scanPayload = `${origin}/admin/scan?code=${booking.qrToken || booking.id}`;
  const cleanId = booking.id.replace(/[^a-zA-Z0-9_]/g, "_");
  const objectId = `${issuerId}.${cleanId}`;

  return {
    id: objectId,
    classId: classId,
    state: "ACTIVE",
    logo: {
      sourceUri: {
        uri: `${origin}/images/mak-logo-white.png`,
      },
      contentDescription: {
        defaultValue: {
          language: "en-US",
          value: "M.A.K Indoor Pool Logo",
        },
      },
    },
    cardTitle: {
      defaultValue: {
        language: "en-US",
        value: "M.A.K INDOOR POOL",
      },
    },
    header: {
      defaultValue: {
        language: "en-US",
        value: isFamily ? "Exclusive Family Session" : "Public Swimming Pass",
      },
    },
    subheader: {
      defaultValue: {
        language: "en-US",
        value: booking.customerName,
      },
    },
    hexBackgroundColor: "#0284c7",
    barcode: {
      type: "QR_CODE",
      value: scanPayload,
      alternateText: booking.id,
    },
    textModulesData: [
      {
        id: "date_time",
        header: "DATE & TIME",
        body: `${booking.bookingDate} (${formatSlotTime(booking.startTime)} – ${formatSlotTime(booking.endTime)})`,
      },
      {
        id: "swimmers",
        header: "SWIMMERS",
        body: `${booking.guestCount} Guests`,
      },
      {
        id: "financials",
        header: booking.balanceAmount > 0 ? "BALANCE DUE" : "ADMISSION STATUS",
        body:
          booking.balanceAmount > 0
            ? `₹${booking.balanceAmount} due at counter`
            : "Paid in full (Verified)",
      },
      {
        id: "included_facility",
        header: "FACILITY ACCESS",
        body: "Main Pool + Complimentary Kids Pool access included",
      },
      {
        id: "location",
        header: "VENUE",
        body: "Moonniyur, Malappuram, Kerala",
      },
    ],
  };
}

/**
 * Generates an official Google Wallet save link using signed JWT (RS256).
 */
export async function generateGoogleWalletPass(
  booking: WalletBookingData,
  origin: string
): Promise<GooglePassBuildResult> {
  const { credentials, isConfigured, missing } = getGoogleWalletCredentials();

  if (!isConfigured) {
    return {
      success: false,
      missingCredentials: missing,
      error: `Google Wallet credentials incomplete: Missing ${missing.join(", ")}. Please configure Google Wallet Service Account environment variables.`,
    };
  }

  try {
    const issuerId = credentials.issuerId!;
    const classId = credentials.classId || `${issuerId}.mak_indoor_pool_pass`;
    const passObject = buildGooglePassObject(booking, origin, issuerId, classId);

    // Format PEM key correctly (handling potential escaped newlines in env vars)
    let pemKey = credentials.privateKey!.trim();
    if (pemKey.includes("\\n")) {
      pemKey = pemKey.replace(/\\n/g, "\n");
    }

    const importedKey = await importPKCS8(pemKey, "RS256");

    // Construct Save-to-Wallet JWT payload
    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = {
      iss: credentials.serviceAccountEmail,
      aud: "google",
      typ: "savetojwt",
      iat: now,
      payload: {
        genericObjects: [passObject],
      },
    };

    const jwt = await new SignJWT(jwtPayload)
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .sign(importedKey);

    const saveUrl = `https://pay.google.com/gp/v/save/${jwt}`;

    return {
      success: true,
      saveUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to generate Google Wallet JWT save link.",
    };
  }
}
