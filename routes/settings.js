const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Settings = require('../models/Settings');
const { authenticate, isAdmin } = require('../middleware/auth');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary for logos
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'shop-settings',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'svg'],
        transformation: [{ width: 300, height: 300, crop: 'limit' }],
        secure: true
    }
});

const upload = multer({ 
    storage: storage, 
    limits: { 
        fileSize: 1000000  // 1MB limit for logos
    }
});

// PUBLIC ROUTES (no auth required)

// Get public settings (for frontend theme)
router.get('/public', async (req, res) => {
    try {
        const settings = await Settings.findOne();
        if (!settings) {
            return res.json({
                shopName: 'Our Store',
                shopLogo: null,
                theme: {
                    headerColor: '#333333',
                    buttonColor: '#3498db',
                    fontFamily: 'Arial, sans-serif'
                },
                footerText: '© 2024. All rights reserved.'
            });
        }
        
        res.json({
            shopName: settings.shopName,
            shopLogo: settings.shopLogo,
            theme: settings.theme,
            footerText: settings.footerText
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ADMIN ROUTES (auth required)
router.use(authenticate);
router.use(isAdmin);

// Get settings (admin only)
router.get('/', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
            await settings.save();
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update settings
router.put('/', (req, res, next) => {
    upload.single('logo')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'Logo file too large. Maximum size is 1MB.' });
            }
            return res.status(400).json({ message: err.message });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        
        updateSettingsHandler(req, res);
    });
});

async function updateSettingsHandler(req, res) {
    try {
        console.log('Updating settings with data:', req.body);
        console.log('File uploaded:', req.file ? req.file.path : 'none');
        
        let settings = await Settings.findOne();
        if (!settings) {
            console.log('Creating new settings document');
            settings = new Settings();
        } else {
            console.log('Updating existing settings:', settings._id);
        }

        // Update fields
        if (req.body.shopName !== undefined) {
            settings.shopName = req.body.shopName;
            console.log('Set shopName:', req.body.shopName);
        }
        
        if (req.body.stripePublishableKey !== undefined) settings.stripePublishableKey = req.body.stripePublishableKey;
        if (req.body.stripeSecretKey !== undefined) settings.stripeSecretKey = req.body.stripeSecretKey;
        
        // Ensure theme object exists
        if (!settings.theme) {
            settings.theme = {};
        }
        
        if (req.body.headerColor !== undefined) {
            settings.theme.headerColor = req.body.headerColor;
            console.log('Set headerColor:', req.body.headerColor);
        }
        if (req.body.buttonColor !== undefined) {
            settings.theme.buttonColor = req.body.buttonColor;
            console.log('Set buttonColor:', req.body.buttonColor);
        }
        if (req.body.fontFamily !== undefined) settings.theme.fontFamily = req.body.fontFamily;
        
        if (req.body.footerText !== undefined) {
            settings.footerText = req.body.footerText;
            console.log('Set footerText:', req.body.footerText);
        }
        
        if (req.file) {
            settings.shopLogo = req.file.path;
            console.log('Set shopLogo:', req.file.path);
        }
        
        // Handle logo removal
        if (req.body.removeLogo === 'true' || req.body.removeLogo === true) {
            settings.shopLogo = null;
            console.log('Logo removed from settings');
        }

        settings.updatedAt = Date.now();
        settings.markModified('theme'); // Ensure nested object is saved
        await settings.save();
        
        console.log('Settings saved successfully:', settings);

        res.json(settings);
    } catch (err) {
        console.error('Error saving settings:', err);
        res.status(500).json({ message: err.message });
    }
}

module.exports = router;