const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const paymentRoutes = require("./routes/paymentRoutes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(morgan("dev"));

// Stripe webhook needs raw body — must be before express.json()
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Payment Service Running" });
});

app.use("/api/payments", paymentRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
