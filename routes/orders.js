const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { sendOrderConfirmation } = require('../utils/email');

// Create checkout session
router.post('/create-checkout-session', async (req, res) => {
    try {
        const { customerName, customerEmail, shippingAddress } = req.body;
        const sessionId = req.sessionID;

        const cart = await Cart.findOne({ sessionId }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Create line items for Stripe
        const lineItems = cart.items.map(item => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.product.name,
                    images: [`http://localhost:3000${item.product.image}`]
                },
                unit_amount: Math.round(item.product.price * 100)
            },
            quantity: item.quantity
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `http://localhost:3000/checkout.html?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `http://localhost:3000/checkout.html?canceled=true`,
            customer_email: customerEmail,
            metadata: {
                customerName,
                customerEmail,
                shippingAddress: JSON.stringify(shippingAddress)
            }
        });

        res.json({ sessionId: session.id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Confirm order after payment
router.post('/confirm', async (req, res) => {
    try {
        const { sessionId: stripeSessionId } = req.body;
        const sessionId = req.sessionID;

        const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
        
        if (session.payment_status !== 'paid') {
            return res.status(400).json({ message: 'Payment not completed' });
        }

        const cart = await Cart.findOne({ sessionId }).populate('items.product');
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Calculate total
        const totalAmount = cart.items.reduce((sum, item) => 
            sum + (item.product.price * item.quantity), 0
        );

        // Create order
        const orderNumber = 'ORD-' + Date.now();
        const order = new Order({
            orderNumber,
            customerEmail: session.customer_email,
            customerName: session.metadata.customerName,
            items: cart.items.map(item => ({
                product: item.product._id,
                name: item.product.name,
                price: item.product.price,
                quantity: item.quantity
            })),
            totalAmount,
            shippingAddress: JSON.parse(session.metadata.shippingAddress),
            paymentStatus: 'completed',
            paymentId: stripeSessionId
        });

        await order.save();

        // Update product quantities
        for (const item of cart.items) {
            await Product.findByIdAndUpdate(item.product._id, {
                $inc: { quantity: -item.quantity }
            });
        }

        // Clear cart
        await Cart.findOneAndDelete({ sessionId });

        // Send confirmation email
        await sendOrderConfirmation(order);

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get user orders
router.get('/my-orders', async (req, res) => {
    try {
        const { email } = req.query;
        const orders = await Order.find({ customerEmail: email }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;