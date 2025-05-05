const cron = require('node-cron');
const mongoose = require('mongoose');
const deleteEmptyChats = require('../controllers/userController');

// Connect to MongoDB only if not already connected
mongoose.connect(`mongodb+srv://bharatsharma98971:htmlpp123@cluster0.wwrbt.mongodb.net/`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected for cron job');
  
  // Run the job every night at midnight
  cron.schedule('* * * * * *', async () => {
    await deleteEmptyChats();
  });
}).catch(err => {
  console.error('MongoDB connection error for cron job:', err);
});
