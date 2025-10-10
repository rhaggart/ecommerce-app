const mongoose = require('mongoose');

const printSizeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    dimensions: {
        type: String,
        required: true
    },
    order: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PrintSize', printSizeSchema);