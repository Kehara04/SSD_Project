
const { OAuth2Client } = require("google-auth-library");

// Create a Google OAuth client using the configured credentials.
function googleClient() {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL,
  } = process.env;

  // Do not allow authentication to start with missing configuration.
  if (
    !GOOGLE_CLIENT_ID ||
    !GOOGLE_CLIENT_SECRET ||
    !GOOGLE_CALLBACK_URL
  ) {
    throw new Error(
      "Google OIDC credentials/callback are not configured"
    );
  }

  return new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL
  );
}

module.exports = { googleClient };
