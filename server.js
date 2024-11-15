const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/career_tracker', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

// Mongoose model
const LeadSchema = new mongoose.Schema({
    name: String,
    url: String
});

// Define unique compound index on name and url
LeadSchema.index({ name: 1, url: 1 }, { unique: true });

const Lead = mongoose.model('Lead', LeadSchema);

// Routes

// Get all leads
app.get('/leads', async (req, res) => {
    try {
        const leads = await Lead.find();
        res.json(leads);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

// Add a new lead
app.post('/leads', async (req, res) => {
    try {
        const newLead = new Lead(req.body);
        await newLead.save();
        res.status(201).json(newLead);
    } catch (error) {
        if (error.code === 11000) { // Duplicate key error
            res.status(409).json({ error: 'Lead with this name and URL already exists.' });
        } else {
            res.status(500).json({ error: 'Failed to save lead' });
        }
    }
});

// Delete a single lead by ID
app.delete('/leads/:id', async (req, res) => {
    try {
        await Lead.findByIdAndDelete(req.params.id);
        res.json({ message: 'Lead deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete lead' });
    }
});

// Delete all leads
app.delete('/leads', async (req, res) => {
    try {
        await Lead.deleteMany({});
        res.json({ message: 'All leads deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete all leads' });
    }
});

// Start server
app.listen(3001, () => {
    console.log('Server running on port 3001');
});
