-- CreateTable
CREATE TABLE "PausedSession" (
    "mac" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "pausedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);
