var express = require("express");
var app = express();
var PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

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

//GET home page
app.get("/", (req, res) => {
  res.end("Hello!");
});

//GET json
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//GET hello page
app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

//GET url index page
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

//GET new url form page
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//POST new url (from new url page)
app.post("/urls", (req, res) => {
  let newShort = generateRandomString();
  while (urlDatabase[newShort]) {
    newShort = generateRandomString;
  }
  urlDatabase[newShort] = req.body.longURL;

  res.redirect("http://localhost:8080/urls/" + newShort);
});

//GET show/edit existing short URL page
app.get("/urls/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).render("404");
  } else {
    let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
    res.render("urls_show", templateVars);
  }
});

//GET redirected long URL from shortURL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).render("404");
  } else {
    res.status(301);
    res.redirect(longURL);
  }
});

//DELETE url (from url index page)
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("http://localhost:8080/urls/");

});

//UPDATE url (from show URL page)
app.post("/urls/:id/", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("http://localhost:8080/urls/");

});





