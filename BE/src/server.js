const app = require("./app");
const startWeChoiceCron = require("./cron/wechoice.cron");

const candidateRoute = require("./routes/candidate.route");

app.use("/candidate", candidateRoute);

const snapshotRoute = require("./routes/snapshot.route");

app.use("/snapshot", snapshotRoute);

// Start cron
startWeChoiceCron();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});