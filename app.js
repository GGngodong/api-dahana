// app.js
require('dotenv').config();
const express = require('express');
const sequelize = require('./src/config/db');
const userRoutes = require('./src/routes/userRoutes');

const app = express();
app.use(express.json());

// sync DB
sequelize.sync({ alter: true })
  .then(() => console.log('Database synced'))
  .catch(err => console.error(err));

// mount routes
app.use('/api', userRoutes);

// global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ errors: ['Internal server error.'] });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
