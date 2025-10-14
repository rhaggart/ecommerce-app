const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    shopName: {
        type: String,
        default: 'Our Store'
    },
    shopLogo: {
        type: String,
        default: null
    },
    stripePublishableKey: {
        type: String,
        default: ''
    },
    stripeSecretKey: {
        type: String,
        default: ''
    },
    theme: {
        // Legacy fields (keep for compatibility)
        headerColor: {
            type: String,
            default: '#8B5CF6'
        },
        buttonColor: {
            type: String,
            default: '#7C3AED'
        },
        fontFamily: {
            type: String,
            default: 'Arial, sans-serif'
        },
        
        // Comprehensive color system
        colors: {
            primary: { type: String, default: '#8B5CF6' },
            secondary: { type: String, default: '#7C3AED' },
            background: { type: String, default: '#F7F8F9' },
            cardBackground: { type: String, default: '#FFFFFF' },
            textPrimary: { type: String, default: '#111827' },
            textSecondary: { type: String, default: '#6B7280' },
            headerBg: { type: String, default: '#FFFFFF' },
            footerBg: { type: String, default: '#F3F4F6' },
            buttonBg: { type: String, default: '#8B5CF6' },
            buttonText: { type: String, default: '#FFFFFF' },
            borderColor: { type: String, default: '#E5E7EB' },
            success: { type: String, default: '#10B981' },
            danger: { type: String, default: '#EF4444' }
        },
        
        // Typography system
        fonts: {
            primary: { type: String, default: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif' },
            heading: { type: String, default: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif' },
            baseSize: { type: String, default: '16px' },
            h1Size: { type: String, default: '2.5rem' },
            h2Size: { type: String, default: '2rem' },
            h3Size: { type: String, default: '1.5rem' },
            priceSize: { type: String, default: '1.25rem' },
            smallSize: { type: String, default: '0.875rem' }
        },
        
        // Spacing system
        spacing: {
            headerPadding: { type: String, default: '16px 24px' },
            productGap: { type: String, default: '24px' },
            cardPadding: { type: String, default: '24px' },
            sectionMargin: { type: String, default: '48px' }
        },
        
        // Layout system
        layout: {
            maxWidth: { type: String, default: '1200px' },
            productColumns: { type: String, default: 'auto-fill' },
            productMinWidth: { type: String, default: '280px' },
            productImageHeight: { type: String, default: '240px' }
        },
        
        // Style effects
        style: {
            borderRadius: { type: String, default: '12px' },
            borderWidth: { type: String, default: '1px' },
            shadowIntensity: { type: String, default: 'medium' },
            cardHoverEffect: { type: String, default: 'lift' }
        },
        
        // Header customization
        header: {
            height: { type: String, default: 'auto' },
            logoPosition: { type: String, default: 'left' },
            logoSize: { type: String, default: '40px' },
            sticky: { type: Boolean, default: true }
        },
        
        // Footer customization
        footer: {
            padding: { type: String, default: '32px 24px' },
            alignment: { type: String, default: 'center' }
        }
    },
    footerText: {
        type: String,
        default: '© 2024. All rights reserved.'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Settings', settingsSchema);