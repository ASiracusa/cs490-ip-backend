const express = require('express');
const app = express();
const mysql = require('mysql2');
const config = require('./config');

app.get("/api/hello", (req, res) => {
    res.json({"hello": "Hello World"});
})


app.get("/api/top5Movies", (req, res) => {
    const sql = 'SELECT F.title, F.film_id '
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

app.get("/api/movieInfo", (req, res) => {
    const sql = 'SELECT F.title, F.description, F.release_year, F.rental_rate, F.length, F.rating, C.name AS genre '
        + 'FROM sakila.film AS F, sakila.category AS C, sakila.film_category AS FC '
        + 'WHERE F.film_id=' + req.query.filmId + ' AND F.film_id=FC.film_id AND FC.category_id=C.category_id;';
    makeQuery(res, sql, {});
})

app.get("/api/customerInfo", (req, res) => {
    const sql = 'SELECT C.customer_id, C.first_name, C.last_name, C.email, C.active, C.store_id, C.create_date, A.address, Ci.city, Co.country, A.address_id '
        + 'FROM sakila.customer AS C, sakila.address AS A, sakila.city AS Ci, sakila.country AS Co '
        + 'WHERE C.customer_id=' + req.query.customerId + ' AND C.address_id=A.address_id AND A.city_id=Ci.city_id AND Ci.country_id=Co.country_id;';
    makeQuery(res, sql, {});
})

app.get("/api/actorsTopMovies", (req, res) => {
    const sql = 'SELECT F.title, COUNT(*) AS rented '
        + 'FROM sakila.film AS F, sakila.rental AS R, sakila.inventory AS I, sakila.film_actor as FA '
        + 'WHERE F.film_id=I.film_ID AND R.inventory_id=I.inventory_id AND F.film_id=FA.film_id AND FA.actor_id=' + req.query.actorId + ' '
        + 'GROUP BY F.film_id ORDER BY COUNT(*) DESC LIMIT 5;'
    makeQuery(res, sql, {});
})

app.get("/api/searchMovies", (req, res) => {
    const hasFN = req.query.filmName.length > 0;
    const hasAN = req.query.actorName.length > 0;
    const hasFG = req.query.filmGenre.length > 0;
    const sql = 'SELECT F.title, F.film_id '
        + 'FROM sakila.film AS F'
            + (hasAN ? ', sakila.actor AS A, sakila.film_actor AS FA' : '') 
            + (hasFG ? ', sakila.category AS C, sakila.film_category AS FC' : '') 
        + (hasFN || hasAN || hasFG ? ' WHERE ' : '')
            + (hasFN ? "F.title LIKE '%" + req.query.filmName + "%'" : '')
            + (hasAN ? (hasFN ? ' AND ' : '') + "F.film_id=FA.film_id AND FA.actor_id=A.actor_id AND CONCAT(A.first_name, ' ', A.last_name) LIKE '%" + req.query.actorName + "%'" : '')
            + (hasFG ? (hasFN || hasAN ? ' AND ' : '') + "F.film_id=FC.film_id AND FC.category_id=C.category_id AND C.name='" + req.query.filmGenre + "'" : '')
        + ' ORDER BY F.title ASC LIMIT 100;';
    console.log(sql);
    makeQuery(res, sql, {});
})

app.get("/api/searchCustomers", (req, res) => {
    const hasCI = req.query.customerId.length > 0;
    const hasFN = req.query.firstName.length > 0;
    const hasLN = req.query.lastName.length > 0;
    const sql = 'SELECT C.customer_id, C.first_name, C.last_name '
        + 'FROM sakila.customer AS C'
        + (hasCI || hasFN || hasLN ? ' WHERE ' : '')
            + (hasCI ? "C.customer_id=" + req.query.customerId : '')
            + (hasFN ? (hasCI ? ' AND ' : '') + "C.first_name LIKE '%" + req.query.firstName + "%'" : '')
            + (hasLN ? (hasCI || hasFN ? ' AND ' : '') + "C.last_name LIKE '%" + req.query.lastName + "%'" : '')
        + ' ORDER BY C.first_name ASC, C.last_name ASC LIMIT 100;';
    console.log(sql);
    makeQuery(res, sql, {});
})

app.get("/api/customersRentals", (req, res) => {
    const sql = 'SELECT F.title, R.rental_id, R.rental_date, R.return_date, I.store_id, R.inventory_id '
        + 'FROM sakila.rental AS R, sakila.inventory AS I, sakila.film AS F '
        + 'WHERE R.customer_id=' + req.query.customerId + ' AND R.inventory_id=I.inventory_id AND I.film_id=F.film_id'
        + ' ORDER BY R.rental_date DESC;';
    makeQuery(res, sql, {});
})

app.get("/api/returnRental", (req, res) => {
    const sql = 'UPDATE sakila.rental '
        + 'SET return_date=NOW(), last_update=CURRENT_TIMESTAMP()'
        + 'WHERE rental_id=' + req.query.rentalId + ';';
    makeQuery(res, sql, {});
})

app.get("/api/returnRentalInv", (req, res) => {
    const sql = 'UPDATE sakila.inventory '
        + 'SET last_update=CURRENT_TIMESTAMP()'
        + 'WHERE inventory_id=' + req.query.inventoryId + ';';
    makeQuery(res, sql, {});
})

app.get("/api/deleteCustomer", (req, res) => {
    const sql = 'DELETE FROM sakila.payment '
            + 'WHERE customer_id=' + req.query.customerId + '; '
        + 'DELETE FROM sakila.rental '
            + 'WHERE customer_id=' + req.query.customerId + '; '
        + 'DELETE FROM sakila.customer '
            + 'WHERE customer_id=' + req.query.customerId + ';';
    makeQuery(res, sql, {});
})

app.get("/api/updateCustomerDetails", (req, res) => {
    const sql = 'UPDATE sakila.customer '
            + "SET first_name='" + req.query.firstName + "', last_name='" + req.query.lastName + "', active=" + req.query.active + ", email='" + req.query.email + "', store_id=" + req.query.storeId + " "
            + 'WHERE customer_id=' + req.query.customerId + ';';
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