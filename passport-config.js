const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const registerModel = require("./models/registerModel");

function initialize(passport) {
  const authenticateUser = async (req, email, password, done) => {
    try {
      const user = await registerModel.findOne({ email });
      if (!user) return done(null, false, { message: "No user found with that email" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return done(null, false, { message: "Incorrect password" });

      // ✅ Save username in session
      req.session.username = user.username;

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  };

  // ✅ Note passReqToCallback: true is needed to access req.session
  passport.use(new LocalStrategy({ usernameField: "email", passReqToCallback: true }, authenticateUser));

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await registerModel.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}

module.exports = initialize;
