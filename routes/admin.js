const express = require('express');
const router = express.Router();
const multer = require('multer');
const Product = require('../models/Product');
const Order = require('../models/Order');
const path = require('path');
const { authenticate, isAdmin } = require('../middleware/auth');

// Apply authentication and admin check to all routes
router.use(authenticate);
router.use(isAdmin);

const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Product = require('../models/Product');
const Order = require('../models/Order');
const path = require('path');
const { authenticate, isAdmin } = require('../middleware/auth');

// Apply authentication and admin check to all routes
router.use(authenticate);
router.use(isAdmin);

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.drxrpsoag,
    api_key: process.env.578193238349623,
    api_secret: process.env.SfXYq4CXOeEHM5-cYVgW-suGz6Y
});

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'ecommerce-products',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }]
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5000000 } // 5MB limit
});

// Rest of your admin.js code stays the same...

// Create product
router.post('/products', upload.single('image'), async (req, res) => {
    try {
        const product = new Product({
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            quantity: req.body.quantity,
            category: req.body.category,
            image: '/uploads/' + req.file.filename
        });

        const newProduct = await product.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update product
router.put('/products/:id', upload.single('image'), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        product.name = req.body.name || product.name;
        product.description = req.body.description || product.description;
        product.price = req.body.price || product.price;
        product.quantity = req.body.quantity || product.quantity;
        product.category = req.body.category || product.category;
        
        if (req.file) {
            product.image = '/uploads/' + req.file.filename;
        }

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        
        await product.deleteOne();
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all orders
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find().populate('items.product').sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update order status
router.put('/orders/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.orderStatus = req.body.orderStatus || order.orderStatus;
        await order.save();

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;