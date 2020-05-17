const express = require("express");
const path = require("path"); // Module for lazy url concat
const bodyParser = require("body-parser");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const app = express(); // Instantiate express to app var
const port = process.env.PORT || 4242;
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index", {
    title: "index",
  });
});

const server = app.listen(port, () => {
  console.log(`app is running on port ${server.address().port} ....`);
});
