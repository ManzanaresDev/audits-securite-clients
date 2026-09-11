// scan-client.mjs
// Lance un scan pour UN site, à partir de sa seule URL publique.
// Aucun accès au repo, à l'hébergeur ou aux identifiants du client n'est nécessaire.
//
// Usage :
//   node scripts/scan-client.mjs --url https://site-du-client.com --name "Nom du client"
//
// Ou via variables d'environnement (pratique pour GitHub Actions) :
//   SITE_URL=https://site-du-client.com CLIENT_NAME="Nom du client" node scripts/scan-client.mjs

import { scanSite, buildClientReport } from "./scan-lib.mjs";
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--url") args.url = argv[++i];
    if (argv[i] === "--name") args.name = argv[++i];
  }
  return args;
}

const cli = parseArgs(process.argv.slice(2));
const url = cli.url || process.env.SITE_URL;
const name = cli.name || process.env.CLIENT_NAME;

if (!url) {
  console.error("❌ Merci de fournir une URL : --url https://... (ou SITE_URL=...)");
  process.exit(1);
}

const slug = (name || new URL(url).hostname).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const result = await scanSite(url);
const report = buildClientReport(result, { clientName: name });

console.log(report);

const outDir = path.join(process.cwd(), "reports", "clients");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${slug}-rapport-securite.md`);
fs.writeFileSync(outFile, report, "utf-8");

console.log(`\n✅ Rapport écrit dans ${path.relative(process.cwd(), outFile)}`);
