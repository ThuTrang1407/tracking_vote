const prisma = require("../config/prisma");

async function upsertCandidates(list) {
  for (const item of list) {
    await prisma.candidate.upsert({
      where: { id: item.id },
      update: {
        voteCount: item.voteCount,
      },
      create: {
        id: item.id,
        voteCount: item.voteCount,
        name: null,
      },
    });
  }
}

module.exports = { upsertCandidates };