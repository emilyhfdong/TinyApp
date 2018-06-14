const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

let errors = {};

app.use(cookieSession({keys: ["skldjflskdjflsjd"]}));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  const lettersAndNums = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
  var str = "";
  for (let i = 0; i < 6; i ++ ) {
    str += lettersAndNums[Math.floor(Math.random() * (61))];
  }
  return str;
}

function urlsForUser(id) {
  let databaseForID = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL]["userID"] === id) {
      databaseForID[shortURL] = {
        longURL: urlDatabase[shortURL]["longURL"],
        userID: id
      }
    }
  }
  return databaseForID;
}

function createArrayFromUsers (key) {
  let array = [];
  for (let user in users) {
    array.push(users[user][key]);
  }
  return array;
}

let users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("test1", 10)
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("test2", 10)
  }
}

let urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  }
};

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.render("pleaseLogin", {user: users[req.session.user_id]});
  } else {
    let templateVars = { urls: urlsForUser(req.session.user_id), user: users[req.session.user_id] };
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login")
  } else {
    templateVars = {user: users[req.session.user_id], errors: errors};
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).render("404", {user: users[req.session.user_id]});
  } else if (!req.session.user_id || urlDatabase[req.params.shortURL]["userID"] !== req.session.user_id) {
    res.render("pleaseLogin", {user: users[req.session.user_id]});
  } else {
    let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]["longURL"], user: users[req.session.user_id]};
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL]["longURL"];
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).render("404", {user: users[req.session.user_id]});
  } else {
    res.status(301);
    res.redirect(longURL);
  }
});

app.post("/urls", (req, res) => {
  errors.emptyURL = 0;
  if (!req.body.longURL) {
    errors.emptyURL = 1;
    res.redirect("/urls/new");
  } else if (!req.session.user_id){
    res.render("pleaseLogin", {user: users[req.session.user_id]})
  } else {
    let newShort = generateRandomString();
    while (urlDatabase[newShort]) {
      newShort = generateRandomString;
    }
    urlDatabase[newShort] = {
      longURL: req.body.longURL,
      userID: req.session.user_id
    };
    res.redirect("/urls/" + newShort);
  }
});

app.post("/urls/:shortURL/", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL]["userID"]) {
    urlDatabase[req.params.shortURL]['longURL'] = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.render("pleaseLogin", {user: users[req.session.user_id]});
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL]["userID"]) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.render("pleaseLogin", {user: users[req.session.user_id]});
  }
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    let templateVars = {user: users[req.session.user_id], errors: errors};
    res.render("login", templateVars);
  }
});

app.get("/register", (req, res) => {
  templateVars = {user: users[req.session.user_id], errors: errors};
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("register", templateVars);
  }
});

app.post("/login", (req, res) => {
  let emailsArr = createArrayFromUsers("email");
  let passwordsArr = createArrayFromUsers("password");
  let idsArr = createArrayFromUsers("id");

  errors.emailNotFound = 0;
  errors.incorrectPassword = 0;
  let templateVars = {user: users[req.session.user_id], errors: errors};

  if (!emailsArr.includes(req.body.email)) {
    errors.emailNotFound = 1;
    res.render("login", templateVars);
  }
  else if (!bcrypt.compareSync(req.body.password, passwordsArr[emailsArr.indexOf(req.body.email)])) {
    errors.incorrectPassword = 1;
    res.render("login", templateVars);
  } else {
    req.session.user_id = idsArr[emailsArr.indexOf(req.body.email)];
    res.redirect("/");
  }

});

app.post("/register", (req, res) => {
  let user_id = generateRandomString();
  let emailsArr = createArrayFromUsers("email");

  errors.emptyEmail = 0;
  errors.emptyPassword = 0;
  errors.alreadyEmail = 0;

  if (req.body.email && req.body.password && !emailsArr.includes(req.body.email)) {
    users[user_id] = {
      id: user_id,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    }
    req.session.user_id = user_id;
    res.redirect("/urls")
  } else {
    if (!req.body.email) {
      errors.emptyEmail = 1;
    }
    if (!req.body.password){
      errors.emptyPassword = 1;
    }
    if (emailsArr.includes(req.body.email)) {
      errors.alreadyEmail = 1;
    }
    res.redirect("/register");
  }
});

app.get("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls/");
});








