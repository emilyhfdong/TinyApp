var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
var express = require('express')
var cookieParser = require('cookie-parser');
let errors = {};

var app = express()
app.use(cookieParser())

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

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
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


//GET url index page
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

//GET new url form page
app.get("/urls/new", (req, res) => {
  templateVars = {username: req.cookies["username"], errors: errors};
  res.render("urls_new", templateVars);
});

//POST new url (from new url page)
app.post("/urls", (req, res) => {
  if (!req.body.longURL) {
    errors.emptyURL = 1;
    res.redirect("http://localhost:8080/urls/new/");
  } else {
    let newShort = generateRandomString();
    while (urlDatabase[newShort]) {
      newShort = generateRandomString;
    }
    urlDatabase[newShort] = req.body.longURL;
    errors.emptyURL = 0;

    res.redirect("http://localhost:8080/urls/" + newShort);
  }
});

//GET show/edit existing short URL page
app.get("/urls/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).render("404");
  } else {
    let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"]};
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

//POST login to cookies
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("http://localhost:8080/urls/");
});

//POST logout
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("http://localhost:8080/urls/");
});

//GET register form page
app.get("/register", (req, res) => {
  templateVars = {username: req.cookies["username"], errors: errors};
  res.render("register", templateVars)

})

//POST register
app.post("/register", (req, res) => {
  let userID = generateRandomString();
  let emails = [];

  for (user in users) {
    emails.push(users[user]['email']);
  }

  if (req.body.email && req.body.password && !emails.includes(req.body.email)) {
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: req.body.password
    }
    errors.emptyEmail = 0;
    errors.emptyPassword = 0;
    res.cookie("user_id", userID);
    res.redirect("http://localhost:8080/urls/")
  } else {
    if (!req.body.email) {
      errors.emptyEmail = 1;
    }
    if (!req.body.password){
      errors.emptyPassword = 1;
    }
    if (emails.includes(req.body.email)) {
      errors.alreadyEmail = 1;
    }
    res.redirect("http://localhost:8080/register");

  }

})





