const express = require('express');
const app = express();
const mysql = require('mysql2');
const config = require('./config');

app.get("/api/hello", (req, res) => {
    res.json({"hello": "Hello World"});
})


app.get("/api/top5Movies", (req, res) => {
    const sql = 'SELECT F.title, COUNT(*) AS rented '
        + 'FROM sakila.film AS F, sakila.rental AS R, sakila.inventory AS I '
        + 'WHERE F.film_id=I.film_ID AND R.inventory_id=I.inventory_id '
        + 'GROUP BY F.film_id ORDER BY COUNT(*) DESC LIMIT 5;';
    makeQuery(res, sql, {});
})

app.get("/api/top5Actors", (req, res) => {
    const sql = 'SELECT A.actor_id, A.first_name, A.last_name, COUNT(*) AS movies '
        + 'FROM sakila.film AS F, sakila.actor AS A, sakila.film_actor AS FA '
        + 'WHERE F.film_id=FA.film_id AND A.actor_id=FA.actor_id '
        + 'GROUP BY A.actor_id ORDER BY COUNT(*) DESC LIMIT 5;';
    makeQuery(res, sql, {});
})

app.listen(5000, () => {console.log("Server started on port 5000.")});

function makeQuery (res, sql, jsonParams) {
    var connection = mysql.createConnection(config.db);
    connection.query(sql, (err, result) => {
        if (err) throw err;
        console.log('My SQL Connected via a new open connection.');
        res.json(result);
    });
    connection.end((err => {
        if (err) throw err;
        console.log('Connection closed.');
    }));
}