-- CreateTable
CREATE TABLE "Candidate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "voteCount" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL
);
