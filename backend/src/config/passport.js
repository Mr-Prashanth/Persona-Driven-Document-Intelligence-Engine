// backend/config/passport.js
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const prisma = require("./db"); // your existing Prisma client export

// We do not use sessions, so no serializeUser/deserializeUser

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    // Google verify callback
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        const googleId = profile.id;
        const name = profile.displayName || profile.name?.givenName || null;

        if (!email) {
          return done(null, false, { message: "Google account has no email" });
        }

        // Try to find user by googleId first
        let user = await prisma.user.findUnique({ where: { googleId } });

        if (!user) {
          // If not found by googleId, try by email (link accounts)
          const byEmail = await prisma.user.findUnique({ where: { email } });

          if (byEmail) {
            // Link googleId if not already linked
            user = await prisma.user.update({
              where: { email },
              data: {
                googleId,
                // Keep existing name if present, else set
                name: byEmail.name || name,
              },
            });
          } else {
            // Create new account (Google sign-up)
            user = await prisma.user.create({
              data: {
                email,
                googleId,
                name,
                // password stays null for Google-only accounts
              },
            });
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

module.exports = passport;
