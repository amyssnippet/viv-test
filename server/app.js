const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const conn = require('./conn/conn');
const cors = require("cors")

const PORT = process.env.PORT || 4000;

// conn();

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

app.listen(PORT,()=>{
    console.log(`server running on ${PORT}`);
});