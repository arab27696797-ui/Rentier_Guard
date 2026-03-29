-- CreateTable
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "username" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "languageCode" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "bannedAt" TIMESTAMP(3),
    "notificationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB DEFAULT '{}',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "bad_tenants" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "passportData" TEXT,
    "phoneNumber" TEXT,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contractDate" TEXT,
    "contractEndDate" TEXT,
    "debtAmount" DOUBLE PRECISION,

    CONSTRAINT "bad_tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "problem_history" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "claimText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "problem_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_telegramId_key" ON "users"("telegramId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bad_tenants_userId_idx" ON "bad_tenants"("userId");
CREATE INDEX IF NOT EXISTS "bad_tenants_userId_fullName_idx" ON "bad_tenants"("userId", "fullName");
CREATE INDEX IF NOT EXISTS "bad_tenants_reason_idx" ON "bad_tenants"("reason");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "problem_history_userId_idx" ON "problem_history"("userId");
CREATE INDEX IF NOT EXISTS "problem_history_userId_status_idx" ON "problem_history"("userId", "status");

-- AddForeignKey
ALTER TABLE "bad_tenants" ADD CONSTRAINT "bad_tenants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_history" ADD CONSTRAINT "problem_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
