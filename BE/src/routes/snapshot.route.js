const express = require("express");
const prisma = require("../config/prisma");
// const { groupByInterval } = require("../utils/snapshot.util");

const router = express.Router();

const groupByInterval = (data, interval) => {
  const map = {};

  data.forEach((snap) => {
    const date = new Date(snap.snapshotTime);
    let rounded = new Date(date);

    switch (interval) {
      case "15m":
        rounded.setMinutes(Math.floor(date.getMinutes() / 15) * 15);
        break;
      case "1h":
        rounded.setMinutes(0);
        break;
      case "6h":
        rounded.setHours(Math.floor(date.getHours() / 6) * 6);
        rounded.setMinutes(0);
        break;
      case "1d":
        rounded.setHours(0);
        rounded.setMinutes(0);
        break;
    }

    rounded.setSeconds(0);
    rounded.setMilliseconds(0);

    const key = rounded.toISOString();

    if (!map[key]) {
      map[key] = { snapshotTime: key, votes: {} };
    }

    const cid = snap.candidateId;
    map[key].votes[cid] = (map[key].votes[cid] || 0) + Number(snap.voteCount || 0);
  });

  return map;
};

// ====================== ROUTE ======================
router.get("/timeline", async (req, res) => {
  try {
    const { interval = "15m", limit = 20 } = req.query;

    // Lấy tất cả candidates để biết danh sách đầy đủ
    const candidates = await prisma.candidate.findMany({
      select: { id: true, name: true },
    });

    const candidateIds = candidates.map(c => c.id);

    // Lấy dữ liệu snapshot
    const snapshots = await prisma.voteSnapshot.findMany({
      orderBy: { snapshotTime: "asc" },
      select: {
        candidateId: true,
        voteCount: true,
        snapshotTime: true,
      },
    });

    const grouped = groupByInterval(snapshots, interval);

    let timeGroups = Object.values(grouped)
      .sort((a, b) => new Date(a.snapshotTime) - new Date(b.snapshotTime))
      .slice(-Number(limit));

    // Tạo kết quả đầy đủ: mọi time slot đều có tất cả candidates
    const result = [];

    timeGroups.forEach((group) => {
      candidateIds.forEach((cid) => {
        result.push({
          candidateId: cid,
          voteCount: group.votes[cid] || 0,        // ← Quan trọng: mặc định 0
          snapshotTime: group.snapshotTime,
        });
      });
    });

    res.json(result);
  } catch (err) {
    console.error("Timeline API Error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;