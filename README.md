# Scan de sécurité automatique

Génère des rapports de sécurité (ton non-technique, orienté client) à partir de la seule **URL publique** d'un site. Aucun accès au repo GitHub, à l'hébergeur ou aux identifiants du site scanné n'est nécessaire — le scan lit uniquement les en-têtes HTTP publics, comme le ferait un visiteur normal ou un outil tel que securityheaders.com.

Trois usages couverts :

| Usage | Fichier | Déclenchement |
|---|---|---|
| Scanner **votre propre site** à chaque modification | `.github/workflows/security-scan.yml` | Automatique, à chaque `push` sur `main` |
| Scanner **un site client** à la demande | `.github/workflows/scan-client.yml` | Manuel, depuis l'onglet Actions, en tapant l'URL |
| Scanner **tous vos clients** d'un coup | `.github/workflows/scan-all-clients.yml` | Automatique chaque semaine + manuel |

Tout se passe dans **votre** repo — vous n'avez jamais besoin d'accéder au repo, à l'hébergeur ou aux identifiants du client.

---

## 1. Scanner un site client ponctuellement

### Depuis GitHub (recommandé, aucune installation)

1. Aller dans l'onglet **Actions** de votre repo.
2. Sélectionner le workflow **"Scan de sécurité - un client"**.
3. Cliquer sur **Run workflow**, renseigner :
   - `site_url` : l'URL publique du site du client (ex. `https://site-du-client.com`)
   - `client_name` : le nom du client (optionnel, pour le titre du rapport)
4. Une fois terminé, récupérer le rapport de deux façons :
   - Téléchargeable directement dans les **artifacts** du run (onglet Actions → le run → section Artifacts)
   - Commité automatiquement dans `reports/clients/<nom-du-client>-rapport-securite.md`

### En local (si vous préférez)

```bash
node scripts/scan-client.mjs --url https://site-du-client.com --name "Nom du client"
```

Le rapport s'affiche dans le terminal et s'enregistre dans `reports/clients/`.

---

## 2. Scanner tous vos clients d'un coup

1. Copier `clients.example.json` vers `clients.json` et lister vos clients :
   ```json
   [
     { "name": "Boulangerie Martin", "url": "https://boulangerie-martin.fr" },
     { "name": "Cabinet Dupont Avocats", "url": "https://dupont-avocats.fr" }
   ]
   ```
2. Commiter `clients.json` dans le repo (ou le garder en local si vous ne voulez pas le versionner).
3. Le workflow **"Scan de sécurité - tous les clients (hebdomadaire)"** tourne automatiquement chaque lundi et met à jour tous les rapports dans `reports/clients/`.
4. Vous pouvez aussi le lancer manuellement à tout moment (onglet Actions → Run workflow), ou en local :
   ```bash
   node scripts/scan-batch.mjs clients.json
   ```

---

## 3. Scanner votre propre site à chaque déploiement

Inchangé par rapport à la version précédente : le workflow `security-scan.yml` se déclenche à chaque `push` sur `main` (donc à chaque redéploiement Netlify) et met à jour `reports/dernier-rapport.md`.

---

## Installation (une seule fois)

Copier l'ensemble du contenu de ce projet à la racine de votre repo GitHub :
```
.github/workflows/security-scan.yml
.github/workflows/scan-client.yml
.github/workflows/scan-all-clients.yml
scripts/scan.mjs
scripts/scan-lib.mjs
scripts/scan-client.mjs
scripts/scan-batch.mjs
clients.example.json
```

Aucune clé API ni secret à configurer.

## Faire évoluer les vérifications

Les vérifications communes aux deux modes sont centralisées dans `scripts/scan-lib.mjs`, tableau `CHECKS`. Pour en ajouter une, ajouter un objet avec :
- `header` : le nom de l'en-tête HTTP
- `title`, `risk`, `solution` : le texte en langage simple pour le rapport client
- `validate` : fonction qui juge si la valeur trouvée est correcte

## Limites actuelles

- Vérifie les en-têtes de sécurité HTTP publics uniquement (pas de test SSL/TLS approfondi type SSL Labs, pas d'audit des formulaires ou des dépendances npm — voir `readme.md` du guide d'audit pour ces vérifications complémentaires).
- Certains sites bloquent les requêtes automatisées (protection anti-bot) : dans ce cas le rapport indiquera une erreur de connexion plutôt qu'un résultat, et il faudra vérifier manuellement.
- Un scan de headers ne remplace pas un audit de sécurité complet ; c'est un premier niveau de contrôle, à présenter comme tel à vos clients.
