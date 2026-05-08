// services/emailService.js
// Servei d'enviament d'emails. En desenvolupament fa "log" per consola
// si no s'ha configurat un transport SMTP real.

const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();
  const from = process.env.EMAIL_FROM || "no-reply@gestor-tasques.local";

  if (!t) {
    // Mode mock per desenvolupament: només imprimim per consola
    console.log("📧 [MOCK EMAIL]");
    console.log(`   From:    ${from}`);
    console.log(`   To:      ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Text:    ${text || "(html only)"}`);
    return { mocked: true };
  }

  return t.sendMail({ from, to, subject, html, text });
}

async function sendPasswordResetEmail(to, resetUrl, token) {
  const subject = "Recuperació de contrasenya - Gestor de Tasques";
  const text = `Has sol·licitat restablir la contrasenya. Visita: ${resetUrl}?token=${token} (vàlid 1h)`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Recuperació de contrasenya</h2>
      <p>Has sol·licitat restablir la contrasenya del teu compte.</p>
      <p>Fes clic al següent enllaç per restablir-la (vàlid 1 hora):</p>
      <p>
        <a href="${resetUrl}?token=${token}"
           style="background:#4CAF50;color:#fff;padding:10px 20px;
                  text-decoration:none;border-radius:4px;">
          Restablir contrasenya
        </a>
      </p>
      <p>Si no has estat tu, ignora aquest missatge.</p>
      <hr>
      <p style="color:#888;font-size:12px;">Token: ${token}</p>
    </div>
  `;
  return sendEmail({ to, subject, html, text });
}

module.exports = { sendEmail, sendPasswordResetEmail };
