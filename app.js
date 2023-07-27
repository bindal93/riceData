const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");
const moment = require("moment-timezone");
const { Pool } = require("pg");
app.use(cors());
// Set up static files and EJS as the view engine
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// //local PostgreSQL connection pool configuration
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "rice",
  password: "shivam",
  port: 5432 // Default PostgreSQL port
});

//prod PostgreSQL connection pool configuration
// const pool = new Pool({
//   user: "shivam",
//   host: "34.69.190.106",
//   database: "rice",
//   password: "shivam",
//   port: 5432 // Default PostgreSQL port
// });

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

  // Generate a 4-digit random number for the file name
  const randomNum = Math.floor(1000 + Math.random() * 9000);

  // Get the current date and time in Indian time zone (GMT+5:30)
  const date = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

  // Insert data, image, filename, and date into the PostgreSQL database
  const query = "INSERT INTO rice_categories (data, image, filename, date) VALUES ($1, $2, $3, $4)";

  try {
    const client = await pool.connect();

    // Insert data, image, filename, and date as a single row in the rice_categories table
    const result = await client.query(query, [
      JSON.stringify(data),
      req.file.buffer,
      `${randomNum}_${date}`,
      date
    ]);

    console.log("Insert result:", result.rowCount); // Log the response from PostgreSQL

    client.release(); // Release the client back to the pool
    return res.status(200).json({ message: "Data inserted successfully." });
  } catch (error) {
    console.error("Error inserting data into the database:", error);
    return res.status(500).json({ error: "Error inserting data into the database." });
  }
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
