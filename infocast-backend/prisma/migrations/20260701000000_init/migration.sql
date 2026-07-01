-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "infocast";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "infocast"."InfoCategory" AS ENUM ('GUIDELINE_CHANGE', 'SCHEDULE', 'COMPETITION_RATE', 'POLICY_NEWS', 'BRIEFING', 'DEADLINE', 'NEW_ADMISSION');

-- CreateEnum
CREATE TYPE "infocast"."ItemStatus" AS ENUM ('DRAFT', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "infocast"."Channel" AS ENUM ('KAKAO', 'SMS', 'PUSH', 'EMAIL');

-- CreateEnum
CREATE TYPE "infocast"."DeliveryStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "infocast"."Frequency" AS ENUM ('REALTIME', 'DAILY', 'WEEKLY');

-- CreateTable
CREATE TABLE "infocast"."ic_info_item" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" "infocast"."InfoCategory" NOT NULL,
    "source" TEXT,
    "url" TEXT,
    "target_tags" JSONB NOT NULL DEFAULT '{}',
    "published_at" TIMESTAMP(3),
    "deadline_at" TIMESTAMP(3),
    "status" "infocast"."ItemStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ic_info_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infocast"."ic_info_embedding" (
    "info_item_id" UUID NOT NULL,
    "embedding" vector(768),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ic_info_embedding_pkey" PRIMARY KEY ("info_item_id")
);

-- CreateTable
CREATE TABLE "infocast"."ic_subscription" (
    "id" UUID NOT NULL,
    "member_id" TEXT NOT NULL,
    "interests" JSONB NOT NULL DEFAULT '{}',
    "channels" JSONB NOT NULL DEFAULT '{}',
    "frequency" "infocast"."Frequency" NOT NULL DEFAULT 'DAILY',
    "quiet_start" INTEGER,
    "quiet_end" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ic_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infocast"."ic_delivery" (
    "id" UUID NOT NULL,
    "member_id" TEXT NOT NULL,
    "info_item_id" UUID NOT NULL,
    "channel" "infocast"."Channel" NOT NULL,
    "status" "infocast"."DeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "matched_score" DOUBLE PRECISION,
    "sent_at" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ic_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infocast"."ic_match_log" (
    "id" UUID NOT NULL,
    "run_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "items_count" INTEGER NOT NULL DEFAULT 0,
    "match_count" INTEGER NOT NULL DEFAULT 0,
    "meta" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "ic_match_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ic_info_item_category_status_idx" ON "infocast"."ic_info_item"("category", "status");

-- CreateIndex
CREATE INDEX "ic_info_item_deadline_at_idx" ON "infocast"."ic_info_item"("deadline_at");

-- CreateIndex
CREATE INDEX "ic_info_item_published_at_idx" ON "infocast"."ic_info_item"("published_at");

-- CreateIndex
CREATE UNIQUE INDEX "ic_subscription_member_id_key" ON "infocast"."ic_subscription"("member_id");

-- CreateIndex
CREATE INDEX "ic_delivery_member_id_status_idx" ON "infocast"."ic_delivery"("member_id", "status");

-- CreateIndex
CREATE INDEX "ic_delivery_info_item_id_idx" ON "infocast"."ic_delivery"("info_item_id");

-- AddForeignKey
ALTER TABLE "infocast"."ic_info_embedding" ADD CONSTRAINT "ic_info_embedding_info_item_id_fkey" FOREIGN KEY ("info_item_id") REFERENCES "infocast"."ic_info_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infocast"."ic_delivery" ADD CONSTRAINT "ic_delivery_info_item_id_fkey" FOREIGN KEY ("info_item_id") REFERENCES "infocast"."ic_info_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

