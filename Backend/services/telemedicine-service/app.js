const express = require("express");
const cors = require("cors");
const sessionRoutes = require("./src/routes/sessionRoutes");
const notFound = require("./src/middleware/notFound");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/sessions", sessionRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;