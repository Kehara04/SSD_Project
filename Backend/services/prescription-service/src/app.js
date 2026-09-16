const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const prescriptionRoutes = require("./routes/prescriptionRoutes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({ message: "Prescription Service Running" });
});

app.use("/api/prescriptions", prescriptionRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;