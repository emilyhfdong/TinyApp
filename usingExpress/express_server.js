var express = require("express");
var app = express();
var PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

function generateRandomString() {
  const lettersAndNums = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
  var str = '';
  for (let i = 0; i < 6; i ++) {
    str += lettersAndNums[Math.floor(Math.random() * (61))];
  }
  return str;
}


var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  let newShort = generateRandomString();
  urlDatabase[newShort] = req.body.longURL;

  res.redirect("http://localhost:8080/urls/" + newShort);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id]};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  if (!urlDatabase[req.params.shortURL]) {
    res.status(400);
    res.send('shortened URL does not exist');
  } else {
    res.status(301);
    res.redirect(longURL);
  }
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("http://localhost:8080/urls/");

});

app.post("/urls/:id/", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("http://localhost:8080/urls/");

});





app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});