const express = require("express");
const app = express();
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");
const moment = require("moment-timezone");
const sharp = require("sharp");
const { Pool } = require("pg");
app.use(cors());
// Set up static files and EJS as the view engine
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// //local PostgreSQL connection pool configuration
// const pool = new Pool({
//   user: "postgres",
//   host: "localhost",
//   database: "rice",
//   password: "shivam",
//   port: 5432 // Default PostgreSQL port
// });

//prod PostgreSQL connection pool configuration
const pool = new Pool({
  user: "shivam",
  host: "34.69.190.106",
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
  console.log("JSON data ", data);
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

  // Convert the uploaded image to JPG format using sharp
  try {
    const imageBuffer = await sharp(req.file.buffer)
      .jpeg() // Convert to JPG format
      .toBuffer();

    // Insert data, image, filename, and date into the PostgreSQL database
    const query =
      "INSERT INTO rice_categories (data, image, filename, date) VALUES ($1, $2, $3, $4)";
    const client = await pool.connect();

    // Insert data, image, filename, and date as a single row in the rice_categories table
    const result = await client.query(query, [
      JSON.stringify(data),
      imageBuffer, // Use the converted image buffer
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

// get all images donwloaded
app.get("/downloadAll", async (req, res) => {
  try {
    const client = await pool.connect();

    // Fetch all data from the rice_categories table
    const query = "SELECT * FROM rice_categories";
    const result = await client.query(query);
    const rows = result.rows;
    console.log("rows count ", rows.length);
    client.release(); // Release the client back to the pool

    // Create a directory to store the files if it doesn't exist
    const downloadPath = path.join(__dirname, "downloads");
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath);
    }

    // Function to save image and JSON file for a single row
    async function saveData(row) {
      const { id, data, image, filename, date } = row;

      // Save the image with the specified filename
      console.log("downloadPath ", downloadPath);
      const updateFilename = filename.replace(/:| /g, "");
      console.log("updateFilename ", updateFilename);
      const imageFilePath = path.join(downloadPath, `${updateFilename}.jpg`);
      await fs.promises.writeFile(imageFilePath, image);

      // Save the JSON data with the specified filename
      const jsonData = JSON.parse(data);
      const jsonFilePath = path.join(downloadPath, `${updateFilename}.json`);
      await fs.promises.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2));

      return id; // Return the ID of the successfully imported row
    }

    // Use Promise.all to handle asynchronous operations for all rows
    const importedIds = await Promise.all(rows.map(saveData));

    console.log("Successfully imported IDs:", importedIds);

    return res.json({ message: "Data and images downloaded successfully." });
  } catch (error) {
    console.error("Error downloading data:", error);
    return res.status(500).json({ error: "Error downloading data." });
  }
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
