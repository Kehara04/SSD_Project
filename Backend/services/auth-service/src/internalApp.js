const express = require("express");
const internalRoutes = require("./routes/internalRoutes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();
app.use(express.json());
app.use("/api/internal", internalRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
