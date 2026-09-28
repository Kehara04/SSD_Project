require("dotenv").config();
const app = require("./app");
const internalApp = require("./internalApp");
const { getInternalSecret } = require("./utils/internalServiceAuth");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5001;
const INTERNAL_PORT = process.env.INTERNAL_PORT || 5011;

// Refuse to start with an absent or placeholder service credential.
getInternalSecret();

connectDB();

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});

internalApp.listen(INTERNAL_PORT, () => {
  console.log(`Auth internal API running on port ${INTERNAL_PORT}`);
});
