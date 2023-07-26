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
  user: "postgres",
  host: "localhost",
  database: "rice",
  password: "shivam",
  port: 5432 // Default PostgreSQL port
});

// Endpoint to render the index page
app.get("/", (req, res) => {
  res.render("index", { rows: [] });
});

// Endpoint to handle form submission
app.post("/submit", multer().single("image"), async (req, res) => {
  const data = JSON.parse(req.body.data);
  console.log(data);
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

  // Insert data and image into the PostgreSQL database
  const query = "INSERT INTO rice_categories (data, image) VALUES ($1, $2)";

  try {
    const client = await pool.connect();

    // Insert data and image as a single row in the rice_categories table
    await client.query(query, [JSON.stringify(data), req.file.buffer]);

    client.release(); // Release the client back to the pool
    return res.json({ message: "Data inserted successfully." });
  } catch (error) {
    return res.status(500).json({ error: "Error inserting data into the database." });
  }
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
