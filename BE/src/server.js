const app = require("./app");
const startWeChoiceCron = require("./cron/wechoice.cron");

const candidateRoute = require("./routes/candidate.route");

app.use("/candidate", candidateRoute);

// Start cron
startWeChoiceCron();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});