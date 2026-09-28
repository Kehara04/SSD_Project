const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5007;

connectDB();

app.listen(PORT, () =>
  console.log(`Notification Service running on port ${PORT}`)
);
