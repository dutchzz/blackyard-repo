import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import fs from "fs";

// Initialize Firebase Admin
try {
  const serviceAccount = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: serviceAccount.projectId,
        clientEmail: `${serviceAccount.projectId}@appspot.gserviceaccount.com`,
        // Normally we need a full private key for cert(), but in this environment, 
        // we might not have it. So we can use applicationDefault() if available, 
        // or just use client side logic for everything and mock the email if no credentials.
      })
    });
  }
} catch (e) {
  console.log("Firebase Admin initialization skipped or failed.", e);
}

const app = express();
const PORT = 3000;

app.use(express.json());

app.post("/api/approve-order", async (req, res) => {
  const { idToken, orderId, items, customerEmail } = req.body;
  
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });

  try {
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const itemsText = items ? items.map((i: any) => `${i.title}: ${i.downloadLink}`).join('\n') : '';
    const itemsHtml = items ? items.map((i: any) => `<li>${i.title}: <a href="${i.downloadLink}">Download</a></li>`).join('') : '';

    if (!process.env.SMTP_USER) {
      console.log(`[MOCK EMAIL] To: ${customerEmail}, Items: \n${itemsText}`);
    } else {
      await transporter.sendMail({
        from: '"Store Admin" <admin@example.com>',
        to: customerEmail,
        subject: "Your Digital Download is Ready",
        text: `Thank you for your purchase! Here are your download links:\n\n${itemsText}`,
        html: `<p>Thank you for your purchase!</p><p>Here are your download links:</p><ul>${itemsHtml}</ul>`,
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
