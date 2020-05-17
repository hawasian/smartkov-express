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

const CORPUS_SIZE = 20;

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
    count: 10,
  };
  let corpus = [];
  let tweetlist = [];
  const callback = (err, data) => {
    if (!err) {
      data.forEach((tweet) => {
        if (!tweet.retweeted_status) {
          const tweetRaw = tweet.full_text;
          let newTweet = tweetRaw.split("http")[0].trim();
          newTweet = newTweet.replace(
            /[^abcdefghijklmnopqrstuvwxyz1234567890\'\s\@\#]/gi,
            ""
          );
          newTweet = newTweet.toLowerCase();
          const words = newTweet.split(" ");
          for (let i = 0; i < words.length - 1; i++) {
            if (words[i].length < 1) {
              continue;
            }
            if (corpus[words[i]]) {
              corpus[words[i]].Count += 1;
              if (corpus[words[i]][words[i + 1]]) {
                corpus[words[i]][words[i + 1]].Count += 1;
              } else {
                corpus[words[i]][words[i + 1]] = {
                  Count: 1,
                  Word: String(words[i + 1]),
                };
              }
            } else {
              corpus[words[i]] = { Count: 1, Value: String(words[i]) };
              if (corpus[words[i]][words[i + 1]]) {
                corpus[words[i]][words[i + 1]].Count += 1;
              } else {
                corpus[words[i]][words[i + 1]] = {
                  Count: 1,
                  Value: String(words[i + 1]),
                };
              }
            }
          }
          tweetlist.push(newTweet);
        }
        options.max_id = tweet.id;
      });
      if (tweetlist.length < CORPUS_SIZE) {
        getStatus();
      } else {
        req.session.tweets = tweetlist;
        let output = [];
        let starter = Math.floor(Math.random() * Object.keys(corpus).length);
        let x = Object.keys(corpus)[starter];
        output.push(x);
        starter = Math.floor(Math.random() * corpus[x].Count);
        let y = Object.keys(corpus[x]);
        console.log(corpus);
        res.redirect("/");
      }
    } else {
      console.log(err);
    }
  };
  const getStatus = () => {
    T.get("statuses/user_timeline", options, callback);
  };
  T.get("users/show", { screen_name: req.body.uname }, (err, data) => {
    req.session.tweets = null;
    if (!err) {
      getStatus();
    } else {
      console.log(err);
      res.redirect("/");
    }
  });
});

const server = app.listen(port, () => {
  console.log(`app is running on port ${server.address().port} ....`);
});
