import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "EM Patisserie <onboarding@resend.dev>";

// Placeholder — replace with the real café number
const CAFE_PHONE = "+91 88578 74437";

// Admin email — set ADMIN_EMAIL in env to receive custom order notifications
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? null;

/**
 * Send order confirmation email.
 */
export async function sendOrderConfirmationEmail({
  email,
  customerName,
  orderId,
  items,
  total,
  pickupTime,
}: {
  email: string;
  customerName: string;
  orderId: string;
  items: { item_name: string; quantity: number; price: number }[];
  total: number;
  pickupTime: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] Resend not configured — skipping email.");
    return;
  }

  const shortId = orderId.slice(0, 8).toUpperCase();
  const formattedDate = new Date(pickupTime).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const formattedTime = new Date(pickupTime).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const itemRows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 0;color:#1A0A0D;font-family:Arial,sans-serif;font-size:14px;border-bottom:1px solid #F0E8DF;">${i.item_name} &times; ${i.quantity}</td>
          <td style="padding:8px 0;color:#6B1830;font-family:Arial,sans-serif;font-size:14px;text-align:right;border-bottom:1px solid #F0E8DF;">&rupee;${(i.price * i.quantity) / 100}</td>
        </tr>`
    )
    .join("");

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Order confirmed — #${shortId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#FAF6F1;font-family:Georgia,serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6F1;padding:40px 20px;">
            <tr><td>
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #F0E8DF;">
                <tr>
                  <td style="background:#6B1830;padding:36px 40px;text-align:center;">
                    <p style="margin:0;color:#F2C4CE;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-family:Arial,sans-serif;">EM Patisserie</p>
                    <p style="margin:8px 0 0;color:#FAF6F1;font-size:26px;font-weight:normal;letter-spacing:1px;">Order Confirmed</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <p style="margin:0 0 8px;color:#1A0A0D;font-size:18px;">Hello ${customerName},</p>
                    <p style="margin:0 0 24px;color:#1A0A0D99;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;">
                      Thank you for your order! Here are the details:
                    </p>

                    <div style="background:#FAF6F1;border-left:3px solid #6B1830;padding:16px 20px;margin-bottom:24px;">
                      <p style="margin:0 0 4px;color:#1A0A0D;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Order #${shortId}</p>
                      <p style="margin:0;color:#6B1830;font-size:14px;font-family:Arial,sans-serif;">Pickup: ${formattedDate}, ${formattedTime}</p>
                    </div>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                      ${itemRows}
                      <tr>
                        <td style="padding:12px 0 0;color:#1A0A0D;font-size:18px;font-weight:bold;">Total</td>
                        <td style="padding:12px 0 0;color:#6B1830;font-size:18px;font-weight:bold;text-align:right;">&rupee;${total}</td>
                      </tr>
                    </table>

                    <p style="margin:0 0 24px;color:#1A0A0D99;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;">
                      We&rsquo;ll send you a message when your order is ready for pickup.
                    </p>

                    <p style="margin:0 0 8px;color:#1A0A0D99;font-family:Arial,sans-serif;font-size:13px;">
                      Questions? Call us at <strong>${CAFE_PHONE}</strong>
                    </p>

                    <p style="margin:24px 0 0;color:#1A0A0D;font-size:15px;">With love,<br>
                    <span style="color:#6B1830;">The EM Patisserie Team</span></p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 40px;border-top:1px solid #F0E8DF;text-align:center;">
                    <p style="margin:0;color:#1A0A0D40;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;">
                      EM Patisserie &amp; Artisanal Chocolates &nbsp;&middot;&nbsp; Pune, India
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
    console.log(`[Email] Confirmation sent to ${email}`);
  } catch (err) {
    console.error("[Email] Failed to send confirmation:", err);
  }
}

/**
 * Send ready-for-pickup email.
 */
export async function sendReadyForPickupEmail({
  email,
  customerName,
  orderId,
}: {
  email: string;
  customerName: string;
  orderId: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] Resend not configured — skipping email.");
    return;
  }

  const shortId = orderId.slice(0, 8).toUpperCase();

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Your order #${shortId} is ready!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#FAF6F1;font-family:Georgia,serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6F1;padding:40px 20px;">
            <tr><td>
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #F0E8DF;">
                <tr>
                  <td style="background:#2D6A4F;padding:36px 40px;text-align:center;">
                    <p style="margin:0;color:#B7E4C7;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-family:Arial,sans-serif;">EM Patisserie</p>
                    <p style="margin:8px 0 0;color:#FAF6F1;font-size:26px;font-weight:normal;letter-spacing:1px;">Your Order is Ready!</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <p style="margin:0 0 8px;color:#1A0A0D;font-size:18px;">Hello ${customerName},</p>
                    <p style="margin:0 0 24px;color:#1A0A0D99;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;">
                      Great news &mdash; your order <strong>#${shortId}</strong> is ready for pickup!
                    </p>

                    <div style="background:#F0FFF4;border-left:3px solid #2D6A4F;padding:20px 24px;margin-bottom:28px;text-align:center;">
                      <p style="margin:0;color:#2D6A4F;font-size:20px;">Come grab it whenever you&rsquo;re ready</p>
                    </div>

                    <p style="margin:0 0 8px;color:#1A0A0D99;font-family:Arial,sans-serif;font-size:13px;">
                      Questions? Call us at <strong>${CAFE_PHONE}</strong>
                    </p>

                    <p style="margin:24px 0 0;color:#1A0A0D;font-size:15px;">See you soon,<br>
                    <span style="color:#6B1830;">The EM Patisserie Team</span></p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 40px;border-top:1px solid #F0E8DF;text-align:center;">
                    <p style="margin:0;color:#1A0A0D40;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;">
                      EM Patisserie &amp; Artisanal Chocolates &nbsp;&middot;&nbsp; Pune, India
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
    console.log(`[Email] Ready notification sent to ${email}`);
  } catch (err) {
    console.error("[Email] Failed to send ready notification:", err);
  }
}

/**
 * Send custom cake order confirmation to the customer.
 */
export async function sendCustomOrderConfirmation({
  email,
  customerName,
  occasion,
  pickupDate,
}: {
  email: string;
  customerName: string;
  occasion: string;
  pickupDate: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] Resend not configured — skipping custom order confirmation.");
    return;
  }

  const formattedDate = new Date(pickupDate).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Custom cake enquiry received — EM Patisserie`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#FAF6F1;font-family:Georgia,serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6F1;padding:40px 20px;">
            <tr><td>
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #F0E8DF;">
                <tr>
                  <td style="background:#6B1830;padding:36px 40px;text-align:center;">
                    <p style="margin:0;color:#F2C4CE;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-family:Arial,sans-serif;">EM Patisserie</p>
                    <p style="margin:8px 0 0;color:#FAF6F1;font-size:26px;font-weight:normal;letter-spacing:1px;">Enquiry Received</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <p style="margin:0 0 8px;color:#1A0A0D;font-size:18px;">Hello ${customerName},</p>
                    <p style="margin:0 0 24px;color:#1A0A0D99;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;">
                      Thank you for reaching out! We&rsquo;ve received your custom cake enquiry and our team will review it shortly.
                    </p>

                    <div style="background:#FAF6F1;border-left:3px solid #6B1830;padding:16px 20px;margin-bottom:24px;">
                      <p style="margin:0 0 6px;color:#1A0A0D;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Your Enquiry</p>
                      <p style="margin:0 0 4px;color:#6B1830;font-size:14px;font-family:Arial,sans-serif;"><strong>Occasion:</strong> ${occasion}</p>
                      <p style="margin:0;color:#6B1830;font-size:14px;font-family:Arial,sans-serif;"><strong>Preferred pickup:</strong> ${formattedDate}</p>
                    </div>

                    <p style="margin:0 0 16px;color:#1A0A0D99;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;">
                      We&rsquo;ll get back to you within <strong>24&ndash;48 hours</strong> to confirm details, discuss the design, and share pricing.
                    </p>

                    <p style="margin:0 0 24px;color:#1A0A0D99;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;">
                      In the meantime, feel free to reach us directly at <strong>${CAFE_PHONE}</strong> if you have any questions.
                    </p>

                    <p style="margin:24px 0 0;color:#1A0A0D;font-size:15px;">With love,<br>
                    <span style="color:#6B1830;">The EM Patisserie Team</span></p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 40px;border-top:1px solid #F0E8DF;text-align:center;">
                    <p style="margin:0;color:#1A0A0D40;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;">
                      EM Patisserie &amp; Artisanal Chocolates &nbsp;&middot;&nbsp; Pune, India
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
    console.log(`[Email] Custom order confirmation sent to ${email}`);
  } catch (err) {
    console.error("[Email] Failed to send custom order confirmation:", err);
  }
}

/**
 * Notify admin of a new custom cake enquiry.
 */
export async function sendCustomOrderAdminNotification({
  requestId, name, email, phone,
  occasion, occasionOther, pickupDate, pickupTimeSlot,
  serves, flavors, dietary,
  messageOnCake, designDescription, referenceImageUrl,
  budgetRange, additionalNotes,
}: {
  requestId: string;
  name: string;
  email: string;
  phone: string;
  occasion: string;
  occasionOther?: string;
  pickupDate: string;
  pickupTimeSlot?: string;
  serves?: string;
  flavors?: string;
  dietary?: string;
  messageOnCake?: string;
  designDescription?: string;
  referenceImageUrl?: string;
  budgetRange?: string;
  additionalNotes?: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  if (!ADMIN_EMAIL) {
    console.warn("[Email] ADMIN_EMAIL not set — skipping admin notification for custom order.");
    return;
  }

  const formattedDate = new Date(pickupDate).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const row = (label: string, value?: string | null) =>
    value ? `<tr><td style="padding:5px 0;color:#1A0A0D99;font-family:Arial,sans-serif;font-size:13px;vertical-align:top;width:140px;">${label}</td><td style="padding:5px 0;color:#1A0A0D;font-family:Arial,sans-serif;font-size:13px;">${value}</td></tr>` : "";

  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `New custom cake enquiry — ${name} (${occasion})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background:#FAF6F1;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6F1;padding:40px 20px;">
            <tr><td>
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #F0E8DF;">
                <tr>
                  <td style="background:#1A0A0D;padding:28px 36px;">
                    <p style="margin:0;color:#F2C4CE;font-size:11px;letter-spacing:3px;text-transform:uppercase;">EM Patisserie — Admin</p>
                    <p style="margin:6px 0 0;color:#FAF6F1;font-size:22px;font-weight:normal;">New Custom Cake Enquiry</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 36px;">
                    <p style="margin:0 0 20px;font-size:13px;color:#1A0A0D99;">Request ID: <strong style="color:#6B1830;font-family:monospace;">${requestId.slice(0, 8).toUpperCase()}</strong></p>

                    <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6B1830;">Contact</p>
                    <table style="margin-bottom:24px;width:100%;">
                      ${row("Name", name)}
                      ${row("Email", `<a href="mailto:${email}" style="color:#6B1830;">${email}</a>`)}
                      ${row("Phone", `<a href="tel:${phone}" style="color:#6B1830;">${phone}</a>`)}
                    </table>

                    <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6B1830;">The Occasion</p>
                    <table style="margin-bottom:24px;width:100%;">
                      ${row("Occasion", occasion + (occasionOther ? ` — ${occasionOther}` : ""))}
                      ${row("Pickup Date", formattedDate)}
                      ${row("Pickup Slot", pickupTimeSlot)}
                    </table>

                    <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6B1830;">The Cake</p>
                    <table style="margin-bottom:24px;width:100%;">
                      ${row("Serves", serves)}
                      ${row("Flavours", flavors)}
                      ${row("Dietary Needs", dietary)}
                      ${row("Cake Message", messageOnCake)}
                      ${row("Budget Range", budgetRange)}
                    </table>

                    ${designDescription ? `
                    <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6B1830;">Design Description</p>
                    <p style="margin:0 0 24px;font-size:14px;color:#1A0A0D;line-height:1.6;background:#FAF6F1;padding:14px 16px;border-left:3px solid #6B1830;">${designDescription}</p>
                    ` : ""}

                    ${referenceImageUrl ? `
                    <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6B1830;">Reference Image</p>
                    <p style="margin:0 0 24px;"><a href="${referenceImageUrl}" style="color:#6B1830;font-size:13px;" target="_blank">${referenceImageUrl}</a></p>
                    ` : ""}

                    ${additionalNotes ? `
                    <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6B1830;">Additional Notes</p>
                    <p style="margin:0 0 24px;font-size:14px;color:#1A0A0D;line-height:1.6;background:#FAF6F1;padding:14px 16px;border-left:3px solid #6B1830;">${additionalNotes}</p>
                    ` : ""}
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 36px;border-top:1px solid #F0E8DF;text-align:center;">
                    <p style="margin:0;color:#1A0A0D40;font-size:11px;letter-spacing:2px;text-transform:uppercase;">
                      Log in to the admin dashboard to update the request status
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
    console.log(`[Email] Admin notification sent for custom order ${requestId}`);
  } catch (err) {
    console.error("[Email] Failed to send admin custom order notification:", err);
  }
}
