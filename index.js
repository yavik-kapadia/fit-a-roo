const express = require('express');
const app = express();
const pool = require('./dbPool.js');
app.set("view engine", "ejs");
app.use(express.static('public'));


//routes
app.get("/", async (req, res) => {
    res.render("index",);

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