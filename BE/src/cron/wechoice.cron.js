const cron = require("node-cron");
const { updateSnapshot } = require("../services/snapshot.service");

function startWeChoiceCron() {
  updateSnapshot();

  cron.schedule("*/5 * * * *", updateSnapshot);
}

module.exports = startWeChoiceCron;