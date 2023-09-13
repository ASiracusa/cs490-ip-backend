const express = require('express');
const app = express();

app.get("/api/hello", (req, res) => {
    res.json({"hello": "Hello World"});
})

app.listen(5000, () => {console.log("Server started on port 5000.")});