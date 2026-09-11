// scan.mjs
// Scanne les en-têtes de sécurité HTTP d'un site et génère un rapport markdown
// lisible par une personne non-technique, dans le même esprit que le rapport
// de sécurité fait manuellement.
//
// Usage : SITE_URL="https://jardin-des-sens-par-emilie.com" node scripts/scan.mjs

const SITE_URL = process.env.SITE_URL;

if (!SITE_URL) {
  console.error("❌ Variable d'environnement SITE_URL manquante.");
  process.exit(1);
}

// Description des en-têtes vérifiés : nom technique, explication simple,
// et fonction de validation (certains headers ont juste besoin d'exister,
// d'autres doivent contenir une valeur précise).
const CHECKS = [
  {
    header: "strict-transport-security",
    label: "Connexion sécurisée renforcée (HSTS)",
    explanation:
      "Force le navigateur à toujours utiliser la connexion chiffrée (HTTPS), même si quelqu'un tape l'adresse sans le 's'.",
    validate: (v) => Boolean(v),
  },
  {
    header: "x-frame-options",
    label: "Protection contre les sites piégés qui copient le vôtre",
    explanation:
      "Empêche votre site d'être affiché caché à l'intérieur d'un autre site malveillant (clickjacking).",
    validate: (v) => Boolean(v),
  },
  {
    header: "x-content-type-options",
    label: "Protection contre les fichiers déguisés",
    explanation:
      "Empêche le navigateur de deviner (à tort) le type d'un fichier téléchargé.",
    validate: (v) => v && v.toLowerCase().includes("nosniff"),
  },
  {
    header: "referrer-policy",
    label: "Contrôle des informations partagées en quittant le site",
    explanation:
      "Limite ce que le navigateur transmet aux autres sites quand un visiteur clique sur un lien sortant.",
    validate: (v) => Boolean(v),
  },
  {
    header: "permissions-policy",
    label: "Restriction des fonctions du navigateur",
    explanation:
      "Désactive explicitement l'accès à la caméra, au micro et à la géolocalisation, puisqu'ils ne sont pas utilisés.",
    validate: (v) => Boolean(v),
  },
  {
    header: "content-security-policy",
    label: "Liste des ressources autorisées à s'afficher (CSP)",
    explanation:
      "La protection la plus complète : limite ce qui peut s'exécuter sur le site, même en cas de piratage.",
    validate: (v) => Boolean(v),
  },
];

async function scan(url) {
  const result = {
    url,
    date: new Date().toISOString(),
    httpsOk: false,
    checks: [],
    error: null,
  };

  try {
    const res = await fetch(url, { redirect: "follow" });
    result.httpsOk = res.url.startsWith("https://");
    result.status = res.status;

    for (const check of CHECKS) {
      const value = res.headers.get(check.header);
      result.checks.push({
        ...check,
        present: Boolean(value),
        value,
        ok: check.validate(value),
      });
    }
  } catch (err) {
    result.error = err.message;
  }

  return result;
}

function buildReportMarkdown(result) {
  const dateStr = new Date(result.date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (result.error) {
    return `# Rapport de sécurité automatique

**Site analysé :** ${result.url}
**Date :** ${dateStr}

## ⚠️ Le scan n'a pas pu aboutir

Erreur technique : \`${result.error}\`

Cela peut arriver si le site est temporairement indisponible au moment du scan. Le prochain déploiement relancera automatiquement un nouveau rapport.
`;
  }

  const okCount = result.checks.filter((c) => c.ok).length;
  const total = result.checks.length;
  const allGood = okCount === total;

  const summaryLine = allGood
    ? "🟢 **Tous les réglages de sécurité vérifiés sont bien en place.**"
    : `🟡 **${okCount} réglage(s) sur ${total} sont en place.** Quelques améliorations possibles ci-dessous.`;

  const rows = result.checks
    .map((c) => {
      const icon = c.ok ? "✅" : "❌";
      return `| ${icon} | **${c.label}** | ${c.explanation} |`;
    })
    .join("\n");

  return `# Rapport de sécurité automatique

**Site analysé :** ${result.url}
**Date :** ${dateStr}
**Généré automatiquement après une modification du site.**

---

## En résumé

${result.httpsOk ? "🟢 La connexion sécurisée (HTTPS) fonctionne correctement." : "🔴 Le site ne redirige pas vers une connexion sécurisée (HTTPS) — à vérifier en priorité."}

${summaryLine}

---

## Détail des vérifications

| État | Réglage | Ce que ça fait |
|---|---|---|
${rows}

---

*Ce rapport est généré automatiquement à chaque mise à jour du site. Il ne remplace pas une analyse manuelle approfondie, mais permet de suivre l'évolution dans le temps.*
`;
}

const result = await scan(SITE_URL);
const markdown = buildReportMarkdown(result);

console.log(markdown);

// Écrit le rapport dans reports/ pour qu'il puisse être commité par la CI
const fs = await import("node:fs");
const path = await import("node:path");

const reportsDir = path.join(process.cwd(), "reports");
fs.mkdirSync(reportsDir, { recursive: true });

const filename = `rapport-securite-${new Date().toISOString().slice(0, 10)}.md`;
fs.writeFileSync(path.join(reportsDir, filename), markdown, "utf-8");
fs.writeFileSync(path.join(reportsDir, "dernier-rapport.md"), markdown, "utf-8");

console.log(`\n✅ Rapport écrit dans reports/${filename}`);
