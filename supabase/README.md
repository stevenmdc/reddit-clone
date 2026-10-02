# Initialisation du clone original

`bootstrap-original.sql` crée les cinq tables attendues par le code existant, leurs relations, l'unicité des votes et les policies RLS. Il a été validé et appliqué au projet personnel le 2 octobre 2026. Ne pas le réexécuter sur ce projet.

Il utilise les patterns Supabase documentés pour les [profils et triggers Auth](https://supabase.com/docs/guides/auth/managing-user-data) et la [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Périmètre et limites

- Exécution unique via SQL Editor, sur le projet personnel prévu pour le clone. Si une table existe déjà, le script échoue et la transaction est annulée ; il ne remplace aucune table.
- Lectures publiques des profils, posts, communautés, commentaires et votes. Les identifiants des votants sont publics, comme l'exige le calcul actuel côté frontend ; à revoir pour le produit cible.
- Écritures réservées à l'utilisateur connecté et à ses propres lignes. Les communautés sont administrées via SQL, sans écriture depuis le navigateur.
- Création du profil à l'inscription. Un username déjà pris fait échouer l'inscription ; les utilisateurs déjà existants reçoivent un profil sans username.
- La communauté `general` est créée, sans faux posts ni faux votes.
- Aucun bucket Storage n'est créé : les images restent un contrôle séparé.
- Le modèle cible `topics/items/votes` reste l'étape 3.
- La contrainte unique ne corrige pas le `upsert` frontend actuel : transitions de vote à traiter à l'étape prévue pour les votes.

## Après exécution autorisée

1. Vérifier que l'accueil charge et que `general` apparaît.
2. Vérifier les URLs Auth locales dans le dashboard (`http://localhost:3000`) et tester inscription, confirmation, login/logout et `/account`.
3. Créer un post texte ; contrôler qu'un autre compte ne peut pas modifier ou supprimer les données du premier.
4. Vérifier les votes et les policies avec plusieurs comptes avant de valider l'étape 2 ; le vote hérité présente encore des fragilités documentées dans AUDIT.md.
