const cron = require("node-cron");
const prisma = require("../config/prisma");
const { fetchWeChoiceVotes } = require("../services/wechoice.service");

function getRounded5MinTime(date) {
  const ms = 1000 * 60 * 5;
  return new Date(Math.floor(date.getTime() / ms) * ms);
}

async function syncWeChoice() {
  try {
    console.log("📥 Fetching WeChoice data...");

    const data = await fetchWeChoiceVotes();

    const now = getRounded5MinTime(new Date()); // ⭐ QUAN TRỌNG

    for (const item of data) {
      // 1. update candidate (latest)
      await prisma.candidate.upsert({
        where: { id: item.id },
        update: { voteCount: item.voteCount },
        create: {
          id: item.id,
          voteCount: item.voteCount,
        },
      });

      // 2. save snapshot (timeline)
      await prisma.voteSnapshot.create({
        data: {
          candidateId: item.id,
          voteCount: item.voteCount,
          snapshotTime: now,
        },
      });
    }

    console.log("✅ Snapshot saved:", data.length);
  } catch (err) {
    console.error("❌ Cron error:", err);
  }
}

function startWeChoiceCron() {
  syncWeChoice();

  cron.schedule("*/5 * * * *", syncWeChoice);
}

module.exports = startWeChoiceCron;