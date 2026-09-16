const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5004;

connectDB();

app.listen(PORT, () => {
  console.log(`Telemedicine Service running on port ${PORT}`);
});