-- ============================================================
-- Migration : Remplacement de l'enum WorkType par une table
-- À exécuter dans l'éditeur SQL Supabase
-- ============================================================

-- 1. Créer la table WorkType (si elle n'existe pas déjà)
CREATE TABLE IF NOT EXISTS "WorkType" (
  "id"        TEXT        NOT NULL,
  "name"      TEXT        NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WorkType_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WorkType_name_key" ON "WorkType"("name");

-- 2. Insérer les anciens types de travail par défaut
--    (uniquement si la table est vide, pour éviter les doublons)
INSERT INTO "WorkType" ("id", "name", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  v.name,
  NOW(),
  NOW()
FROM (VALUES
  ('Devis'),
  ('Architecture'),
  ('Ingénieur'),
  ('Administration'),
  ('Gestion'),
  ('Autre')
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM "WorkType" LIMIT 1);

-- 3. Ajouter la colonne workTypeId à WorkSession (si elle n'existe pas)
ALTER TABLE "WorkSession"
  ADD COLUMN IF NOT EXISTS "workTypeId" TEXT;

-- 4. Si vous aviez une ancienne colonne enum "workType", migrer les valeurs
--    (Commentez ce bloc si la colonne n'existe pas dans votre base)
/*
UPDATE "WorkSession" ws
SET "workTypeId" = wt.id
FROM "WorkType" wt
WHERE
  (ws."workType" = 'DEVIS'        AND wt.name = 'Devis')
  OR (ws."workType" = 'ARCHITECTURE' AND wt.name = 'Architecture')
  OR (ws."workType" = 'INGENIEUR'    AND wt.name = 'Ingénieur')
  OR (ws."workType" = 'ADMIN'        AND wt.name = 'Administration')
  OR (ws."workType" = 'GESTION'      AND wt.name = 'Gestion')
  OR (ws."workType" = 'AUTRE'        AND wt.name = 'Autre');

-- 5. Supprimer l'ancienne colonne enum (après vérification de la migration)
ALTER TABLE "WorkSession" DROP COLUMN IF EXISTS "workType";
*/

-- 6. Ajouter la contrainte de clé étrangère (si elle n'existe pas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'WorkSession_workTypeId_fkey'
  ) THEN
    ALTER TABLE "WorkSession"
      ADD CONSTRAINT "WorkSession_workTypeId_fkey"
      FOREIGN KEY ("workTypeId") REFERENCES "WorkType"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

-- ============================================================
-- Vérification
-- ============================================================
SELECT * FROM "WorkType" ORDER BY "name";
