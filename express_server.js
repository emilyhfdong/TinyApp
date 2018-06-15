const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");


let errors = {}; // declare empty error object

app.use(cookieSession({keys: ["skldjflskdjflsjd"]}));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// function to generate a random string of letters and numbers
function generateRandomString() {
  const lettersAndNums = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
  var str = "";
  for (let i = 0; i < 6; i ++ ) {
    str += lettersAndNums[Math.floor(Math.random() * (61))];
  }
  return str;
}

// function to create object of URLs for a given user id
function urlsForUser(id) {
  let databaseForID = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL]["userID"] === id) {
      databaseForID[shortURL] = {
        longURL: urlDatabase[shortURL]["longURL"],
        userID: id,
        dateCreated: urlDatabase[shortURL]["dateCreated"],
        timesVisited: urlDatabase[shortURL]["timesVisited"],
        uniqueViews: urlDatabase[shortURL]["uniqueViews"],
        uniqueViewers: urlDatabase[shortURL]["uniqueViewers"]
      }
    }
  }
  return databaseForID;
}

// function to create array from user object
function createArrayFromUsers (key) {
  let array = [];
  for (let user in users) {
    array.push(users[user][key]);
  }
  return array;
}

// function to create string of current date
function getDateStr() {
  let dateObj = new Date();
  return dateObj.toDateString();
}

// user database
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

// url database
let urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
    dateCreated: "Tue Jun 12 2018",
    timesVisited: 0,
    uniqueViews: 0,
    uniqueViewers: []
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID",
    dateCreated: "Wed Jun 13 2018",
    timesVisited: 0,
    uniqueViews: 0,
    uniqueViewers: []
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

// if user is logged in, show list of URLs. Otherwise, show a message to log in
app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.render("pleaseLogin", {user: users[req.session.user_id]});
  } else {
    let templateVars = { urls: urlsForUser(req.session.user_id), user: users[req.session.user_id] };
    res.render("urls_index", templateVars);
  }
});

// if user is logged in, show new url form. Otherwise, redirect to login page
app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login")
  } else {
    templateVars = {user: users[req.session.user_id], errors: errors};
    res.render("urls_new", templateVars);
  }
});

// show URL page to user
app.get("/urls/:shortURL", (req, res) => {
  // if short URL does not exist, render 404 page
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).render("404", {user: users[req.session.user_id]});
  }
  // if user is not logged in OR their id does not match the URLs id, render pleaseLogin page
  else if (!req.session.user_id || urlDatabase[req.params.shortURL]["userID"] !== req.session.user_id) {
    res.render("pleaseLogin", {user: users[req.session.user_id]});
  }
  // otherwise, show URLs belonging to the user
  else {
    let templateVars = {
      shortURL: req.params.shortURL,
      url: urlDatabase[req.params.shortURL],
      user: users[req.session.user_id]};
    res.render("urls_show", templateVars);
  }
});

// redirect shortURL to longURL
app.get("/u/:shortURL", (req, res) => {
  if (!req.session.userCookie) {
    req.session.userCookie = generateRandomString();
  }

  let longURL = urlDatabase[req.params.shortURL]["longURL"];

  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).render("404", {user: users[req.session.user_id]});
  } else {
    urlDatabase[req.params.shortURL]["timesVisited"] += 1;
    if (urlDatabase[req.params.shortURL]["uniqueViews"] === 0){
      urlDatabase[req.params.shortURL]["uniqueViews"] =1;
      urlDatabase[req.params.shortURL]["uniqueViewers"].push(req.session.userCookie);
    } else if (!urlDatabase[req.params.shortURL]["uniqueViewers"].includes(req.session.userCookie)) {
      urlDatabase[req.params.shortURL]["uniqueViews"] +=1;
      urlDatabase[req.params.shortURL]["uniqueViewers"].push(req.session.userCookie);
    }

    res.status(301);
    res.redirect(longURL);
  }
});

// post new urls
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
      userID: req.session.user_id,
      dateCreated: getDateStr(),
      timesVisited: 0,
      uniqueViews: 0,
      uniqueViewers: []
    };
    res.redirect("/urls/" + newShort);
  }
});

// update urls
app.post("/urls/:shortURL/", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL]["userID"]) {
    urlDatabase[req.params.shortURL]['longURL'] = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.render("pleaseLogin", {user: users[req.session.user_id]});
  }
});

// delete urls
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL]["userID"]) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.render("pleaseLogin", {user: users[req.session.user_id]});
  }
});

// login page
app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    let templateVars = {user: users[req.session.user_id], errors: errors};
    res.render("login", templateVars);
  }
});

//register page
app.get("/register", (req, res) => {
  templateVars = {user: users[req.session.user_id], errors: errors};
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("register", templateVars);
  }
});

app.post("/login", (req, res) => {
  // create arrays for emails, passwords, and ids
  let emailsArr = createArrayFromUsers("email");
  let passwordsArr = createArrayFromUsers("password");
  let idsArr = createArrayFromUsers("id");

  // reset errors to be zero
  errors.emailNotFound = 0;
  errors.incorrectPassword = 0;

  let templateVars = {user: users[req.session.user_id], errors: errors};

  //if the given email is not found, send error message
  if (!emailsArr.includes(req.body.email)) {
    errors.emailNotFound = 1;
    res.render("loginErrors", templateVars);
  }
  //if password does not match password in database, send error
  else if (!bcrypt.compareSync(req.body.password, passwordsArr[emailsArr.indexOf(req.body.email)])) {
    errors.incorrectPassword = 1;
    res.render("loginErrors", templateVars);
  }
  // if password and email match, redirect to homepage
  else {
    req.session.user_id = idsArr[emailsArr.indexOf(req.body.email)];
    res.redirect("/");
  }
});

app.post("/register", (req, res) => {
  let user_id = generateRandomString();

  // create array of emails
  let emailsArr = createArrayFromUsers("email");

  // reset errors to be zero
  errors.emptyEmail = 0;
  errors.emptyPassword = 0;
  errors.alreadyEmail = 0;

  let templateVars = {user: users[req.session.user_id], errors: errors};


  // if email and password are filled out and email does not already exist in database, create cookie and redirect to urls index
  if (req.body.email && req.body.password && !emailsArr.includes(req.body.email)) {
    users[user_id] = {
      id: user_id,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    }
    req.session.user_id = user_id;
    res.redirect("/urls")
  } else {
    // if email is blank, send error message
    if (!req.body.email) {
      errors.emptyEmail = 1;
    }
    // if password is blank, send error message
    if (!req.body.password){
      errors.emptyPassword = 1;
    }
    // if the email already exists in the database, send error message
    if (emailsArr.includes(req.body.email)) {
      errors.alreadyEmail = 1;
    }
    res.render("registerErrors", templateVars);
  }
});

// logout page
app.get("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls/");
});








