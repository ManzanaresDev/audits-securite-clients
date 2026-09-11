// scan-lib.mjs
// Logique réutilisable : scanner un site public (aucun accès au repo/hébergeur
// du client requis, uniquement son URL publique) et générer un rapport dans
// le même style que le rapport rédigé à la main pour Émilie.

export const CHECKS = [
  {
    header: "x-frame-options",
    id: "clickjacking",
    title: "Protection contre les sites piégés qui copient le vôtre",
    risk:
      "Quelqu'un de malveillant pourrait afficher le site \"encapsulé\" à l'intérieur d'un autre site, sans que les visiteurs s'en rendent compte, pour les piéger.",
    solution:
      "Un réglage qui dit \"seul mon propre site a le droit de m'afficher comme ça\". Simple à mettre en place, aucun impact visible pour les visiteurs.",
    validate: (v) => Boolean(v),
  },
  {
    header: "x-content-type-options",
    id: "mime",
    title: "Protection contre les fichiers déguisés",
    risk:
      "Dans de rares cas, un navigateur peut être trompé par un fichier qui se fait passer pour autre chose que ce qu'il est réellement.",
    solution:
      "Un réglage qui force le navigateur à toujours vérifier le vrai type de chaque fichier avant de l'ouvrir.",
    validate: (v) => v && v.toLowerCase().includes("nosniff"),
  },
  {
    header: "referrer-policy",
    id: "referrer",
    title: "Contrôle des informations partagées en quittant le site",
    risk:
      "Quand un visiteur clique sur un lien qui l'amène vers un autre site, son navigateur peut transmettre l'adresse de la page qu'il vient de quitter.",
    solution:
      "Un réglage qui limite ce qui est partagé, sans rien changer à l'expérience de navigation.",
    validate: (v) => Boolean(v),
  },
  {
    header: "permissions-policy",
    id: "permissions",
    title: "Restriction des fonctions du navigateur",
    risk:
      "Par défaut, un site pourrait techniquement demander l'accès à la caméra, au micro ou à la géolocalisation d'un visiteur.",
    solution:
      "Désactiver explicitement ces accès quand ils ne sont pas utilisés sur le site.",
    validate: (v) => Boolean(v),
  },
  {
    header: "strict-transport-security",
    id: "hsts",
    title: "Renforcement de la connexion sécurisée (HSTS)",
    risk:
      "Sans ce réglage, un visiteur qui tape l'adresse sans le \"https://\" pourrait, dans de rares cas, transiter un court instant par une connexion non chiffrée avant la redirection.",
    solution:
      "Un réglage qui force le navigateur à toujours utiliser la connexion chiffrée pour ce site, sans exception.",
    validate: (v) => Boolean(v),
  },
  {
    header: "content-security-policy",
    id: "csp",
    title: "Liste des ressources autorisées à s'afficher (CSP)",
    risk:
      "Dans le pire des cas, si le site était un jour compromis, l'absence de cette protection permettrait à un pirate d'y injecter du contenu malveillant invisible pour vous mais actif pour les visiteurs.",
    solution:
      "C'est la protection la plus complète, mais aussi celle qui demande le plus de précaution à mettre en place (il faut d'abord inventorier tout ce que le site charge pour ne rien casser en l'activant).",
    validate: (v) => Boolean(v),
  },
];

/**
 * Scanne un site public via ses en-têtes HTTP.
 * N'a besoin que de l'URL publique — aucun accès au repo, à l'hébergeur
 * ou aux identifiants du site n'est requis, exactement comme un visiteur
 * normal ou un outil comme securityheaders.com.
 */
export async function scanSite(url) {
  const result = { url, date: new Date().toISOString(), checks: [] };

  try {
    const res = await fetch(url, { redirect: "follow" });
    result.finalUrl = res.url;
    result.httpsOk = res.url.startsWith("https://");
    result.status = res.status;

    for (const check of CHECKS) {
      const value = res.headers.get(check.header);
      result.checks.push({ ...check, present: Boolean(value), value, ok: check.validate(value) });
    }
  } catch (err) {
    result.error = err.message;
  }

  return result;
}

function frenchDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Construit un rapport "orienté client" : langage simple, ton rassurant,
 * même structure que le rapport rédigé à la main (résumé, points forts,
 * points à améliorer, étapes concrètes).
 */
export function buildClientReport(result, { clientName, siteLabel } = {}) {
  const label = siteLabel || clientName || new URL(result.url).hostname;
  const dateStr = frenchDate(result.date);

  if (result.error) {
    return `# Rapport de sécurité du site web
**Site analysé :** ${label} (${result.url})
**Date :** ${dateStr}

## ⚠️ Le site n'a pas pu être analysé

Le scan n'a pas réussi à joindre le site (\`${result.error}\`). Cela peut venir d'un site temporairement hors ligne, d'un blocage des robots automatisés, ou d'une adresse incorrecte. Une nouvelle tentative est recommandée avant de conclure quoi que ce soit.
`;
  }

  const passed = result.checks.filter((c) => c.ok);
  const toImprove = result.checks.filter((c) => !c.ok);
  const allGood = toImprove.length === 0;

  const goodSection = `## 🟢 Ce qui va très bien

### La connexion sécurisée (HTTPS)

${result.httpsOk
    ? "Le site utilise bien une connexion chiffrée (le cadenas 🔒 dans le navigateur). Toutes les informations échangées avec les visiteurs sont protégées en transit."
    : "⚠️ Le site ne redirige pas systématiquement vers une connexion chiffrée. C'est le point le plus important à corriger — à traiter en priorité, avant les points ci-dessous."}
${passed.length ? `\n### Réglages déjà en place\n\n${passed.map((c) => `- **${c.title}**`).join("\n")}\n` : ""}`;

  const improveSection = toImprove.length
    ? `## 🟡 Ce qui peut être amélioré

${toImprove
        .map(
          (c, i) => `### ${i + 1}. ${c.title}

**Le risque :** ${c.risk}

**La solution :** ${c.solution}
`
        )
        .join("\n")}`
    : `## 🟢 Rien à signaler de plus

Tous les réglages vérifiés sont déjà en place. Le site est dans un très bon état sur les points contrôlés par ce scan.`;

  const stepsSection = allGood
    ? ""
    : `
## Ce qu'il faut faire concrètement

Bonne nouvelle : aucune de ces améliorations ne nécessite de refaire le site. Ce sont des réglages qui s'ajoutent via la configuration de l'hébergeur (fichier \`netlify.toml\`, \`vercel.json\`, \`.htaccess\`, ou équivalent selon l'hébergeur), sans toucher au design ni au contenu.

**Rien de tout cela n'est urgent** — un site sans ces réglages reste globalement sûr à visiter dans l'intervalle. Ce sont des renforcements préventifs.
`;

  return `# Rapport de sécurité du site web
**Site analysé :** ${label} (${result.url})
**Date :** ${dateStr}

---

## En résumé

${allGood
    ? "🟢 **Ce site est en très bon état** sur l'ensemble des points vérifiés."
    : `🟡 **Ce site est globalement sûr pour ses visiteurs**, mais quelques réglages techniques simples peuvent encore être ajoutés pour le renforcer (${toImprove.length} sur ${result.checks.length}). Rien d'urgent ni de grave.`}

---

${goodSection}

---

${improveSection}
${stepsSection}
---

*Rapport généré automatiquement à partir d'une analyse des en-têtes de sécurité publics du site (comme le ferait un outil tel que securityheaders.com). Il ne remplace pas un audit manuel complet (formulaires, dépendances, gestion des erreurs).*
`;
}
