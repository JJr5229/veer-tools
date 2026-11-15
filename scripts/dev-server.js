#!/usr/bin/env node
/* Local preview server: serves the static site and runs api/license.js the
   way Vercel would.

     node scripts/dev-server.js [port]

   For testing Pro without a store, set a signing key and test keys:
     LICENSE_SIGNING_KEY=… LICENSE_TEST_KEYS="VEER-TEST-PRO:pro" node scripts/dev-server.js 8765 */
"use strict";
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const handlers = { "/api/license": require(path.join(root, "api/license.js")), "/api/claim": require(path.join(root, "api/claim.js")) };
const TYPES = { ".html":"text/html; charset=utf-8", ".css":"text/css", ".js":"text/javascript", ".json":"application/json",
  ".png":"image/png", ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".webp":"image/webp", ".svg":"image/svg+xml", ".ico":"image/x-icon" };
http.createServer((req, res) => {
  const route = Object.keys(handlers).find(r => req.url === r || req.url.startsWith(r + "?") || req.url.startsWith(r + "/"));
  if (route) {
    req.query = Object.fromEntries(new URL(req.url, "http://x").searchParams);
    let b = ""; req.on("data", c => b += c); req.on("end", () => {
      try { req.body = JSON.parse(b); } catch { req.body = {}; }
      res.status = c => { res.statusCode = c; return res; };
      res.json = o => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); };
      handlers[route](req, res);
    });
    return;
  }
  let f = path.join(root, decodeURIComponent(req.url.split("?")[0]));
  if (!f.startsWith(root)) { res.statusCode = 403; return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if (!fs.existsSync(f)) { res.statusCode = 404; return res.end("Not found"); }
  res.setHeader("Content-Type", TYPES[path.extname(f).toLowerCase()] || "application/octet-stream");
  fs.createReadStream(f).pipe(res);
}).listen(+process.argv[2] || 8765, () => console.log("Veer Tools on http://localhost:" + (+process.argv[2] || 8765)));
