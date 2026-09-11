# Rapport de sécurité du site web
**Site analysé :** Emilie (https://jardin-des-sens-par-emilie.com)
**Date :** 11 septembre 2026

---

## En résumé

🟡 **Ce site est globalement sûr pour ses visiteurs**, mais quelques réglages techniques simples peuvent encore être ajoutés pour le renforcer (5 sur 6). Rien d'urgent ni de grave.

---

## 🟢 Ce qui va très bien

### La connexion sécurisée (HTTPS)

Le site utilise bien une connexion chiffrée (le cadenas 🔒 dans le navigateur). Toutes les informations échangées avec les visiteurs sont protégées en transit.

### Réglages déjà en place

- **Renforcement de la connexion sécurisée (HSTS)**


---

## 🟡 Ce qui peut être amélioré

### 1. Protection contre les sites piégés qui copient le vôtre

**Le risque :** Quelqu'un de malveillant pourrait afficher le site "encapsulé" à l'intérieur d'un autre site, sans que les visiteurs s'en rendent compte, pour les piéger.

**La solution :** Un réglage qui dit "seul mon propre site a le droit de m'afficher comme ça". Simple à mettre en place, aucun impact visible pour les visiteurs.

### 2. Protection contre les fichiers déguisés

**Le risque :** Dans de rares cas, un navigateur peut être trompé par un fichier qui se fait passer pour autre chose que ce qu'il est réellement.

**La solution :** Un réglage qui force le navigateur à toujours vérifier le vrai type de chaque fichier avant de l'ouvrir.

### 3. Contrôle des informations partagées en quittant le site

**Le risque :** Quand un visiteur clique sur un lien qui l'amène vers un autre site, son navigateur peut transmettre l'adresse de la page qu'il vient de quitter.

**La solution :** Un réglage qui limite ce qui est partagé, sans rien changer à l'expérience de navigation.

### 4. Restriction des fonctions du navigateur

**Le risque :** Par défaut, un site pourrait techniquement demander l'accès à la caméra, au micro ou à la géolocalisation d'un visiteur.

**La solution :** Désactiver explicitement ces accès quand ils ne sont pas utilisés sur le site.

### 5. Liste des ressources autorisées à s'afficher (CSP)

**Le risque :** Dans le pire des cas, si le site était un jour compromis, l'absence de cette protection permettrait à un pirate d'y injecter du contenu malveillant invisible pour vous mais actif pour les visiteurs.

**La solution :** C'est la protection la plus complète, mais aussi celle qui demande le plus de précaution à mettre en place (il faut d'abord inventorier tout ce que le site charge pour ne rien casser en l'activant).


## Ce qu'il faut faire concrètement

Bonne nouvelle : aucune de ces améliorations ne nécessite de refaire le site. Ce sont des réglages qui s'ajoutent via la configuration de l'hébergeur (fichier `netlify.toml`, `vercel.json`, `.htaccess`, ou équivalent selon l'hébergeur), sans toucher au design ni au contenu.

**Rien de tout cela n'est urgent** — un site sans ces réglages reste globalement sûr à visiter dans l'intervalle. Ce sont des renforcements préventifs.

---

*Rapport généré automatiquement à partir d'une analyse des en-têtes de sécurité publics du site (comme le ferait un outil tel que securityheaders.com). Il ne remplace pas un audit manuel complet (formulaires, dépendances, gestion des erreurs).*
