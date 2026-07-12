const express = require("express");
const prisma = require("../config/prisma");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { id, name, voteCount } = req.body;

    const candidate = await prisma.candidate.create({
      data: {
        id,
        name,
        voteCount,
      },
    });

    res.status(201).json(candidate);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message,
    });
  }
});

// router.get("/", async (req, res) => {
//   try {
//     const count = await prisma.candidate.count();
//     console.log("Candidate count:", count);

//     const candidates = await prisma.candidate.findMany({
//       orderBy: {
//         voteCount: "desc",
//       },
//     });

//     console.log(candidates);

//     res.json(candidates);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// });

router.get("/", async (req, res) => {
  try {
    const candidates = await prisma.candidate.findMany({
      orderBy: {
        id: "asc",
      },
    });

    res.json(candidates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;