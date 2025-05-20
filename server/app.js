const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const env = require("dotenv").config();
const PORT = process.env.PORT || 4000;

const { sequelize } = require('./models/psqlSchema');

app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json());
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use("/api/v1", require("./routes/userRoutes"));
app.use("/api/v1", require("./routes/paymentRoutes"));
app.use("/api/v1", require("./routes/botRoutes"));
app.use("/api/v1", require("./routes/authRoutes"));

app.get("/", (req, res) => {
    res.send("Server is up and running!");
});

sequelize.authenticate()
    .then(() => {
        console.log('✅ PostgreSQL Connected');
        return sequelize.sync({ alter: true });
    })
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Unable to connect to PostgreSQL:', err);
    });
