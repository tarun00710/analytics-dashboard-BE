const express = require("express");
const fs = require("fs");
const csv = require("csv-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const Analytics = require("./models/Analytics");
const { parse, format } = require("date-fns");
const authRoutes = require("./routes/auth");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected perfectly"))
  .catch((err) => console.error(err));

// Basic route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/auth", authRoutes);

app.get("/api/getdata", (req, res) => {
  const results = [];

  fs.createReadStream("./data.csv")
    .pipe(csv())
    .on("data", async (data) => {
      if (data.Day) {
        // Parse the Day field using date-fns for DD/MM/YYYY format
        const parsedDate = parse(data.Day, "dd/MM/yyyy", new Date());

        // Format to ISO 8601 format
        data.Day = format(parsedDate, "yyyy-MM-dd'T'HH:mm:ss'Z'"); // Convert to ISO string (UTC)

        // Create a new instance of the Analytics model
        const analyticsEntry = new Analytics({
          Day: data.Day,
          Age: data.Age,
          Gender: data.Gender,
          A: Number(data.A),
          B: Number(data.B),
          C: Number(data.C),
          D: Number(data.D),
          E: Number(data.E),
          F: Number(data.F),
        });

        // Save to MongoDB
        try {
          await analyticsEntry.save();
          console.log("Entry saved:", analyticsEntry);
        } catch (err) {
          console.error("Error saving entry:", err);
        }
      }
    })
    .on("end", () => {
      res.send("Data imported successfully.");
    })
    .on("error", (err) => {
      console.error(err);
      res.status(500).send("Error reading the CSV file");
    });
});
app.get("/api/alldata", async (req, res) => {
  const allDoc = await Analytics.find({});
  res.json(allDoc);
});

app.get("/api/data", async (req, res) => {
  const { startDate, endDate, age, gender } = req.query;

  console.log(req.query, "req");

  try {
    let query = {};
    if (startDate || endDate) {
      query.Day = {};
      if (startDate) {
        query.Day.$gte = startDate;
      }
      if (endDate) {
        query.Day.$lte = endDate;
      }
    }
    if (age) {
      query.Age = age;
    }
    if (gender) {
      query.Gender = gender;
    }
    const results = await Analytics.find(query);
    console.log(results, "resultes");

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching data");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
