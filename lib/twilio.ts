import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// Placeholder — replace with the real café number
const CAFE_PHONE = "+91 88578 74437";

/**
 * Send an SMS via Twilio. Silently fails if Twilio isn't configured
 * so the order flow is never blocked by SMS issues.
 */
async function sendSMS(to: string, body: string) {
  if (!accountSid || !authToken || !fromNumber) {
    console.warn("[SMS] Twilio not configured — skipping SMS.");
    return;
  }

  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({ body, from: fromNumber, to });
    console.log(`[SMS] Sent to ${to}`);
  } catch (err) {
    // Never let SMS failure break the order flow
    console.error("[SMS] Failed to send:", err);
  }
}

/**
 * Normalize an Indian phone number to E.164 format.
 * "9876543210" → "+919876543210"
 * "+919876543210" → "+919876543210"
 * "09876543210" → "+919876543210"
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[\s\-()]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0")) return `+91${digits.slice(1)}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

/**
 * Order confirmation SMS — sent when a new order is placed.
 */
export async function sendOrderConfirmation({
  phone,
  customerName,
  orderId,
  itemCount,
  total,
  pickupTime,
}: {
  phone: string;
  customerName: string;
  orderId: string;
  itemCount: number;
  total: number;
  pickupTime: string;
}) {
  const shortId = orderId.slice(0, 8).toUpperCase();
  const time = new Date(pickupTime).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const date = new Date(pickupTime).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  const body =
    `Hi ${customerName}! Your order #${shortId} has been placed at EM Patisserie.\n\n` +
    `${itemCount} item${itemCount !== 1 ? "s" : ""} · ₹${total}\n` +
    `Pickup: ${date}, ${time}\n\n` +
    `For any queries, call us at ${CAFE_PHONE}.\n` +
    `Thank you!`;

  await sendSMS(normalizePhone(phone), body);
}

/**
 * Ready-for-pickup SMS — sent when admin marks order as "ready".
 */
export async function sendReadyForPickup({
  phone,
  customerName,
  orderId,
}: {
  phone: string;
  customerName: string;
  orderId: string;
}) {
  const shortId = orderId.slice(0, 8).toUpperCase();

  const body =
    `Hi ${customerName}! Your order #${shortId} is ready for pickup at EM Patisserie.\n\n` +
    `We look forward to seeing you!\n` +
    `For any queries, call us at ${CAFE_PHONE}.`;

  await sendSMS(normalizePhone(phone), body);
}
