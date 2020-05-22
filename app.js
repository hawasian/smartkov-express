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
      corpus: req.session.corpus,
      firstWord: req.session.firstWord,
    });
  } else {
    res.render("index", {
      title: "index",
      uname: req.session.uname || "Welcome",
      tweets: null,
    });
  }
});

app.get("/api/make_tweet", (req, res) => {
  let output = {};
  let len = req.query.length;
  if (!req.query.length || req.query.length <= 0) {
    len = 5;
  }
  if (req.session.firstWord && req.session.corpus) {
    output.tweet = makeTweet(
      req.session.firstWord,
      req.session.corpus,
      len - 1
    );
  } else {
    output.tweet = "SESSION DATA REQUIRED";
  }
  res.json(output);
});

app.post("/api/submit_user", (req, res) => {
  req.session.uname = req.body.uname;

  const options = {
    screen_name: `@${req.body.uname}`,
    tweet_mode: "extended",
    count: 10,
  };
  let corpus = { Count: 0 };
  let firstWord = { Count: 0 };
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

          firstWord.Count += 1;
          if (firstWord[words[0]]) {
            firstWord[words[0]].Count += 1;
          } else {
            firstWord[words[0]] = { Count: 1 };
          }

          for (let i = 0; i < words.length - 1; i++) {
            if (words[i].length < 1) {
              continue;
            }
            corpus.Count += 1;
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
        let output = { "init-list": firstWord, "word-list": corpus };
        req.session.corpus = corpus;
        req.session.firstWord = firstWord;
        req.session.tweets = tweetlist;
        res.json(output);
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

const getWord = (input) => {
  try {
    if (Object.entries(input).length < 3) {
      return false;
    }
  } catch {
    return false;
  }
  let selector = Math.floor(Math.random() * input.Count);
  for (let [key, value] of Object.entries(input)) {
    if (key != "Count" && key != "Value") {
      selector -= value.Count;
      if (selector < 0) {
        return key;
      }
    }
  }
};

const makeTweet = (first, src, length) => {
  let output = [];
  output.push(getWord(first));
  for (let i = 0; i < length; i++) {
    const nextWord = getWord(src[output[output.length - 1]]);
    if (nextWord) {
      output.push(nextWord);
    } else {
      break;
    }
  }
  console.log(output);
  return output;
};

const server = app.listen(port, () => {
  console.log(`app is running on port ${server.address().port} ....`);
});
