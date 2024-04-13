import express from "express";
import passport from "passport";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import dotenv from "dotenv";

dotenv.config({ path: "./config/.env" });

const router = express.Router();

// Express session middleware
router.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// Passport middleware
router.use(passport.initialize());
router.use(passport.session());

// Google OAuth2 strategy
passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/main",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    (accessToken, refreshToken, profile, done) => {
      // This is where you would typically save the user to a database
      return done(null, profile);
    }
  )
);

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Google authentication route
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google authentication callback
router.get(
  "/auth/google/main",
  passport.authenticate("google", {
    successRedirect: "/main",
    failureRedirect: "/login",
  })
);

// Profile route after successful authentication
router.get("/main", (req, res) => {
  res.send(req.user.email);
});

export default router;
