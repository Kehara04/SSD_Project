require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5002;

connectDB();

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});