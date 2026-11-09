#!/usr/bin/env node
/* Generates the key pair that signs Veer Tools license tokens.

     node scripts/gen-license-keypair.js

   - Writes the PUBLIC key into every tool page between the
     LICENSE_PUBLIC_KEY markers (safe to commit; it can only verify).
   - Writes the PRIVATE key to ./license-signing-key.txt (git-ignored) as a
     one-line base64 string. Paste that into Vercel as LICENSE_SIGNING_KEY,
     then delete the file. Never commit it or share it.

   Running this again replaces the pair, which signs out every existing Pro
   browser until it refreshes (they'll refresh automatically next time they
   open the tool online). */
"use strict";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const pages = ["nfc-studio/app.html", "vectorizer/app.html", "lightbox/app.html"];

const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
const jwk = publicKey.export({ format: "jwk" });
const pub = JSON.stringify({ kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y });
const pem = privateKey.export({ format: "pem", type: "pkcs8" });

const re = /(\/\*LICENSE_PUBLIC_KEY\*\/)[\s\S]*?(\/\*\/LICENSE_PUBLIC_KEY\*\/)/;
for (const rel of pages) {
  const f = path.join(root, rel);
  const src = fs.readFileSync(f, "utf8");
  if (!re.test(src)) { console.error("Marker not found in " + rel); process.exit(1); }
  fs.writeFileSync(f, src.replace(re, `$1${pub}$2`));
  console.log("Public key written to " + rel);
}

const out = path.join(root, "license-signing-key.txt");
fs.writeFileSync(out, Buffer.from(pem).toString("base64") + "\n", { mode: 0o600 });
console.log("\nPrivate key written to " + out);
console.log("Add it to Vercel as LICENSE_SIGNING_KEY, then delete the file.");
