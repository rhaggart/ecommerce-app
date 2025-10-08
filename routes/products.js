const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get all products with search and category filter
router.get('/', async (req, res) => {
    try {
        const { search, category } = req.query;
        let query = {};

        if (search) {
            query.$text = { $search: search };
        }

        if (category && category !== 'All') {
            query.category = category;
        }

        const products = await Product.find(query);
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get categories
router.get('/meta/categories', async (req, res) => {
    res.json(['All', 'Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Other']);
});

module.exports = router;