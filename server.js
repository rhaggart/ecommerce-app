const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

const session = require('express-session');
const MongoStore = require('connect-mongo');

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        touchAfter: 24 * 3600 // lazy session update
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax'
    }
}));

// Update admin login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (username === process.env.ADMIN_USERNAME && 
        password === process.env.ADMIN_PASSWORD) {
        
        // Set session
        req.session.isAdmin = true;
        req.session.adminUsername = username;
        
        res.json({ 
            success: true, 
            message: 'Login successful',
            user: username 
        });
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Invalid credentials' 
        });
    }
});

// Middleware to check admin session
function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) {
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
}

// Apply to admin routes
router.use('/admin/*', requireAdmin);

// ===== DISPLAY FIX: Show images with correct path =====
// Update frontend display code

function displayProduct(product) {
    // Construct proper image URL for Railway
    const imageUrl = product.images && product.images[0] 
        ? `/uploads/${product.images[0]}` 
        : '/placeholder.jpg';
    
    const logoUrl = product.logoImage 
        ? `/uploads/${product.logoImage}` 
        : null;
    
    return `
        <div class="product-card">
            ${logoUrl ? `<img src="${logoUrl}" class="product-logo" alt="Logo">` : ''}
            <img src="${imageUrl}" alt="${product.name}" onerror="this.src='/placeholder.jpg'">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            ${product.hasPrintSizes ? 
                `<div class="print-sizes">
                    ${product.printSizes.map(size => 
                        `<span>${size.size}: $${size.price}</span>`
                    ).join('')}
                </div>` : 
                `<p>Price: $${product.price}</p>`
            }
        </div>
    `;
}


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
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true
    }
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
    console.log(`Server running on http://localhost:${PORT}`);
});