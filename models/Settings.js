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
        headerColor: {
            type: String,
            default: '#333333'
        },
        buttonColor: {
            type: String,
            default: '#3498db'
        },
        fontFamily: {
            type: String,
            default: 'Arial, sans-serif'
        }
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Settings', settingsSchema);
```

### 3. Create `models/PrintSize.js`

```javascript
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