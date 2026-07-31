interface AuthEmailOptions {
  storeName: string;
  logoUrl?: string;
  recipientName?: string;
  heading: string;
  message: string;
  buttonText: string;
  url: string;
  expiresInText?: string; // e.g. "This link expires in 1 hour"
  accentColor?: string; // brand color for button
}

export function buildAuthEmailHtml(opts: AuthEmailOptions): string {
  const {
    storeName,
    logoUrl,
    recipientName,
    heading,
    message,
    buttonText,
    url,
    expiresInText,
    accentColor = '#7c3aed',
  } = opts;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="color-scheme" content="light dark" />
<meta name="supported-color-schemes" content="light dark" />
<style>
  body { margin:0; padding:0; background-color:#0f0f10; font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; }
  .container { max-width:480px; margin:40px auto; background-color:#18181b; border-radius:12px; padding:32px; }
  .logo { display:block; margin:0 auto 24px; max-height:40px; }
  h1 { color:#fafafa; font-size:22px; font-weight:600; text-align:center; margin:0 0 16px; }
  p { color:#a1a1aa; font-size:15px; line-height:1.6; text-align:center; margin:0 0 24px; }
  .btn { display:inline-block; background-color:${accentColor}; color:#ffffff !important; text-decoration:none; font-weight:600; font-size:15px; padding:12px 28px; border-radius:8px; }
  .btn-wrap { text-align:center; margin-bottom:24px; }
  .footer { color:#52525b; font-size:12px; text-align:center; margin-top:24px; }
  a { color:${accentColor}; }
</style>
</head>
<body>
  <div class="container">
    ${logoUrl ? `<img src="${logoUrl}" alt="${storeName}" class="logo" />` : `<h2 style="color:#fafafa;text-align:center;">${storeName}</h2>`}
    <h1>${heading}</h1>
    <p>${recipientName ? `Hi ${recipientName},<br/>` : ''}${message}</p>
    <div class="btn-wrap"><a href="${url}" class="btn">${buttonText}</a></div>
    <p style="font-size:13px;">If the button doesn't work, copy this link:<br/><a href="${url}">${url}</a></p>
    ${expiresInText ? `<p style="font-size:12px;">${expiresInText}</p>` : ''}
    <div class="footer">© ${new Date().getFullYear()} ${storeName}. If you didn't request this, ignore this email.</div>
  </div>
</body>
</html>`;
}
