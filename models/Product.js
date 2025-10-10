const mongoose = require('mongoose');

const printSizeSchema = new mongoose.Schema({
    size: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PrintSize',
        required: true
    },
    quantity: {
        type: String, // Can be number or 'unlimited'
        required: true
    }
});

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    images: [{
        type: String,
        required: true
    }],
    printSizes: [printSizeSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);