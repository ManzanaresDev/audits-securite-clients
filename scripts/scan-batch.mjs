// scan-batch.mjs
// Scanne tous les clients listés dans clients.json (ou un autre fichier passé en argument).
//
// Usage :
//   node scripts/scan-batch.mjs                  # utilise clients.json à la racine
//   node scripts/scan-batch.mjs mes-clients.json  # fichier personnalisé

import { scanSite, buildClientReport } from "./scan-lib.mjs";
import fs from "node:fs";
import path from "node:path";

const configPath = process.argv[2] || "clients.json";

if (!fs.existsSync(configPath)) {
  console.error(`❌ Fichier introuvable : ${configPath}`);
  console.error(`   Copiez clients.example.json vers clients.json et remplissez-le.`);
  process.exit(1);
}

const clients = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const outDir = path.join(process.cwd(), "reports", "clients");
fs.mkdirSync(outDir, { recursive: true });

for (const client of clients) {
  console.log(`\n🔍 Scan de ${client.name} (${client.url})...`);
  const result = await scanSite(client.url);
  const report = buildClientReport(result, { clientName: client.name });

  const slug = client.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const outFile = path.join(outDir, `${slug}-rapport-securite.md`);
  fs.writeFileSync(outFile, report, "utf-8");

  console.log(`   ✅ ${path.relative(process.cwd(), outFile)}`);
}

console.log(`\n✅ ${clients.length} rapport(s) généré(s) dans reports/clients/`);
