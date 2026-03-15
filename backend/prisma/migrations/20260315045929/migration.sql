/*
  Warnings:

  - You are about to drop the column `allowedRoles` on the `channel` table. All the data in the column will be lost.
  - You are about to drop the column `readOnlyRoles` on the `channel` table. All the data in the column will be lost.
  - You are about to drop the column `permission` on the `organizationRole` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `organizationRole` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[organizationId,name]` on the table `organizationRole` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `organizationRole` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ChannelType" ADD VALUE 'DM';

-- DropIndex
DROP INDEX "organizationRole_organizationId_role_key";

-- AlterTable
ALTER TABLE "channel" DROP COLUMN "allowedRoles",
DROP COLUMN "readOnlyRoles",
ADD COLUMN     "categoryId" TEXT;

-- AlterTable
ALTER TABLE "member" ALTER COLUMN "role" SET DEFAULT 'member';

-- AlterTable
ALTER TABLE "organizationRole" DROP COLUMN "permission",
DROP COLUMN "role",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY['SEND_MESSAGES', 'VIEW_CHANNELS']::TEXT[],
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'OFFLINE';

-- CreateTable
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberRole" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "memberRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channelPermissionOverride" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "roleId" TEXT,
    "memberId" TEXT,
    "allow" TEXT[],
    "deny" TEXT[],

    CONSTRAINT "channelPermissionOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channelMember" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channelMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readReceipt" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "readReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "memberRole_memberId_roleId_key" ON "memberRole"("memberId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "channelMember_channelId_memberId_key" ON "channelMember"("channelId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "readReceipt_messageId_memberId_key" ON "readReceipt"("messageId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "organizationRole_organizationId_name_key" ON "organizationRole"("organizationId", "name");

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberRole" ADD CONSTRAINT "memberRole_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberRole" ADD CONSTRAINT "memberRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "organizationRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channelPermissionOverride" ADD CONSTRAINT "channelPermissionOverride_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channelPermissionOverride" ADD CONSTRAINT "channelPermissionOverride_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "organizationRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channelPermissionOverride" ADD CONSTRAINT "channelPermissionOverride_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel" ADD CONSTRAINT "channel_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channelMember" ADD CONSTRAINT "channelMember_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channelMember" ADD CONSTRAINT "channelMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "readReceipt" ADD CONSTRAINT "readReceipt_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "readReceipt" ADD CONSTRAINT "readReceipt_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
