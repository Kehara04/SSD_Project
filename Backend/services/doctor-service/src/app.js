const express = require("express");
const cors = require("cors");
const morgan = require("morgan");


const doctorRoutes = require("./routes/doctorRoutes");
const internalRoutes = require("./routes/internalRoutes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({ message: "Doctor Service Running" });
});

app.use("/api/doctors", doctorRoutes);
app.use("/api/internal", internalRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;