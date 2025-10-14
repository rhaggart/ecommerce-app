const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: true,  // Force session save on each request
    saveUninitialized: true,  // Create session even for anonymous users
    store: MongoStore.create({ 
        mongoUrl: process.env.MONGODB_URI,
        touchAfter: 24 * 3600
    }),
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24 * 7,  // 7 days
        httpOnly: false,  // Allow JavaScript access for debugging
        secure: false,  // Disable for now to ensure cookies work
        sameSite: 'lax',
        path: '/'
    },
    name: 'connect.sid',  // Standard session cookie name
    rolling: true  // Reset expiry on each request
}));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
    console.log('MongoDB connected');
    
    // Auto-create admin user if needed
    const User = require('./models/User');
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    
    if (!adminExists) {
        const admin = new User({
            email: 'admin@example.com',
            password: 'admin123',
            name: 'Admin User',
            role: 'admin'
        });
        await admin.save();
        console.log('✅ Admin user created: admin@example.com / admin123');
    }
})
.catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/print-sizes', require('./routes/printSizes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} - Modern redesign active`);
});