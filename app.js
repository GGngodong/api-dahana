// app.js
require("dotenv").config();
const express = require("express");
const sequelize = require("./src/config/db");
const userRoutes = require("./src/routes/userRoutes");
const permitRoutes = require("./src/routes/permitLetterRoutes");
const notificationRoutes = require('./src/routes/notificationRoutes');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// sync DB
sequelize
  .sync({ alter: true })
  .then(() => console.log("Database synced"))
  .catch((err) => console.error(err));

// mount routes
app.use("/api", userRoutes);
app.use("/api", permitRoutes);
app.use('/api', notificationRoutes);

// global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ errors: ["Internal server error."] });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
