# Audit initial — 2 octobre 2026

Audit du code et contrôles locaux, sans modification de l'application ni du backend.

## Architecture existante

- Next.js 13.2.4, React 18.2, TypeScript 5 strict, Tailwind 3. Le README indique à tort Next.js 14.
- Pages Router : accueil `/`, `/login`, `/signup`, `/confirm`, `/account`, `/create-post`, `/post/[id]`, `/r/[name]`, `/user/[username]`.
- Lectures serveur via `getServerSideProps`. Requêtes partagées dans `lib/supabaseQueries.ts`, modèles dans `types/models.ts`, types de base dans `schema.ts`.
- Auth email/mot de passe ; logout dans `UserDropdown`. Provider client dans `_app`, client autonome dans `lib/supabaseClient.ts`, client serveur dans `/account`. Aucun parcours OAuth implémenté dans le code inspecté.
- Backend attendu : `profiles`, `posts`, `subreddits`, `post_votes`, `comments`. Relations vers auteur, subreddit, votes et commentaires ; le profil attend notamment la FK `posts_posted_by_fkey`.
- Commentaires simples : aucun champ parent dans le schéma fourni, malgré la description de commentaires imbriqués dans le README.
- Images dans le bucket `images`, avec URL publique construite depuis la configuration.
- UI réutilisable : cartes `Post`, navigation, contrôles de vote, formulaires et hook `useFormSubmit`. Le branding et les concepts Reddit seront traités à l'étape 8.

## Configuration et backend

- Le code lit `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `NEXT_PUBLIC_SUPABASE_IMAGE_BUCKET_URL`. La variable `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` documentée dans AGENTS.md n'est pas directement lue par le client existant.
- `DATABASE_PASSWORD` n'est pas utilisée par l'application inspectée ; aucun secret serveur ne doit devenir public.
- `next.config.js` autorise un ancien domaine Supabase pour les images. `update-types` référence un autre identifiant de projet et une sortie absolue `/schema.ts`.
- Aucun SQL de création, migration, trigger de profil ou policy RLS trouvé. Les types TypeScript ne prouvent pas que le backend connecté possède ce schéma, les contraintes ou les permissions nécessaires.
- `.env.local` est ignoré et `.env.example` est suivi. `.gitignore` ne couvre pas tous les noms possibles de fichiers `.env`.

## Fragilités identifiées

- L'accueil ignore les erreurs Supabase et appelle `map` sur le résultat attendu. Une réponse `null` entraîne une erreur 500 ; la cause de la réponse Supabase reste à diagnostiquer.
- Pages post et profil : données absentes insuffisamment gérées. La création suppose qu'au moins un subreddit existe.
- Votes : état optimiste sans rollback, mutation du tableau reçu en props, suppressions sans vérification d'erreur, absence de verrou pendant la requête. Les `upsert` ne précisent pas de cible de conflit `(user_id, post_id)` ; unicité réelle à vérifier côté SQL.
- Downvote déconnecté : exception, alors que l'upvote redirige vers le login.
- Tri Top calculé sur les données initiales, sans recalcul global après vote ; pas de pagination des posts sur l'accueil.
- Plusieurs clients Supabase coexistent, notamment le client autonome pour signup et commentaires. La cohérence des sessions doit être vérifiée.
- UUID d'upload généré au niveau du module, réutilisé avec `upsert: true` : risque de remplacement d'image.
- `schema.ts` ne décrit pas `posts.url`, pourtant envoyé par le formulaire de création de liens.
- Auth helpers hérités : migration à prévoir à l'étape 5. Versions cibles et avis de sécurité devront être vérifiés auprès des sources officielles avant migration ; aucun audit de vulnérabilités réalisé ici.
- Les contrôles UI d'auteur ne remplacent pas les policies SQL. RLS et intégrité des votes non vérifiées.

## Vérifications exécutées

- Node 24.13.1 ; npm 11.8.0.
- `npx --no-install tsc --noEmit --incremental false` : succès.
- `npm run lint` : succès, aucun warning ESLint.
- `npm test -- --runInBand` : 2 suites passent, 1 échoue ; 6 tests passent, 9 échouent. Les 9 échecs concernent `formatTimeAgo` : attentes anglaises, résultat français. `Intl.RelativeTimeFormat(undefined)` dépend de la locale de l'environnement.
- `GET http://localhost:3000` : HTTP 500, `Cannot read properties of null (reading 'map')`.
- Build non exécuté à cette étape ; à effectuer à l'étape 2 en évitant les conflits avec le répertoire `.next` du serveur dev actif.
- Aucun compte créé, vote écrit, backend modifié ou secret affiché. Login/logout, contenu réel, contraintes et RLS restent à vérifier.

## Suite proposée

Étape 2 : diagnostiquer la réponse Supabase de l'accueil, vérifier le schéma original disponible et corriger uniquement les blocages locaux. Si le backend original manque, préparer un SQL reviewable avant exécution plutôt que passer immédiatement au modèle cible.

Étape 3 : distinguer la connexion Supabase déjà renseignée de la création du schéma cible `profiles/topics/items/votes`. Conserver les validations SQL, auth et vote avant toute modernisation ou refonte UI.

## Suivi de l'étape 2

- Diagnostic en lecture seule : variables présentes ; les cinq tables et la requête posts avec relations renvoient HTTP 404 / `PGRST205` (tables non trouvées dans le cache API). Leur existence SQL exacte reste à contrôler via un accès administratif.
- `pages/index.tsx` normalise les résultats absents en tableaux vides et affiche une erreur générique visible ; aucun détail de configuration n'est envoyé à l'UI.
- `supabase/bootstrap-original.sql` et `supabase/README.md` préparés pour revue. Script non exécuté, sans modification du backend. Aucun Storage créé.
- TypeScript et lint passent après la modification. Build et parcours backend restent à vérifier ; les échecs de locale des tests ne sont pas corrigés dans ce périmètre.

## Initialisation du backend autorisée et effectuée

- `supabase/bootstrap-original.sql` appliqué via le session pooler, en TLS avec CA Supabase et validation du certificat activée. Les cinq tables étaient absentes avant application ; transaction validée.
- Vérifiés : RLS sur les cinq tables, 13 policies, contrainte unique `(user_id, post_id)`, trigger de profil actif, communauté `general` créée.
- Lectures API anonymes : posts avec relations HTTP 200 (aucun post), communautés HTTP 200 (une communauté).
- Serveur dev relancé : une modification concurrente des dépendances avait laissé une résolution vers un ancien chemin du SDK. Après redémarrage, `/`, `/create-post` et `/login` répondent HTTP 200 ; aucune erreur backend affichée sur l'accueil.
- Les modifications concurrentes de `package.json` et `package-lock.json` ont été conservées.
- Login/logout réels, sécurité avec plusieurs comptes, build et rate limiting restent à vérifier ou implémenter ; la présence des policies ne vaut pas validation fonctionnelle complète de sécurité.

## Validation technique locale complémentaire

- `schema.ts` : relations SQL ajoutées pour rendre le schéma typé compatible avec le SDK installé, et champ `posts.url` décrit. Aucune migration SQL supplémentaire.
- Routes post/profil/communauté : validation des paramètres et réponses 404 lorsque la donnée manque ; les erreurs backend sont distinguées de l'absence de donnée. Rafraîchissement des commentaires avec l'ID numérique du post.
- Tests de dates : locale anglaise fixée uniquement pendant l'initialisation du module testé ; locale de production conservée.
- Vérifiés : build de production réussi, TypeScript et lint réussis, 3 suites / 15 tests réussis. Warnings hérités : données Browserslist/Baseline anciennes et dépréciation Node `punycode`.
- Serveur dev arrêté pendant le build puis relancé. Accueil, création, login et signup HTTP 200 ; compte déconnecté HTTP 307 ; ressources inexistantes HTTP 404 ; communauté `general` HTTP 200.
- L'utilisateur n'a pas encore testé l'inscription/confirmation/login/logout. Aucun email de test envoyé et aucun compte créé par l'agent ; auth réelle et session après refresh restent à valider.

## Configuration locale finalisée

Validation utilisateur avant baseline : auth, création/lecture/détail des posts, vote +1/0/-1 et persistance après refresh, commentaires persistants, restrictions après logout et votes indépendants avec un second compte fonctionnent. Ces parcours sont rapportés par l'utilisateur ; le rate limiting reste non activé.

- `next.config.js` utilise l'URL du bucket configuré pour autoriser les images, avec hôte et chemin limités au bucket ; ancien domaine supprimé. Bucket et upload réels restent à vérifier séparément.
- `.gitignore` couvre `.env*` et conserve `.env.example` ; commentaires ajoutés à l'exemple pour distinguer la clé utilisée par l'auth actuelle, la future clé et le mot de passe d'administration.
- `/account` affiche un état d'erreur si le profil ne peut pas être chargé, et rend visibles les erreurs de mise à jour. Aucun changement d'architecture auth ni création de compte.
- TypeScript, lint et les 15 tests passent après ces changements. Les parcours d'auth réels et les protections de quotas restent ouverts.

## Point de retour et première sous-migration framework

- Commit baseline `fc8ef58` créé avec le message demandé, puis publié sur `https://github.com/stevenmdc/reddit-clone.git` ; aucune valeur secrète configurée trouvée dans les fichiers destinés au commit. `origin` pointe sur ce dépôt.
- Après baseline : Next 15.5.27, React/React DOM 18.3.1, TypeScript 5.9.3, ESLint 8.57.1 et config Next correspondante. Pages Router, UI, schéma et auth helpers conservés.
- Script lint passé à ESLint CLI. Répertoire `.next` exclu de la découverte Jest pour éviter une collision avec le package standalone. Cache CLI Supabase retiré du suivi et ignoré.
- Build, TypeScript, lint et 15 tests réussis. Serveur dev relancé sur le port 3000.
- `npm audit fix` sans force a corrigé les alertes compatibles ; 3 alertes restantes concernent PostCSS/Next et uuid. Audit non vierge ; Next 16, React 19, ESLint 9 et migration Supabase Auth restent des travaux distincts. Docker Node 18 hérité reste à moderniser.
- Sources : [compatibilité Pages Router/React 18](https://nextjs.org/blog/next-15), [support Next.js](https://nextjs.org/support-policy).

## Réorganisation des sources et conventions

- Code déplacé dans `src/` : pages, composants, constantes, hooks, styles, lib et types. Alias TypeScript/Jest `@/` remappé ; chemins Tailwind et lint ajustés.
- `index.ts` remplacé par `src/lib/format-time-ago.ts`, `schema.ts` par `src/types/database.ts`, clients/requêtes regroupés dans `src/lib/supabase/`. Imports et mocks mis à jour, logique conservée.
- Capture déplacée dans `public/images/screenshot.png`, référence README corrigée. Images utilisateur toujours dans Storage.
- `npm run update-types` utilise un script dédié, sans ancien identifiant de projet ni chemin absolu ; fichier existant préservé en cas d'échec. Script vérifié syntaxiquement mais génération non exécutée.
- Build, TypeScript, lint et 15 tests réussis après déplacement. Serveur dev relancé. Aucun changement SQL ni architecture auth pendant le rangement.
- Décision déléguée par l'utilisateur : garder `src/pages/` pour cette étape, préparer le passage à `src/app/` conjointement avec la modernisation auth et des chargements serveur.

## Next.js 16 et nettoyage des caches

Configuration TypeScript : cible héritée ES5 remplacée par ES2017, plugin Next et types générés dev/build inclus explicitement. Le compilateur local 5.9.3 ne reproduisait pas le diagnostic éditeur ; ES5 est déprécié dans TypeScript 6. Vérification `tsc --noEmit --incremental false` réussie après correction.

- Next `^16.3.8` et config ESLint associée installés ; ESLint 9 avec flat config. Build Turbopack réussi. React 18.3.1 conservé, compatible avec les peers déclarés de Next et le Pages Router.
- Next a ajusté TypeScript : résolution `bundler`, JSX `react-jsx`. Les 15 tests passent.
- uuid et ses types supprimés : upload avec `crypto.randomUUID()` généré par fichier. Audit npm complet et production : zéro vulnérabilité signalée à ce contrôle.
- La nouvelle règle React détecte deux synchronisations d'état héritées dans Upvotes. Niveau warning limité à ce fichier pour préserver le comportement validé pendant la migration ; refactor prévu avec le vote. Aucune désactivation globale.
- `.swc` ne contenait que des sous-dossiers vides : supprimé et ignoré. `images` racine vide supprimé après vérification ; capture toujours dans `public/images/`.
- Docker utilise Node 24 ; build Docker non exécuté. Auth helpers et App Router restent à migrer, protections de quotas non actives.
- Référence : [guide de migration Next 16](https://nextjs.org/docs/app/guides/upgrading/version-16).

## Publication de la modernisation

- À la demande de l'utilisateur : cache `.swc` vide supprimé, Dockerfile déplacé dans `docker/`, commande README et argument d'URL du bucket ajustés. Contexte Docker conservé à la racine, `.env*` et caches exclus du contexte.
- Avant commit/push : TypeScript et 15 tests passent, audit npm à zéro vulnérabilité, diff sans erreur d'espacement, aucune valeur secrète configurée détectée dans les fichiers destinés au commit.
- Docker non exécuté ; deux avertissements lint hérités dans Upvotes restent documentés. Point de retour baseline conservé dans l'historique.
