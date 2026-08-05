require("dotenv").config();

const { updateSnapshot } = require("../src/services/snapshot.service");

async function main() {
  try {
    console.log("🚀 Start snapshot job");

    await updateSnapshot();

    console.log("✅ Job completed");
    process.exit(0);
  } catch (err) {
    console.error("❌ Job failed");
    console.error(err);
    process.exit(1);
  }
}

main();