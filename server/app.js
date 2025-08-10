require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const imageRoutes = require('./routes/imageRoutes');

// Middleware
app.use(cors());
app.use(express.json());


// Routes
app.use('/api', imageRoutes);


app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Wildlife Image Classifier API'});
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
