const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Get cart
router.get('/', async (req, res) => {
    try {
        const sessionId = req.sessionID;
        let cart = await Cart.findOne({ sessionId }).populate('items.product');
        
        if (!cart) {
            cart = new Cart({ sessionId, items: [] });
            await cart.save();
        }

        res.json(cart);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add to cart
router.post('/add', async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const sessionId = req.sessionID;
        
        console.log('Add to cart request:', { productId, quantity, sessionId });

        const product = await Product.findById(productId);
        if (!product) {
            console.log('Product not found:', productId);
            return res.status(404).json({ message: 'Product not found' });
        }
        
        console.log('Product found:', product.name);

        let cart = await Cart.findOne({ sessionId });
        
        if (!cart) {
            console.log('Creating new cart for session:', sessionId);
            cart = new Cart({ sessionId, items: [] });
        } else {
            console.log('Found existing cart with', cart.items.length, 'items');
        }

        const existingItem = cart.items.find(item => item.product.toString() === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
            console.log('Updated existing item quantity to:', existingItem.quantity);
        } else {
            cart.items.push({ product: productId, quantity });
            console.log('Added new item to cart');
        }

        cart.updatedAt = Date.now();
        await cart.save();
        console.log('Cart saved successfully');
        
        cart = await Cart.findOne({ sessionId }).populate('items.product');
        console.log('Returning cart with', cart.items.length, 'items');
        res.json(cart);
    } catch (err) {
        console.error('Error in add to cart:', err);
        res.status(500).json({ message: err.message });
    }
});

// Update cart item
router.put('/update/:productId', async (req, res) => {
    try {
        const { quantity } = req.body;
        const sessionId = req.sessionID;

        const cart = await Cart.findOne({ sessionId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const item = cart.items.find(item => item.product.toString() === req.params.productId);
        if (!item) {
            return res.status(404).json({ message: 'Item not in cart' });
        }

        if (quantity <= 0) {
            cart.items = cart.items.filter(item => item.product.toString() !== req.params.productId);
        } else {
            item.quantity = quantity;
        }

        cart.updatedAt = Date.now();
        await cart.save();
        
        const updatedCart = await Cart.findOne({ sessionId }).populate('items.product');
        res.json(updatedCart);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Remove from cart
router.delete('/remove/:productId', async (req, res) => {
    try {
        const sessionId = req.sessionID;
        const cart = await Cart.findOne({ sessionId });
        
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item.product.toString() !== req.params.productId);
        cart.updatedAt = Date.now();
        await cart.save();

        const updatedCart = await Cart.findOne({ sessionId }).populate('items.product');
        res.json(updatedCart);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Clear cart
router.delete('/clear', async (req, res) => {
    try {
        const sessionId = req.sessionID;
        await Cart.findOneAndDelete({ sessionId });
        res.json({ message: 'Cart cleared' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;