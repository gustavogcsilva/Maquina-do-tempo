ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "phone_number" TEXT,
    ADD COLUMN IF NOT EXISTS "whatsapp_consent_at" TIMESTAMP(3);

ALTER TABLE "capsules"
    ADD COLUMN IF NOT EXISTS "scope" TEXT NOT NULL DEFAULT 'pessoal',
    ADD COLUMN IF NOT EXISTS "theme" TEXT NOT NULL DEFAULT 'amor',
    ADD COLUMN IF NOT EXISTS "mood" TEXT,
    ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'Média',
    ADD COLUMN IF NOT EXISTS "action_items" JSONB NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
    CREATE TYPE "CapsuleDeliveryChannel" AS ENUM ('EMAIL', 'WHATSAPP');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
    CREATE TYPE "CapsuleDeliveryStatus" AS ENUM ('SCHEDULED', 'READY', 'SENT', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END;
$$;

CREATE TABLE IF NOT EXISTS "capsule_deliveries" (
    "id" TEXT NOT NULL,
    "capsule_id" TEXT NOT NULL,
    "channel" "CapsuleDeliveryChannel" NOT NULL,
    "status" "CapsuleDeliveryStatus" NOT NULL DEFAULT 'SCHEDULED',
    "recipient" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capsule_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "capsule_deliveries_capsule_id_channel_key"
    ON "capsule_deliveries"("capsule_id", "channel");
CREATE INDEX IF NOT EXISTS "capsule_deliveries_status_scheduled_at_idx"
    ON "capsule_deliveries"("status", "scheduled_at");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'capsule_deliveries_capsule_id_fkey'
          AND conrelid = 'capsule_deliveries'::regclass
    ) THEN
        ALTER TABLE "capsule_deliveries"
        ADD CONSTRAINT "capsule_deliveries_capsule_id_fkey"
        FOREIGN KEY ("capsule_id") REFERENCES "capsules"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END;
$$;
