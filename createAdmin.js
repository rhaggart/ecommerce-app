require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
    console.log('MongoDB connected');
    
    const admin = new User({
        email: 'admin@example.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin'
    });
    
    await admin.save();
    console.log('Admin user created: admin@example.com / admin123');
    process.exit();
})
.catch(err => console.log(err));