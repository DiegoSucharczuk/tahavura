#!/usr/bin/env node

/**
 * Create Admin User in Firestore
 * Uses Firebase REST API to add admin user document
 * Run: node create-admin-user.js
 */

const https = require("https");

// Firebase Configuration from .env.local
const FIREBASE_CONFIG = {
  projectId: "tahavura",
  apiKey: "AIzaSyCdNrqX90Nskg7nVTaj4NaBbM9OgNT_1GU",
};

// Password hash (pre-generated from generate-hash.js for admin123)
const PASSWORD_HASH =
  "125444da140ae192586cf5af214cbc2f$e7e89c8dcb9d1d89a8d258db00049cb1edec89d880c8793f22195f9941354076";

// Admin user data
const adminUser = {
  fields: {
    email: { stringValue: "admin@example.com" },
    name: { stringValue: "Admin" },
    passwordHash: { stringValue: PASSWORD_HASH },
    role: { stringValue: "admin" },
    createdAt: { timestampValue: new Date().toISOString() },
    lastLogin: { nullValue: null },
  },
};

// Firestore REST API endpoint
const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/users?key=${FIREBASE_CONFIG.apiKey}`;

const options = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
};

console.log("\n" + "=".repeat(60));
console.log("🔷 Creating Admin User in Firestore");
console.log("=".repeat(60));
console.log("\n📧 Email: admin@example.com");
console.log("🔑 Password: admin123");
console.log("👤 Role: admin");
console.log("\nSending to Firebase Firestore...\n");

const req = https.request(url, options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    try {
      const response = JSON.parse(data);

      if (res.statusCode === 200) {
        console.log("✅ SUCCESS! Admin user created in Firestore");
        console.log("\n" + "=".repeat(60));
        console.log("Document Details:");
        console.log("=".repeat(60));
        if (response.name) {
          const docId = response.name.split("/").pop();
          console.log(`📄 Document ID: ${docId}`);
        }
        console.log(`👤 Email: admin@example.com`);
        console.log(`🎯 Role: admin`);
        console.log(`⏰ Created: ${new Date().toLocaleString()}`);
        console.log("\n" + "=".repeat(60));
        console.log("\n✨ Next Steps:");
        console.log("1. Go to http://localhost:3001/login");
        console.log("2. Login with admin@example.com / admin123");
        console.log("3. You should be redirected to /internal-dashboard");
        console.log("\n" + "=".repeat(60) + "\n");
      } else {
        console.error("❌ Error creating user:");
        console.error("Status:", res.statusCode);
        console.error("Response:", response);
        if (
          response.error &&
          response.error.message.includes("PERMISSION_DENIED")
        ) {
          console.error(
            "\n⚠️  Permission denied. Make sure Firestore Rules allow writes."
          );
          console.error(
            "    Temporarily modify rules or create the user via Firebase Console."
          );
        }
      }
    } catch (error) {
      console.error("❌ Error parsing response:", error.message);
      console.error("Raw response:", data);
    }
  });
});

req.on("error", (error) => {
  console.error("❌ Request failed:", error.message);
  console.error("\n⚠️  Make sure you have internet connection and API key is valid.");
});

req.write(JSON.stringify(adminUser));
req.end();
