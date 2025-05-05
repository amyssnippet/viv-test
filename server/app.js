const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const conn = require('./conn/conn');
const cors = require("cors")
const env = require("dotenv").config();
const PORT = process.env.PORT || 4000;

// conn();
app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json());
app.use(cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }))

// routes
app.use("/api/v1", require("./routes/userRoutes"));
app.use("/api/v1", require("./routes/paymentRoutes"));
app.use("/api/v1", require("./routes/botRoutes"));
app.use("/api/v1", require("./routes/authRoutes"));
app.get("/", (req, res) => {
  res.send(" Server is up and running!");
});
app.listen(PORT,()=>{
    console.log(`server running on ${PORT}`);
});