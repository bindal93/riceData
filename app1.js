const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");
const { Pool } = require("pg");
app.use(cors());
// Set up static files and EJS as the view engine
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// PostgreSQL connection pool configuration
const pool = new Pool({
  user: "shivam",
  host: "https://34.69.190.106/",
  database: "rice",
  password: "shivam",
  port: 5432 // Default PostgreSQL port
});

// Endpoint to render the index page
app.get("/", (req, res) => {
  res.render("index", { rows: [] });
});

// Endpoint to handle form submission
app.post("/submit", multer().none(), (req, res) => {
  const data = JSON.parse(req.body.data);

  // Validate data and calculate total percentage
  let totalPercentage = 0;
  for (const item of data) {
    if (isNaN(item.percentage) || item.percentage <= 0) {
      return res.status(400).json({ error: "Invalid data. Please enter valid percentage values." });
    }
    totalPercentage += parseInt(item.percentage, 10);
  }

  if (totalPercentage !== 100) {
    return res.status(400).json({ error: "Total percentage should be 100." });
  }

  // Insert data into the PostgreSQL database
  const query =
    "INSERT INTO rice_categories (category_name, percentage, image) VALUES ($1, $2, $3)";
  const values = data.map((item) => [item.riceCategory, item.percentage, req.file.buffer]);

  pool.connect((err, client, done) => {
    if (err) {
      return res.status(500).json({ error: "Error connecting to the database." });
    }

    client.query(query, values, (err) => {
      done(); // Release the client back to the pool

      if (err) {
        return res.status(500).json({ error: "Error inserting data into the database." });
      }

      res.json({ message: "Data inserted successfully." });
    });
  });
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
