import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export interface SendInviteEmailOptions {
  to: string;
  inviterName: string;
  workspaceName: string;
  role: string;
  acceptUrl: string;
}

export async function sendInviteEmail({
  to,
  inviterName,
  workspaceName,
  role,
  acceptUrl,
}: SendInviteEmailOptions) {
  const roleLabels: Record<string, string> = {
    owner: "Owner",
    manager: "Manager",
    member: "Member",
    viewer: "Viewer",
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Undangan Workspace</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:3px solid #1a1a1a;border-radius:12px;overflow:hidden;box-shadow:6px 6px 0 #1a1a1a;">
          <!-- Header -->
          <tr>
            <td style="background:#f5c518;padding:24px 32px;border-bottom:3px solid #1a1a1a;">
              <h1 style="margin:0;font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:-0.5px;color:#1a1a1a;">
                📋 Project Management
              </h1>
              <p style="margin:4px 0 0;font-size:12px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:1px;">
                Undangan Workspace
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#333;">
                Hei! 👋
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">
                <strong>${inviterName}</strong> mengundang kamu untuk bergabung ke workspace 
                <strong>"${workspaceName}"</strong> sebagai <strong>${roleLabels[role] || role}</strong>.
              </p>

              <!-- Role badge -->
              <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td style="background:#f5f5f0;border:2px solid #1a1a1a;border-radius:8px;padding:12px 20px;">
                    <p style="margin:0;font-size:11px;font-weight:900;text-transform:uppercase;color:#666;letter-spacing:1px;">Role kamu</p>
                    <p style="margin:4px 0 0;font-size:18px;font-weight:900;color:#1a1a1a;">${roleLabels[role] || role}</p>
                  </td>
                  <td style="padding-left:16px;">
                    <p style="margin:0;font-size:11px;font-weight:900;text-transform:uppercase;color:#666;letter-spacing:1px;">Workspace</p>
                    <p style="margin:4px 0 0;font-size:18px;font-weight:900;color:#1a1a1a;">${workspaceName}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.6;">
                Klik tombol di bawah untuk menerima undangan. Link ini akan kadaluarsa dalam <strong>48 jam</strong>.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#1a1a1a;border-radius:8px;box-shadow:3px 3px 0 #f5c518;">
                    <a href="${acceptUrl}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:900;color:#ffffff;text-decoration:none;text-transform:uppercase;letter-spacing:1px;">
                      Terima Undangan →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:12px;color:#888;line-height:1.6;">
                Atau copy link ini ke browser:<br/>
                <a href="${acceptUrl}" style="color:#1a1a1a;font-weight:700;word-break:break-all;">${acceptUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:2px dashed #e0e0e0;background:#fafafa;">
              <p style="margin:0;font-size:11px;color:#aaa;text-align:center;">
                Jika kamu tidak merasa diundang, abaikan email ini.<br/>
                &copy; ${new Date().getFullYear()} Project Management &mdash; Sistem Manajemen Proyek
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Project Management" <${process.env.SMTP_USER}>`,
    to,
    subject: `[Undangan] Bergabung ke workspace "${workspaceName}"`,
    html,
  });
}
