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
