const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { authenticate, isAdmin } = require('../middleware/auth');

router.use(authenticate);
router.use(isAdmin);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'ecommerce-products',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
        secure: true
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5000000 }
});

// Create product (up to 8 images)
router.post('/products', upload.array('images', 8), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'At least one image is required' });
        }

        const images = req.files.map(file => file.path);
        
        // Parse print sizes from JSON string
        const printSizes = req.body.printSizes ? JSON.parse(req.body.printSizes) : [];

        const product = new Product({
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            images: images,
            printSizes: printSizes
        });

        const newProduct = await product.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update product
router.put('/products/:id', upload.array('images', 8), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        product.name = req.body.name || product.name;
        product.description = req.body.description || product.description;
        product.price = req.body.price || product.price;
        
        if (req.body.printSizes) {
            product.printSizes = JSON.parse(req.body.printSizes);
        }
        
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.path);
            product.images = newImages;
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

// Get all products (including potentially problematic ones)
router.get('/products/all', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
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

// Cleanup stuck database entries
router.post('/cleanup', async (req, res) => {
    try {
        const results = {
            productsDeleted: 0,
            printSizesDeleted: 0,
            orphanedEntries: 0
        };

        // Delete products with invalid data
        const invalidProducts = await Product.find({
            $or: [
                { name: { $exists: false } },
                { name: null },
                { name: '' },
                { images: { $exists: false } },
                { images: null },
                { $expr: { $eq: [{ $size: "$images" }, 0] } }
            ]
        });
        
        results.productsDeleted = invalidProducts.length;
        await Product.deleteMany({
            _id: { $in: invalidProducts.map(p => p._id) }
        });

        // Delete orphaned print sizes (not referenced by any products)
        const allProducts = await Product.find({});
        const usedPrintSizeIds = new Set();
        
        allProducts.forEach(product => {
            if (product.printSizes && product.printSizes.length > 0) {
                product.printSizes.forEach(size => {
                    if (size._id) usedPrintSizeIds.add(size._id.toString());
                });
            }
        });

        // This is for the PrintSize collection if it exists separately
        const PrintSize = require('../models/PrintSize');
        const allPrintSizes = await PrintSize.find({});
        const orphanedPrintSizes = allPrintSizes.filter(size => 
            !usedPrintSizeIds.has(size._id.toString())
        );
        
        results.printSizesDeleted = orphanedPrintSizes.length;
        await PrintSize.deleteMany({
            _id: { $in: orphanedPrintSizes.map(s => s._id) }
        });

        res.json({
            message: 'Cleanup completed successfully',
            results: results
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;