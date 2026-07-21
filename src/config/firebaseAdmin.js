import { createRequire } from "module";
const require = createRequire(import.meta.url);
const admin = require("firebase-admin");

console.log("DEBUG typeof admin:", typeof admin);
console.log("DEBUG admin keys:", admin ? Object.keys(admin) : "admin is falsy");

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
} catch (error) {
  if (!/already exists/i.test(error.message)) {
    console.error("Firebase Admin init error:", error);
    throw error;
  }
}

export default admin;
