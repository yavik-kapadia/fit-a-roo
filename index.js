const express = require('express');
const app = express();
const pool = require('./dbPool.js');
const session = require('express-session');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const bcrypt = require('bcrypt');
const mysql = require('mysql');
const date = new Date();
const pst = date.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
});
app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(session({
    secret: "top secret!",
    resave: true,
    saveUninitialized: true
}));
var time = require('express-timestamp');
app.use(time.init);
app.use(function (req, res, next) {
    res.locals.session = req.session;
    next();
});

//routes

//default route
app.get("/", async (req, res) => {
    let sql = `SELECT *
               FROM profile;`;
    let rows = await executeSQL(sql);
    req.session.profile = rows[0];
    res.render("index", {exercises: rows, "profile": req.session.profile.userId});
});


// about us
app.get("/about", async (req, res) => {
    let sql = `SELECT *
               FROM profile
               WHERE userId = ${req.session.profile.userId};`;
    let rows = await executeSQL(sql);
    req.session.profile = rows[0];
    res.render("about", {"profile": req.session.profile.userId});
});

// exerciseExplorer
app.get("/exerciseExplorer", async (req, res) => {

    let sqlTarget = `SELECT DISTINCT target
                     FROM exercises;`;
    let rowsTarget = await executeSQL(sqlTarget);
    let sqlParts = `SELECT DISTINCT bodyPart
                    FROM exercises;`;
    let rowsParts = await executeSQL(sqlParts);
    let sql = `SELECT *
               FROM profile
               WHERE userId = ${req.session.profile.userId};`;
    let rows = await executeSQL(sql);
    req.session.profile = rows[0];

    res.render("exerciseExplorer", {"targets": rowsTarget, "parts": rowsParts, "profile": req.session.profile.userId});
});


// contact us
app.get("/contact", async (req, res) => {
    let sql = `SELECT *
               FROM profile
               WHERE userId = ${req.session.profile.userId};`;
    let rows = await executeSQL(sql);
    req.session.profile = rows[0];
    res.render("contact", {"profile": req.session.profile.userId});
});

// Sign up
app.get("/signup", async (req, res) => {
    res.render("signUp");
});
// Login
app.get("/user/new", (req, res) => {
    res.render("login");
});

//Sign up post
app.post("/user/new", async (req, res) => {
    let fName = req.body.fName;
    let lName = req.body.lName;
    let birthDate = req.body.birthDate;
    let email = req.body.email;
    let password = req.body.password;
    const hash = await bcrypt.hash(password, 10);
    let goals = req.body.goals;
    let sql = `INSERT INTO profile (firstName, lastName, dob, email, password, goals)
               VALUES (?, ?, ?, ?, ?, ?);`;
    let params = [fName, lName, birthDate, email, hash, goals];
    let rows = await executeSQL(sql, params);
    res.redirect("/login");
});

// get login
app.get("/login", async (req, res) => {
        res.render("login");
    }
);

// Post login
app.post("/login", async (req, res) => {
    let password = req.body.password;
    let username = req.body.username;
    //this might be no bueno we should be using a different method
    //let url = `https://fit-a-roo.yavik.repl.co/api/login/${username}`;
    //let response = await fetch(url);
    //let data = await response.json();
    //if (data.length !== 0) {
    //    console.log("found: " + data[0].email);
    //} else {
    //    console.log("No data");
    //}
    let data = await checkEmailIsValid(username);
    if (data.length > 0) {

        let dbUsername = data[0].email;
        let validUser = (username === dbUsername);

        let sql = `SELECT *
                   FROM profile
                   WHERE email = ? `;
        let rows = await executeSQL(sql, username, password);
        const result = await bcrypt.compare(password, rows[0].password);

        console.log("user: " + username);
        console.log(typeof (username));
        console.log("data[0].email: " + data[0].email);
        console.log(typeof (data[0].email));
        console.log("validUser: " + validUser);

        if (validUser) {
            if (result) {
                req.session.authenticated = true;
                req.session.loggedin = true;
                req.session.profile = rows[0];
                var datetime = pst;
                let datetimeSQL = `UPDATE profile
                                   SET lastLogin = ?
                                   WHERE userId = ${req.session.profile.userId};`;
                let datetimeParams = [datetime];
                let datetimeRows = await executeSQL(datetimeSQL, datetimeParams);
                res.render("landingPage", {"userId": rows, "profile": req.session.profile.userId});
            } else {
                res.render("login", {"loginError": true});
            }
        } else {
            res.render("login", {"loginError": true});
        }
    } else {
        res.render("login", {"loginError": true});
    }

});

// profile and landing page
app.get("/profile", isAuthenticated, async (req, res) => {
    let sql = `SELECT *, DATE_FORMAT(dob, '%Y-%m-%d') dobISO
               FROM profile
               WHERE userId = ${req.session.profile.userId}`;
    let rows = await executeSQL(sql);
    req.session.profile = rows[0]
    res.render("landingPage", {"userInfo": rows, "userId": rows, "profile": req.session.profile.userId});
});

// edit profile
app.get("/profile/edit", isAuthenticated, async (req, res) => {
    let sql = `SELECT *, DATE_FORMAT(dob, '%Y-%m-%d') dobISO
               FROM profile
               WHERE userId = ${req.session.profile.userId}`;
    let rows = await executeSQL(sql);
    res.render("editProfile", {"userInfo": rows, "profile": req.session.profile.userId});
});

// edit profile post
app.post("/profile/edit", isAuthenticated, async (req, res) => {
    let sql = `UPDATE profile
               SET firstName = ?,
                   LastName  = ?,
                   dob       = ?,
                   email     = ?,
                   password  = ?,
                   goals     = ?
               WHERE userId = ?`;
    let params = [req.body.fName,
        req.body.lName,
        req.body.dob,
        req.body.email,
        req.body.password,
        req.body.goals,
        req.body.userId];
    let rows = await executeSQL(sql, params);
    sql = `SELECT *,
                  DATE_FORMAT(dob, '%Y-%m-%d') dobISO
           FROM profile
           WHERE userId = ${req.session.profile.userId}`;
    rows = await executeSQL(sql);
    res.render("editProfile", {"userInfo": rows, "message": "Profile Updated!", "profile": req.session.profile.userId});
})

// delete profile
app.get("/profile/delete", isAuthenticated, async function (req, res) {
    let sql = "DELETE FROM profile WHERE userId = ?;";
    let params = [req.session.profile.userId];
    let rows = await executeSQL(sql, params);
    res.redirect('/', {"profile": req.session.profile});
});

//get workout page
app.get("/workout", isAuthenticated, async (req, res) => {
    console.log("userId: " + req.session.profile.userId)
    console.log("Check 1 - Workout start: " + req.session.workoutstarted);


    let userInfo = await getProfile(req.session.profile.userId); //get user info
    if (req.session.workoutstarted === false || typeof req.session.workoutstarted === "undefined") {
        req.session.workoutstarted = true; //set workout started to true

        req.session.profile.sessionId = await initWorkout(req.session.profile.userId); //init workout
        console.log("Session ID: " + req.session.profile.sessionId);
    }
    let target = await getTargetParts(); //get target parts
    let selected = await getExercises(req.query.target); //get exercises for target
    let data = await getRoutine(req.session.profile.sessionId); //get routine for session

    if (selected.length === 0) {
        res.render("workout", {
            "userInfo": userInfo,
            sessionId: req.session.profile.sessionId,
            "profile": req.session.profile.userId,
            target: target,
            routineLog: data,
        });
    } else {
        res.render("workout", {
            "userInfo": userInfo,
            "profile": req.session.profile.userId,
            target: target,
            exercises: selected,
            routineLog: data
        });
    }

});
app.post("/workout/add", isAuthenticated, async (req, res) => {
    console.log(req.body);
    let setId = await addToRoutine(req.session.profile.sessionId, req.session.profile.userId, req.body.exercises);
    let exercise = await getExerciseById(req.body.exercises);
    res.redirect("/workout");

});
app.post("/workout/update", isAuthenticated, async (req, res) => {
    console.log("updating: ");
    let sessId = req.session.profile.sessionId;
    console.log("Session ID: " + sessId);
    let userId = req.session.profile.userId;
    console.log("User ID: " + userId);
    let setId = req.body.setId;
    console.log("exerciseID: " + setId);
    let weight = req.body.weight;
    console.log("weight: " + weight);
    let reps = req.body.reps;
    console.log("reps: " + reps);
    let data = await updateSet(sessId, userId, setId, weight, reps);
    console.log(data);
});
app.post("/workout/delete", isAuthenticated, async (req, res) => {
    console.log("Deleting: ");
    let sessId = req.session.profile.sessionId;
    console.log("Session ID: " + sessId);
    let userId = req.session.profile.userId;
    console.log("User ID: " + userId);
    let setId = req.body.id;
    console.log("exerciseID: " + setId);

    let deletion = await deleteFromRoutine(req.session.profile.sessionId, req.session.profile.userId, req.body.id);
    console.log("Deletion: " + JSON.stringify(deletion));
    res.redirect("/workout");
});

///////////////////////// START APIS //////////////////////////////////////

// USERNAME VALIDATION API
app.get('/api/login/:username', async (req, res) => {
    let email = req.params.username;
    console.log("Got:" + email);
    if (typeof email === 'undefined' || !email) {
        alert('empty');
    } else {
        res.send(await checkEmailIsValid(email));
    }

});


// EXERCISE API
app.get('/api/workout/:id', async (req, res) => {
    let id = req.params.id;
    let sql = `SELECT *
               FROM exercises
               WHERE target LIKE ?
                  OR bodyPart LIKE ?
                  OR name LIKE ?
                  OR id = ?;`;
    let params = [`%${id}%`, `%${id}%`, `%${id}%`, id];
    let rows = await executeSQL(sql, params);
    res.send(rows)
});

app.get('/api/workout/session/:id', async (req, res) => {
    let data = await getRoutine(req.params.id);
    res.send(data);
});


///////////////////////// END APIS  ///////////////////////////////////////


// get routine for session
async function getRoutine(sessionId) {
    let sql = `SELECT *
               FROM routine, exercises
               WHERE sessionId = ? and routine.exerciseId = exercises.id;`;
    let params = [sessionId];
    return await executeSQL(sql, params);
}
// update weight and rep for set
async function updateSet(sessionId, userId, setId, weight, reps) {
    let sql = `UPDATE routine
               SET weight = ?,
                   reps = ?
               WHERE sessionId = ?
                 AND userId = ?
                 AND setId = ?;`;
    let params = [weight, reps, sessionId, userId, setId];
    return await executeSQL(sql, params);
}
//delete from routine
async function deleteFromRoutine(sessionId, userId, exerciseId) {
    let sql = `DELETE
               FROM routine
               WHERE sessionId = ${sessionId}
                 AND userId = ${userId}
                 AND exerciseId = ${exerciseId}`;
    return await executeSQL(sql);
}

// logout
app.get("/logout", isAuthenticated, (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

//functions

// execute SQL
async function executeSQL(sql, params) {
    return new Promise(function (resolve, reject) {
        pool.query(sql, params, function (err, rows, fields) {
            if (err) throw err;
            resolve(rows);
        });
    });
};


async function getTargetParts() {
    let sqlTarget = `SELECT DISTINCT target
                     FROM exercises;`;
    return await executeSQL(sqlTarget)
}

async function getExerciseById(id) {
    let sql = `SELECT *
               FROM exercises
               WHERE id = ${id}`;
    return await executeSQL(sql);
}

async function getExercises(target) {
    let sqlExercise = `SELECT *
                       FROM exercises
                       WHERE target LIKE ?;`;
    let params = [target];
    return await executeSQL(sqlExercise, params);
}


async function initWorkout(id) {
    let sql = `INSERT INTO workout(userId, status)
               values (?, ?);`;
    let params = [id, true];
    let rows = await executeSQL(sql, params);
    console.log(rows.insertId);
    return rows.insertId;
}

async function resumeWorkOut(userId) {
    let sql = `SELECT *
               FROM workout
               WHERE userId = ?
                 and status = ?
               order by MAX(startTime)`;
    let params = [userId, true];
    let rows = await executeSQL(sql, params);
    return rows[0].sessionId;
}

async function addToRoutine(sessionId, userId, exerciseId, reps, sets) {
    let sql = `INSERT INTO routine(sessionId, userId, exerciseId)
               values (?, ?, ?);`;
    let params = [sessionId, userId, exerciseId];
    let rows = await executeSQL(sql, params);
    console.log("id: " + rows.insertId);
    return rows.insertId;
}

async function checkEmailIsValid(email) {
    let sql = `SELECT *
               FROM profile
               WHERE email = ?`;
    let params = [email];
    return await executeSQL(sql, params);
}

//functions


// check for authentication 
function isAuthenticated(req, res, next) {
    if (!req.session.authenticated) {
        res.redirect("/login");
    } else {
        next();
    }
}
function getProfile(userId) {
    let sql = `SELECT *
               FROM profile
               WHERE userId = ?`;
    let params = [userId];
    return executeSQL(sql, params);
}


//start server
app.listen(3000, () => {
    console.log("Express server running...")
});