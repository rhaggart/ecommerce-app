const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get all products (removed search and category)
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().populate('printSizes.size');
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('printSizes.size');
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;