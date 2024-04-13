import express from "express";
import passport from "passport";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import dotenv from "dotenv";
import { verify_email_DB } from "./db_functions.js";

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
router.get("/main", async (req, res) => {
  //   console.log(req.user);
  if (req.isAuthenticated()) {
    let email = req.user.email;
    let picture = req.user.picture;

    let type = await verify_email_DB(email, picture);
    // console.log(type);
    if (type) {
      res.render("index.ejs", { type: type, profile_pic: picture });
    } else {
      res.render("login.ejs", { error: "Not authenticated person" });
    }
  } else {
    res.render("login.ejs");
  }
});

router.get("/login", (req, res) => {
  res.render("login.ejs");
});

export default router;
