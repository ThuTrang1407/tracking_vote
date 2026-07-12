const app = require("./app");
const startWeChoiceCron = require("./cron/wechoice.cron");

const candidateRoute = require("./routes/candidate.route");

app.use("/candidate", candidateRoute);

// start cron
startWeChoiceCron();

app.listen(3000, () => {
  console.log("Server running http://localhost:3000");
});