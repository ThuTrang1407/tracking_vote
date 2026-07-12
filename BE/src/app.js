const express = require("express");
const cors = require("cors");

const candidateRoute = require("./routes/candidate.route");
const snapshotRoute = require("./routes/snapshot.route");

const app = express();

app.use(cors());
app.use(express.json());

// routes
app.use("/candidate", candidateRoute);
app.use("/snapshot", snapshotRoute);

module.exports = app;