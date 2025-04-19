const mongoose = require('mongoose');

mongoose.connect(`mongodb+srv://bharatsharma:htmlpp123@cluster0.0r7kvkr.mongodb.net/`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

//mongodb+srv://amolyadav:amol6125@cluster0.5oqld.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0 
