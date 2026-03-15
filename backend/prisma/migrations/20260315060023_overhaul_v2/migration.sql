/*
  Warnings:

  - The values [FORUM,DM] on the enum `ChannelType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `editedAt` on the `message` table. All the data in the column will be lost.
  - You are about to drop the column `threadId` on the `message` table. All the data in the column will be lost.
  - You are about to drop the `channelPermissionOverride` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `thread` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `channelId` on table `message` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ChannelType_new" AS ENUM ('TEXT', 'VOICE');
ALTER TABLE "public"."channel" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "channel" ALTER COLUMN "type" TYPE "ChannelType_new" USING ("type"::text::"ChannelType_new");
ALTER TYPE "ChannelType" RENAME TO "ChannelType_old";
ALTER TYPE "ChannelType_new" RENAME TO "ChannelType";
DROP TYPE "public"."ChannelType_old";
ALTER TABLE "channel" ALTER COLUMN "type" SET DEFAULT 'TEXT';
COMMIT;

-- DropForeignKey
ALTER TABLE "channelPermissionOverride" DROP CONSTRAINT "channelPermissionOverride_channelId_fkey";

-- DropForeignKey
ALTER TABLE "channelPermissionOverride" DROP CONSTRAINT "channelPermissionOverride_memberId_fkey";

-- DropForeignKey
ALTER TABLE "channelPermissionOverride" DROP CONSTRAINT "channelPermissionOverride_roleId_fkey";

-- DropForeignKey
ALTER TABLE "message" DROP CONSTRAINT "message_threadId_fkey";

-- DropForeignKey
ALTER TABLE "thread" DROP CONSTRAINT "thread_authorId_fkey";

-- DropForeignKey
ALTER TABLE "thread" DROP CONSTRAINT "thread_channelId_fkey";

-- DropForeignKey
ALTER TABLE "thread" DROP CONSTRAINT "thread_parentMessageId_fkey";

-- DropIndex
DROP INDEX "message_threadId_idx";

-- AlterTable
ALTER TABLE "message" DROP COLUMN "editedAt",
DROP COLUMN "threadId",
ADD COLUMN     "parentMessageId" TEXT,
ALTER COLUMN "channelId" SET NOT NULL;

-- DropTable
DROP TABLE "channelPermissionOverride";

-- DropTable
DROP TABLE "thread";

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_parentMessageId_fkey" FOREIGN KEY ("parentMessageId") REFERENCES "message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
