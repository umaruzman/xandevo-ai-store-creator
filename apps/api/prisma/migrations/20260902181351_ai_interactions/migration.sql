-- CreateTable
CREATE TABLE "ai_interactions" (
    "id" UUID NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "attempt" INTEGER NOT NULL,
    "repaired" BOOLEAN NOT NULL DEFAULT false,
    "parseOk" BOOLEAN NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "responseRaw" TEXT,
    "parseErrors" JSONB,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "cacheReadTokens" INTEGER,
    "cacheWriteTokens" INTEGER,
    "latencyMs" INTEGER,
    "costUsd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_interactions_userId_createdAt_idx" ON "ai_interactions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_interactions_requestId_idx" ON "ai_interactions"("requestId");
