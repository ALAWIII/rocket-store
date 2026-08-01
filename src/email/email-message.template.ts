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
  const brandTextStyle =
    'margin:0; color:#fafafa; font-size:24px; font-weight:700; line-height:1.2; font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;';

  const brandBlock = `
    <div style="text-align:center; margin:0 0 24px;">
      ${
        logoUrl
          ? `<img src="${logoUrl}" alt="${storeName}" style="display:inline-block; max-height:40px; ${brandTextStyle}" />`
          : `<h2 style="${brandTextStyle}">${storeName}</h2>`
      }
    </div>
  `;
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

  .link-wrap {
    margin: 0 0 24px;
    text-align: left;
  }

  .link-label {
    color: #a1a1aa;
    font-size: 13px;
    line-height: 1.6;
    text-align: center;
    margin: 0 0 8px;
  }

  .raw-link {
    display: block;
    color: ${accentColor} !important;
    text-decoration: none;
    font-size: 12px;
    line-height: 1.6;
    background: #111114;
    border: 1px solid #27272a;
    border-radius: 8px;
    padding: 12px;
    overflow-wrap: anywhere;
    word-break: break-word;
    word-wrap: break-word;
  }
</style>
</head>
<body>
  <div class="container">
  ${brandBlock}
    <h1>${heading}</h1>
    <p>${recipientName ? `Hi ${recipientName},<br/>` : ''}${message}</p>
    <div class="btn-wrap"><a href="${url}" class="btn">${buttonText}</a></div>

    <div class="link-wrap">
      <p class="link-label">If the button doesn't work, copy and paste this link into your browser:</p>
      <a href="${url}" class="raw-link">${url}</a>
    </div>

    ${expiresInText ? `<p style="font-size:12px;">${expiresInText}</p>` : ''}
    <div class="footer">© ${new Date().getFullYear()} ${storeName}. If you didn't request this, ignore this email.</div>
  </div>
</body>
</html>`;
}
