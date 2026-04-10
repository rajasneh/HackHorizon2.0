import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { eq, or } from "drizzle-orm";
import { db } from "./db.js";
import { users } from "../drizzle/userSchema.js";
import { organiser } from "../drizzle/organiserSchema.js";
import { admins } from "../drizzle/adminSchema.js";

import dotenv from "dotenv";
dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const username = profile.displayName;
        const profilePicture = profile.photos?.[0]?.value || null;

        if (!email) {
          return done(new Error("No email found in Google profile"), null);
        }

        // ❌ Reject if email is in organiser table
        const existingOrganiser = await db
          .select()
          .from(organiser)
          .where(eq(organiser.email, email));

        if (existingOrganiser.length > 0) {
          return done(null, false, { message: "This email is registered as an organiser. Please use organiser login." });
        }

        // ❌ Reject if email is in admin table
        const existingAdmin = await db
          .select()
          .from(admins)
          .where(eq(admins.email, email));

        if (existingAdmin.length > 0) {
          return done(null, false, { message: "This email is registered as an admin. Please use admin login." });
        }

        // ✅ Proceed if user is not in organiser/admin
        const existingUser = await db
          .select()
          .from(users)
          .where(or(eq(users.googleId, googleId), eq(users.email, email)));

        let user = existingUser[0];

        if (!user) {
          await db.insert(users).values({
            name: username,
            email,
            profilePic: profilePicture,
            googleId
          });

          const newUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email));

          user = newUser[0];
        }

        return done(null, user);

      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;
