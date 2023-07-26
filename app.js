const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");
const mongoose = require("mongoose");
app.use(cors());
// Set up static files and EJS as the view engine
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// Parse incoming JSON data
app.use(bodyParser.json());

// Connect to MongoDB (Make sure MongoDB is running)
const mongoURI = "mongodb://localhost:27017/rice_categories_db"; // Replace with your MongoDB URI //mongodb://localhost:27017/rice_categories_db
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Define a schema and model for the rice categories
const riceCategorySchema = new mongoose.Schema({
  riceCategory: String,
  percentage: Number,
  image: { data: Buffer, contentType: String }, // Adding a field to store image data
});
const RiceCategory = mongoose.model("RiceCategory", riceCategorySchema);

// Set up Multer for handling file uploads
const storage = multer.memoryStorage(); // Store the uploaded file in memory as Buffer
const upload = multer({ storage: storage });

// Routes
app.get("/", (req, res) => {
  res.render("index", { rows: [] });
});

// POST route to handle the form submission with image upload
app.post("/submit", upload.single("image"), (req, res) => {
  const image = req.file; // This will contain the uploaded image data
  const data = JSON.parse(req.body.data); // This will contain the JSON data from the client

  // Validate the total percentage sum (should be 100)
  const totalPercentage = data.reduce((sum, item) => sum + item.percentage, 0);
  if (totalPercentage !== 100) {
    return res.status(400).json({ error: "Total percentage should be 100" });
  }

  // Save the rice categories data and the uploaded image to the MongoDB collection
  const riceCategory = new RiceCategory({
    riceCategory: data.map((item) => item.riceCategory),
    percentage: data.map((item) => item.percentage),
    image: { data: image.buffer, contentType: image.mimetype },
  });

  riceCategory.save((err, result) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: "Failed to save data to the database" });
    }

    console.log("Data and Image saved successfully:", result);
    return res
      .status(200)
      .json({ message: "Data and Image saved successfully" });
  });
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
