const express = require('express');
const app = express();
const pool = require('./dbPool.js');
app.set("view engine", "ejs");
app.use(express.static('public'));


//routes
app.get("/dbTest", async function(req, res) {
  let sql = "SELECT * FROM exercises";
  let rows = await executeSQL(sql);
  res.send(rows);
});
app.get("/", async (req, res) => {
  let sql = `SELECT id, name FROM fitness_exercises;`;
  let rows = await executeSQL(sql);
  res.render("index",{exercises:rows});

});
//functions
async function executeSQL(sql, params) {
    return new Promise(function(resolve, reject) {
        pool.query(sql, params, function(err, rows, fields) {
            if (err) throw err;
            resolve(rows);
        });
    });
}


//start server
app.listen(3000, () => {
    console.log("Express server running...")
});