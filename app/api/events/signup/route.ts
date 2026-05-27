import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase-admin";

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const { eventId, eventTitle, eventDate, name, email, phone } = await req.json();

    if (!eventId || !name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!EMAIL_RE.test(String(email).trim())) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    // Check for duplicate signup
    const { data: existing } = await supabaseAdmin
      .from("event_signups")
      .select("id")
      .eq("event_id", eventId)
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "You've already signed up for this event." }, { status: 409 });
    }

    // Save signup
    const { error: dbError } = await supabaseAdmin.from("event_signups").insert({
      event_id: eventId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.toString().trim() || null,
    });

    if (dbError) throw dbError;

    // Send confirmation email
    const formattedDate = new Date(eventDate).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    await resend.emails.send({
      from: "EM Patisserie <onboarding@resend.dev>",
      to: email.trim(),
      subject: `You're coming to ${eventTitle} ✨`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#FAF6F1;font-family:Georgia,serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6F1;padding:40px 20px;">
            <tr><td>
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #F0E8DF;">
                <!-- Header -->
                <tr>
                  <td style="background:#6B1830;padding:36px 40px;text-align:center;">
                    <p style="margin:0;color:#F2C4CE;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-family:Arial,sans-serif;">EM Patisserie</p>
                    <p style="margin:8px 0 0;color:#FAF6F1;font-size:26px;font-weight:normal;letter-spacing:1px;">You&rsquo;re on the list</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <p style="margin:0 0 8px;color:#1A0A0D;font-size:18px;">Hello ${name},</p>
                    <p style="margin:0 0 28px;color:#1A0A0D99;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;">
                      We&rsquo;re delighted to confirm your spot at:
                    </p>
                    <div style="background:#FAF6F1;border-left:3px solid #6B1830;padding:20px 24px;margin-bottom:28px;">
                      <p style="margin:0 0 6px;color:#6B1830;font-size:20px;">${eventTitle}</p>
                      <p style="margin:0;color:#1A0A0D99;font-family:Arial,sans-serif;font-size:13px;">${formattedDate}</p>
                    </div>
                    <p style="margin:0 0 28px;color:#1A0A0D99;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;">
                      We look forward to welcoming you. If you have any questions, just reply to this email.
                    </p>
                    <p style="margin:0;color:#1A0A0D;font-size:15px;">See you soon,<br>
                    <span style="color:#6B1830;">The EM Patisserie Team</span></p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding:20px 40px;border-top:1px solid #F0E8DF;text-align:center;">
                    <p style="margin:0;color:#1A0A0D40;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;">
                      EM Patisserie &amp; Artisanal Chocolates &nbsp;·&nbsp; Pune, India
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Event signup error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
