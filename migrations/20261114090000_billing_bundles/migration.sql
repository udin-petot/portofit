-- Paket bundel: satu paket bisa berisi beberapa jenis kredit.
-- Katalog menyimpan daftar isi, order menyimpan salinannya saat dibeli.

ALTER TABLE "billing_plan" ADD COLUMN IF NOT EXISTS "compare_at_idr" integer;

CREATE TABLE IF NOT EXISTS "billing_plan_item" (
	"id" text PRIMARY KEY NOT NULL,
	"plan_id" text NOT NULL REFERENCES "billing_plan"("id") ON DELETE CASCADE,
	"kind" text NOT NULL,
	"credits" integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "billing_plan_item_plan_kind_index"
	ON "billing_plan_item" ("plan_id", "kind");
CREATE INDEX IF NOT EXISTS "billing_plan_item_plan_index" ON "billing_plan_item" ("plan_id");

CREATE TABLE IF NOT EXISTS "billing_order_item" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL REFERENCES "billing_order"("id") ON DELETE CASCADE,
	"kind" text NOT NULL,
	"credits" integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "billing_order_item_order_kind_index"
	ON "billing_order_item" ("order_id", "kind");
CREATE INDEX IF NOT EXISTS "billing_order_item_order_index" ON "billing_order_item" ("order_id");

-- Paket lama tetap dijual sebagai satuan dan diberi satu baris isi.
INSERT INTO "billing_plan" ("id", "code", "name", "description", "kind", "price_idr", "credits", "active", "sort_order")
VALUES
	('plan_lamaran', 'lamaran', 'Resume + Surat Lamaran per Lamaran', NULL, 'application', 5000, 1, true, 0),
	('plan_wawancara', 'wawancara', 'Sesi Latihan Wawancara', NULL, 'interview', 10000, 1, true, 1),
	('plan_mulai-cepat', 'mulai-cepat', 'Mulai Cepat', NULL, 'bundle', 15000, 12, true, 10),
	('plan_lamaran-3', 'lamaran-3', 'Paket Lamar 3', NULL, 'application', 12000, 3, true, 11),
	('plan_wawancara-3', 'wawancara-3', 'Paket Wawancara 3', NULL, 'interview', 22000, 3, true, 12),
	('plan_coach-20', 'coach-20', 'Paket Coach 20', NULL, 'coach', 8000, 20, true, 13),
	('plan_karier-lengkap', 'karier-lengkap', 'Karier Lengkap', NULL, 'bundle', 35000, 35, true, 14),
	('plan_karier-pro', 'karier-pro', 'Karier Pro', NULL, 'bundle', 49000, 58, true, 15)
ON CONFLICT ("code") DO UPDATE SET
	"name" = EXCLUDED."name",
	"kind" = EXCLUDED."kind",
	"price_idr" = EXCLUDED."price_idr",
	"credits" = EXCLUDED."credits",
	"active" = EXCLUDED."active",
	"sort_order" = EXCLUDED."sort_order";

UPDATE "billing_plan" SET "compare_at_idr" = 20000 WHERE "code" = 'mulai-cepat';
UPDATE "billing_plan" SET "compare_at_idr" = 15000 WHERE "code" = 'lamaran-3';
UPDATE "billing_plan" SET "compare_at_idr" = 30000 WHERE "code" = 'wawancara-3';
UPDATE "billing_plan" SET "compare_at_idr" = 10000 WHERE "code" = 'coach-20';
UPDATE "billing_plan" SET "compare_at_idr" = 50000 WHERE "code" = 'karier-lengkap';
UPDATE "billing_plan" SET "compare_at_idr" = 80000 WHERE "code" = 'karier-pro';

INSERT INTO "billing_plan_item" ("id", "plan_id", "kind", "credits")
SELECT 'ppi_' || p."code" || '_' || v."kind", p."id", v."kind", v."credits"
FROM "billing_plan" p
JOIN (
	VALUES
		('lamaran', 'application', 1),
		('wawancara', 'interview', 1),
		('mulai-cepat', 'application', 1),
		('mulai-cepat', 'interview', 1),
		('mulai-cepat', 'coach', 10),
		('lamaran-3', 'application', 3),
		('wawancara-3', 'interview', 3),
		('coach-20', 'coach', 20),
		('karier-lengkap', 'application', 3),
		('karier-lengkap', 'interview', 2),
		('karier-lengkap', 'coach', 30),
		('karier-pro', 'application', 5),
		('karier-pro', 'interview', 3),
		('karier-pro', 'coach', 50)
) AS v("code", "kind", "credits") ON p."code" = v."code"
ON CONFLICT ("plan_id", "kind") DO UPDATE SET "credits" = EXCLUDED."credits";
