/**
 * Branded HTML email templates.
 * Pure functions returning HTML strings with table-based layout for email compatibility.
 */

interface BrandingParams {
  firmName: string;
  firmLogo?: string; // data URL or https URL
  firmColor: string; // hex color
}

function baseTemplate(branding: BrandingParams, content: string): string {
  const { firmName, firmLogo, firmColor } = branding;

  const logoHtml = firmLogo
    ? `<img src="${firmLogo}" alt="${firmName}" style="height:40px;max-width:160px;object-fit:contain;" />`
    : `<span style="font-size:20px;font-weight:bold;color:#ffffff;">${firmName}</span>`;

  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:32px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <!-- Header -->
  <tr>
    <td style="background-color:${firmColor};padding:20px 32px;text-align:center;">
      ${logoHtml}
    </td>
  </tr>
  <!-- Body -->
  <tr>
    <td style="padding:32px;">
      ${content}
    </td>
  </tr>
  <!-- Footer -->
  <tr>
    <td style="padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">
        Powered by <strong>FinFlow</strong>
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function renderInviteEmail(params: {
  branding: BrandingParams;
  userName?: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}): string {
  const greeting = params.userName ? `Ciao ${params.userName},` : "Ciao,";

  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#1f2937;">Benvenuto su ${params.branding.firmName}</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.6;">
      ${greeting}<br/>
      il tuo account è stato creato. Usa le credenziali qui sotto per accedere.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:6px;margin:16px 0;">
      <tr>
        <td style="padding:16px;">
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Email</p>
          <p style="margin:0 0 16px;font-size:15px;font-weight:bold;color:#111827;">${params.email}</p>
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Password temporanea</p>
          <p style="margin:0;font-size:18px;font-weight:bold;color:#111827;font-family:monospace;letter-spacing:1px;">${params.tempPassword}</p>
        </td>
      </tr>
    </table>
    <p style="margin:16px 0;text-align:center;">
      <a href="${params.loginUrl}" style="display:inline-block;padding:12px 32px;background-color:${params.branding.firmColor};color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">
        Accedi ora
      </a>
    </p>
    <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;line-height:1.5;">
      Ti consigliamo di cambiare la password dopo il primo accesso.
    </p>
  `;

  return baseTemplate(params.branding, content);
}

export function renderPasswordResetEmail(params: {
  branding: BrandingParams;
  userName?: string;
  resetUrl: string;
}): string {
  const greeting = params.userName ? `Ciao ${params.userName},` : "Ciao,";

  const content = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#1f2937;">Reset della password</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.6;">
      ${greeting}<br/>
      hai richiesto il reset della password. Clicca il pulsante qui sotto per impostarne una nuova.
    </p>
    <p style="margin:24px 0;text-align:center;">
      <a href="${params.resetUrl}" style="display:inline-block;padding:12px 32px;background-color:${params.branding.firmColor};color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">
        Reimposta password
      </a>
    </p>
    <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;line-height:1.5;">
      Il link scade tra 1 ora. Se non hai richiesto tu il reset, ignora questa email.
    </p>
  `;

  return baseTemplate(params.branding, content);
}
