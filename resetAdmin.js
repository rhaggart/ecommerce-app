require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
    console.log('MongoDB connected');
    
    // Find admin user
    const admin = await User.findOne({ role: 'admin' });
    
    if (admin) {
        console.log('Found admin user:', admin.email);
        
        // Reset to default credentials
        admin.email = 'admin@example.com';
        admin.password = 'admin123'; // Will be hashed by pre-save hook
        await admin.save();
        
        console.log('✅ Admin credentials reset to:');
        console.log('   Email: admin@example.com');
        console.log('   Password: admin123');
    } else {
        console.log('No admin user found, creating new one...');
        const newAdmin = new User({
            email: 'admin@example.com',
            password: 'admin123',
            name: 'Admin User',
            role: 'admin'
        });
        await newAdmin.save();
        console.log('✅ Admin user created: admin@example.com / admin123');
    }
    
    process.exit(0);
})
.catch(err => {
    console.error('Error:', err);
    process.exit(1);
});

