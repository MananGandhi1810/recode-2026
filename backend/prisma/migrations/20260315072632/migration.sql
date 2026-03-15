/*
  Warnings:

  - A unique constraint covering the columns `[joinCode]` on the table `organization` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "organization" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "joinCode" TEXT;

-- CreateTable
CREATE TABLE "workspaceEmoji" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspaceEmoji_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspaceEmoji_organizationId_name_key" ON "workspaceEmoji"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "organization_joinCode_key" ON "organization"("joinCode");

-- AddForeignKey
ALTER TABLE "workspaceEmoji" ADD CONSTRAINT "workspaceEmoji_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
