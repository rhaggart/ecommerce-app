const express = require('express');
const router = express.Router();
const PrintSize = require('../models/PrintSize');
const { authenticate, isAdmin } = require('../middleware/auth');

// Get all print sizes (public)
router.get('/', async (req, res) => {
    try {
        const sizes = await PrintSize.find().sort({ order: 1 });
        res.json(sizes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin routes
router.use(authenticate);
router.use(isAdmin);

// Create print size
router.post('/', async (req, res) => {
    try {
        const { name, dimensions, order } = req.body;
        const printSize = new PrintSize({ name, dimensions, order: order || 0 });
        await printSize.save();
        res.status(201).json(printSize);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update print size
router.put('/:id', async (req, res) => {
    try {
        const size = await PrintSize.findById(req.params.id);
        if (!size) return res.status(404).json({ message: 'Print size not found' });

        if (req.body.name) size.name = req.body.name;
        if (req.body.dimensions) size.dimensions = req.body.dimensions;
        if (req.body.order !== undefined) size.order = req.body.order;

        await size.save();
        res.json(size);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete print size
router.delete('/:id', async (req, res) => {
    try {
        const size = await PrintSize.findById(req.params.id);
        if (!size) return res.status(404).json({ message: 'Print size not found' });
        
        await size.deleteOne();
        res.json({ message: 'Print size deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;