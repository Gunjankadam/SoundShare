const express = require("express")
const connectDb = require("./config/dbConnection");
const bcrypt = require("bcrypt");
const registerModel = require("./models/registerModel");
const initiallizePassport = require("./passport-config")
const dotenv = require("dotenv").config();
const serverless = require("serverless-http");
const flash = require("express-flash");
const session = require("express-session");
const passport = require("passport");
const initializePassport = require("./passport-config");
const methodOverride = require("method-override")
const errorhandler = require("./middleware/errorhandler");
const cors = require('cors');
const MongoStore = require("connect-mongo");
const axios = require("axios"); 

connectDb();
const app = express();
const router = express.Router();



initializePassport(
    passport
);



app.use(express.urlencoded({ extended: false }));

app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "soundshare_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.CONNECTION_STRING, // replace with your Mongo connection string
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 1000 * 60 * 10, // 10 mins
      secure: false, // true only for https
    },
  })
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));
app.use(require("./routes/userRoute"));
app.set("view engine", "ejs"); 
router.get("/", (req, res) => {
    res.send("App is running..");
});

// app.use("/.netlify/functions/app", router);
// module.exports.handler = serverless(app);
app.use(cors({
    origin: 'http://localhost:3000/', // Adjust for the frontend's URL
    methods: ['GET', 'POST'],
    credentials: true,
}));
app.use(errorhandler);
app.listen(3000, () => console.log("Server is running on port 3000"));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_BUCKET = "recordings";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const pingSupabase = async () => {
  try {
    const response = await axios.post(
      `${SUPABASE_URL}/storage/v1/object/list/${SUPABASE_BUCKET}`,
      {
        prefix: "",   // 👈 list files from root of bucket
        limit: 1      // only fetch 1 to keep it lightweight
      },
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Supabase ping successful:", new Date().toLocaleString());
  } catch (err) {
    console.error("⚠️ Supabase ping failed:", err.response?.data || err.message);
  }
};

// 6 days in milliseconds
const SIX_DAYS = 6 * 24 * 60 * 60 * 1000;
pingSupabase();
setInterval(pingSupabase, SIX_DAYS);
