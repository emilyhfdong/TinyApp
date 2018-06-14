var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
var express = require('express')
var cookieParser = require('cookie-parser');
let errors = {};
let emails = [];
let passwords = [];
let ids = [];

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
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  }
};

function urlsForUser(id) {
  let databaseForID = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL]['userID'] === id) {
      databaseForID[shortURL] = {
        longURL: urlDatabase[shortURL]['longURL'],
        userID: id
      }
    }
  }
  return databaseForID;
}

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
  if (!req.cookies["user_id"]) {
    res.render("pleaseLogin", {user: users[req.cookies["user_id"]]})
  } else {
    let templateVars = { urls: urlsForUser(req.cookies["user_id"]), user: users[req.cookies["user_id"]] };
    res.render("urls_index", templateVars);
  }
});

//GET new url form page
app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/login")
  } else {
    templateVars = {user: users[req.cookies["user_id"]], errors: errors};
    res.render("urls_new", templateVars);
  }
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
    urlDatabase[newShort] = {
      longURL: req.body.longURL,
      userID: req.cookies["user_id"]
    };
    errors.emptyURL = 0;
    console.log(urlDatabase);
    res.redirect("http://localhost:8080/urls/" + newShort);
  }
});

//GET show/edit existing short URL page
app.get("/urls/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).render("404");
  } else if (!req.cookies["user_id"] || urlDatabase[req.params.shortURL]["userID"] !== req.cookies["user_id"]) {
    res.render("pleaseLogin", {user: users[req.cookies["user_id"]]});
  } else {
    let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]['longURL'], user: users[req.cookies["user_id"]]};
    res.render("urls_show", templateVars);
  }


});

//GET redirected long URL from shortURL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL]['longURL'];
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).render("404");
  } else {
    res.status(301);
    res.redirect(longURL);
  }
});

//DELETE url (from url index page)
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.cookies["user_id"] === urlDatabase[req.params.shortURL]['userID']) {
      delete urlDatabase[req.params.shortURL];
  }
  res.redirect("http://localhost:8080/urls/");

});

//EDIT url (from show URL page)
app.post("/urls/:shortURL/", (req, res) => {
  if (req.cookies["user_id"] === urlDatabase[req.params.shortURL]['userID']) {
      urlDatabase[req.params.shortURL]['longURL'] = req.body.longURL;
  }

  res.redirect("http://localhost:8080/urls/");

});

//POST login to cookies
app.post("/login", (req, res) => {
  for (let user in users) {
    emails.push(users[user]["email"]);
    passwords.push(users[user]["password"]);
    ids.push(users[user]["id"]);
  }
  if (!emails.includes(req.body.email)) {
    res.status(301);
    res.send("E-mail cannot be found");
  }
  else if (passwords[emails.indexOf(req.body.email)] !== req.body.password) {
    res.status(301);
    res.send("Incorrect password");
  } else {
    res.cookie("user_id", ids[emails.indexOf(req.body.email)]);
    res.redirect("http://localhost:8080/");
  }
});

//POST logout
app.get("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("http://localhost:8080/urls/");
});

//GET register form page
app.get("/register", (req, res) => {
  templateVars = {user: users[req.cookies["user_id"]], errors: errors};
  res.render("register", templateVars)

})

//POST register
app.post("/register", (req, res) => {
  let user_id = generateRandomString();
  let emails = [];

  for (let user in users) {
    emails.push(users[user]['email']);
  }

  if (req.body.email && req.body.password && !emails.includes(req.body.email)) {
    users[user_id] = {
      id: user_id,
      email: req.body.email,
      password: req.body.password
    }
    errors.emptyEmail = 0;
    errors.emptyPassword = 0;
    res.cookie("user_id", user_id);
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

//GET login page
app.get("/login", (req, res) => {
  templateVars = {user: users[req.cookies["user_id"]], errors: errors};
  res.render("login", templateVars)

})





