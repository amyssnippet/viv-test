const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const env = require("dotenv").config();
const PORT = process.env.PORT || 4000;

// Load models to initialize associations and database connection
const { sequelize } = require('./models/psqlSchema'); // assumes models/index.js or similar

app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json());
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Define routes
app.use("/api/v1", require("./routes/userRoutes"));
app.use("/api/v1", require("./routes/paymentRoutes"));
app.use("/api/v1", require("./routes/botRoutes"));
app.use("/api/v1", require("./routes/authRoutes"));

// Root endpoint
app.get("/", (req, res) => {
    res.send("Server is up and running!");
});

// Ensure DB connection, then start the server
sequelize.authenticate()
    .then(() => {
        console.log('✅ PostgreSQL Connected');
        // Sync the models with the database schema
        return sequelize.sync({ alter: true }); // Use `alter: true` to update the schema, without dropping tables
    })
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Unable to connect to PostgreSQL:', err);
    });
