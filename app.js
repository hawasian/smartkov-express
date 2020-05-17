const express = require("express");
const path = require("path"); // Module for lazy url concat
const bodyParser = require("body-parser");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");
const Twitter = require("twitter");
//const config = require("./config.js");
let config;
try {
  config = require("./config.js");
} catch (e) {
  config = {
    consumer_key: process.env.consumer_key,
    consumer_secret: process.env.consumer_secret,
    access_token_key: process.env.access_token_key,
    access_token_secret: process.env.access_token_secret,
  };
}
const app = express(); // Instantiate express to app var
const port = process.env.PORT || 4242;
const T = new Twitter(config);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: "Shh, its a secret!" }));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  if (req.session.tweets) {
    res.render("index", {
      title: "index",
      uname: req.session.uname || "Welcome",
      tweets: req.session.tweets,
      temp: req.session.temp,
    });
  } else {
    res.render("index", {
      title: "index",
      uname: req.session.uname || "Welcome",
      tweets: null,
    });
  }
});

app.post("/api/submit_user", (req, res) => {
  req.session.uname = req.body.uname;

  const options = {
    screen_name: `@${req.body.uname}`,
    tweet_mode: "extended",
    count: 2,
  };
  let tweetlist = [];
  const callback = (err, data) => {
    if (!err) {
      //console.log(data);
      data.forEach((tweet) => {
        if (!tweet.retweeted_status) {
          tweetlist.push(tweet.full_text);
          console.log(tweet);
        }
      });
      req.session.tweets = tweetlist;
      res.redirect("/");
    } else {
      console.log(err);
    }
  };
  T.get("statuses/user_timeline", options, callback);
});

const server = app.listen(port, () => {
  console.log(`app is running on port ${server.address().port} ....`);
});
