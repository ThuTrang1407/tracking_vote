const { updateSnapshot } = require("../services/snapshot.service");

exports.update = async (req, res) => {
  try {
    // Kiểm tra API Key
    if (req.headers["x-api-key"] !== process.env.SNAPSHOT_SECRET) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await updateSnapshot();

    return res.json({
      success: true,
      message: "Snapshot updated successfully",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};