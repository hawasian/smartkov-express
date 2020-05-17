const express = require("express");
const path = require("path"); // Module for lazy url concat
const bodyParser = require("body-parser");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const { body, validationResult } = require("express-validator/check");
const { sanitizeBody } = require("express-validator/filter");

const app = express(); // Instantiate express to app var
const port = process.env.PORT || 4242;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: "Shh, its a secret!" }));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index", {
    title: "index",
    uname: req.session.uname || "World",
  });
});

app.post("/submit_user", (req, res) => {
  req.session.uname = req.body.uname;
  res.redirect("/");
});
const server = app.listen(port, () => {
  console.log(`app is running on port ${server.address().port} ....`);
});
