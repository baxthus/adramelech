-- CreateIndex
CREATE INDEX "feedbacks_profileId_idx" ON "feedbacks"("profileId");

-- CreateIndex
CREATE INDEX "feedbacks_status_idx" ON "feedbacks"("status");

-- CreateIndex
CREATE INDEX "feedbacks_createdAt_idx" ON "feedbacks"("createdAt");

-- CreateIndex
CREATE INDEX "phrases_createdAt_idx" ON "phrases"("createdAt");

-- CreateIndex
CREATE INDEX "profiles_discordId_idx" ON "profiles"("discordId");

-- CreateIndex
CREATE INDEX "profiles_createdAt_idx" ON "profiles"("createdAt");

-- CreateIndex
CREATE INDEX "socials_profileId_idx" ON "socials"("profileId");

-- CreateIndex
CREATE INDEX "socials_name_idx" ON "socials"("name");
