-- CreateTable
CREATE TABLE "Candidate" (
    "id" INTEGER NOT NULL,
    "name" TEXT,
    "voteCount" INTEGER NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoteSnapshot" (
    "id" SERIAL NOT NULL,
    "candidateId" INTEGER NOT NULL,
    "voteCount" INTEGER NOT NULL,
    "snapshotTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoteSnapshot_pkey" PRIMARY KEY ("id")
);
