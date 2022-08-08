const express = require('express');
const app = express();
const pool = require('./dbPool.js');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql');
app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(session ({
  secret: "top secret!",
  resave: true,
  saveUninitialized:true
}));
var time = require('express-timestamp');
app.use(time.init);
app.use(function (req, res, next) {
    res.locals.session = req.session;
    next();
});

//routes

//db test
app.get("/dbTest", async function(req, res) {
  let sql = "SELECT * FROM exercises";
  let rows = await executeSQL(sql);
  res.send(rows);
});

//default route
app.get("/", async (req, res) => {
  let sql = `SELECT * FROM profile;`;
  let rows = await executeSQL(sql);
  req.session.profile = rows[0];
  res.render("index", { exercises: rows, "profile":req.session.profile.userId});
});

app.get("/home", async (req, res) => {
  let sql = `SELECT * FROM profile WHERE userId = ${req.session.profile.userId};`;
  let rows = await executeSQL(sql);
  req.session.profile = rows[0];
  res.render("index", { exercises: rows, "profile":req.session.profile.userId});
});

// about us
app.get("/about", async (req, res) => {
  let sql = `SELECT * FROM profile WHERE userId = ${req.session.profile.userId};`;
  let rows = await executeSQL(sql);
  req.session.profile = rows[0];
  res.render("about", {"profile":req.session.profile.userId});
});

// exerciseExplorer
app.get("/exerciseExplorer", async (req, res) => {

  let sqlTarget = `SELECT DISTINCT target
             FROM exercises;`;
  let rowsTarget = await executeSQL(sqlTarget);
  
  let sqlParts = `SELECT DISTINCT bodyPart
             FROM exercises;`;
  let rowsParts = await executeSQL(sqlParts);
  let sql = `SELECT * FROM profile WHERE userId = ${req.session.profile.userId};`;
  let rows = await executeSQL(sql);
  req.session.profile = rows[0];

  res.render("exerciseExplorer", {"targets": rowsTarget, "parts":rowsParts, "profile":req.session.profile.userId});
});

app.get('/api/workout/:id', async (req, res) => {
  let id = req.params.id;
  let sql = `SELECT *
            FROM exercises
            WHERE target LIKE ? OR bodyPart LIKE ? OR name LIKE ? OR id = ?;`;    
  let params = [`%${id}%`, `%${id}%`, `%${id}%`, id];
  let rows = await executeSQL(sql, params);
  res.send(rows)
});

// contact us
app.get("/contact", async (req, res) => {
  let sql = `SELECT * FROM profile WHERE userId = ${req.session.profile.userId};`;
  let rows = await executeSQL(sql);
  req.session.profile = rows[0];
  res.render("contact", {"profile":req.session.profile.userId});
});

// sign up
app.get("/signup", async (req, res) => {
  res.render("signUp");
});

app.get("/user/new", (req, res) => {
  res.render("login");
});

app.post("/user/new", async (req, res) => {
  let fName = req.body.fName;
  let lName = req.body.lName;
  let birthDate = req.body.birthDate;
  let email = req.body.email;
  let password = req.body.password;
  const hash = await bcrypt.hash(password, 10);
  let goals = req.body.goals;
  let sql = `INSERT INTO profile (firstName, lastName, dob, email, password, goals) VALUES (?, ?, ?, ?, ?, ?);`;
  let params = [fName, lName, birthDate, email, hash, goals];
  let rows = await executeSQL(sql, params);
  res.redirect("/login");
});

// login 
app.get("/login", async (req,res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let sql = `SELECT * FROM profile WHERE email = ?`;
  let rows = await executeSQL(sql, [username]);
  if (comparePassword(password, rows[0].password)) { 
    req.session.authenticated = true;
    req.session.loggedin = true;
    req.session.profile = rows[0]
    var datetime = new Date().toISOString().slice(0,10);
    let datetimeSQL = `UPDATE profile SET lastLogin = ? WHERE userId = ${req.session.profile.userId};`;
    let datetimeParams = [datetime];
    let datetimeRows = await executeSQL(datetimeSQL, datetimeParams);
    res.render("landingPage", {"userId":rows, "profile":req.session.profile.userId});
  }
  else {
    res.render("login", {"loginError": true});
  }
});

app.get("/profile", isAuthenticated, async (req,res) => {
  let sql = `SELECT *, DATE_FORMAT(dob, '%Y-%m-%d') dobISO
               FROM profile
              WHERE userId = ${req.session.profile.userId}`;
  let rows = await executeSQL(sql);
  req.session.profile = rows[0]
  res.render("landingPage", {"userInfo":rows, "userId":rows, "profile":req.session.profile.userId});
});

app.get("/profile/edit", isAuthenticated, async (req, res) => {
   let sql = `SELECT *, DATE_FORMAT(dob, '%Y-%m-%d') dobISO
              FROM profile
              WHERE userId = ${req.session.profile.userId}`;
   let rows = await executeSQL(sql);
   res.render("editProfile", {"userInfo":rows, "profile":req.session.profile.userId});
});

app.post("/profile/edit", isAuthenticated, async (req, res) =>
  {
    let sql = `UPDATE profile
            SET firstName = ?,
               LastName = ?,
               dob = ?,
               email = ?, 
               password = ?, 
               goals = ?
            WHERE userId =  ?`;
    let params = [req.body.fName,  
                  req.body.lName, 
                  req.body.dob,  
                  req.body.email, 
                  req.body.password, 
                  req.body.goals, 
                  req.body.userId];         
    let rows = await executeSQL(sql,params);
    sql = `SELECT *, 
            DATE_FORMAT(dob, '%Y-%m-%d') dobISO
            FROM profile
            WHERE userId= ${req.session.profile.userId}`;
    rows = await executeSQL(sql);
    res.render("editProfile", {"userInfo":rows, "message": "Profile Updated!", "profile":req.session.profile.userId});
  })

app.get("/profile/delete", isAuthenticated, async function(req, res){
  let sql = `DELETE
               FROM profile
              WHERE userId = ${req.session.profile.userId}`;
  let rows = await executeSQL(sql);
  res.redirect('/', {"profile":req.session.profile});
});

app.get("/workingout", isAuthenticated, async (req,res) =>{
  let target =  await getTargetParts();
  sql = `SELECT *, 
            DATE_FORMAT(dob, '%Y-%m-%d') dobISO
            FROM profile
            WHERE userId = ${req.session.profile.userId}`;
  rows = await executeSQL(sql);
  res.render("workingout", {"userInfo":rows,
                            "profile":req.session.profile.userId,
                           focus: target
                           });
});

// logout
app.get("/logout", isAuthenticated, (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

//functions

// execute SQL
async function executeSQL(sql, params) {
  return new Promise(function(resolve, reject) {
    pool.query(sql, params, function(err, rows, fields) {
      if (err) throw err;
      resolve(rows);
    });
  });
};

// get targets
async function getTargetParts(){
  let sqlTarget = `SELECT DISTINCT target
             FROM exercises;`;
  let rowsTarget = await executeSQL(sqlTarget);

  return rowsTarget
  }

// hash password
async function hashPassword(plaintextPassword) {
  const hash = await bcrypt.hash(plaintextPassword, 10);
  return hash;
}

// compare password
async function comparePassword(plaintextPassword, hash) {
  const result = await bcrypt.compare(plaintextPassword, hash);
  return result;
}

// check for authentication 
function isAuthenticated(req,res,next) {
  if (!req.session.authenticated) {
    res.redirect("/login");
  }
  else{
    next();
  }
}

//start server
app.listen(3000, () => {
  console.log("Express server running...")
});