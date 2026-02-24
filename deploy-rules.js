#!/usr/bin/env node

/**
 * Deploy Firestore Rules
 * Run: node deploy-rules.js
 * 
 * This script displays Firestore rules and provides deployment options
 */

const fs = require("fs");
const path = require("path");

console.log("\n" + "=".repeat(70));
console.log("🔐 Firestore Security Rules Deployment Guide");
console.log("=".repeat(70));

// Read the firestore.rules file
const rulesPath = path.join(__dirname, "firestore.rules");
const rulesContent = fs.readFileSync(rulesPath, "utf8");

console.log("\n📋 Rules Content (ready to deploy):\n");
console.log(rulesContent);

console.log("\n" + "=".repeat(70));
console.log("🚀 Deployment Options:");
console.log("=".repeat(70));

console.log(`
Option A: Firebase CLI (Recommended)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If you have Firebase CLI installed:

  npm install -g firebase-tools
  firebase login
  firebase deploy --only firestore:rules

Option B: Manual Deploy via Firebase Console
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Go to: https://console.firebase.google.com
2. Select: tahavura project
3. Go to: Firestore Database → Rules tab
4. Delete existing rules
5. Paste the rules above
6. Click: Publish

Option C: Copy Rules File
━━━━━━━━━━━━━━━━━━━━━━━━━━
The rules file is located at:
${rulesPath}

You can copy/paste directly from that file.

${
  rulesContent.length > 0
    ? `\n✅ Rules file contains ${rulesContent.split("\n").length} lines`
    : ""
}
`);

console.log("=".repeat(70));
console.log(
  "\n⏳ After deploying rules, you can test login at http://localhost:3001/login"
);
console.log('   Credentials: admin@example.com / admin123\n');
console.log("=".repeat(70) + "\n");
