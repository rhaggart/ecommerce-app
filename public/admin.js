// public/admin.js - Complete admin dashboard JavaScript
const multer = require('multer');
const path = require('path');

// Configure multer for Railway
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Use /app/uploads for Railway or ./uploads for local
        const uploadPath = process.env.RAILWAY_ENVIRONMENT ? '/app/uploads' : './uploads';
        cb(null, uploadPath);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// In your product creation route
router.post('/products', upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'logo', maxCount: 1 }
]), async (req, res) => {
    try {
        const productData = {
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            quantity: req.body.quantity || 0,
            images: [],
            logoImage: null,
            hasPrintSizes: req.body.hasPrintSizes === 'true',
            printSizes: []
        };

        // Handle image paths for Railway
        if (req.files['images']) {
            productData.images = req.files['images'].map(file => {
                // Return just filename, we'll construct full path in frontend
                return file.filename;
            });
        }

        if (req.files['logo']) {
            productData.logoImage = req.files['logo'][0].filename;
        }

        // Parse print sizes
        if (productData.hasPrintSizes && req.body.printSizes) {
            const sizes = Array.isArray(req.body.printSizes) 
                ? req.body.printSizes 
                : Object.values(req.body.printSizes);
            
            productData.printSizes = sizes.map(size => ({
                size: size.size,
                price: parseFloat(size.price)
            }));
        }

        const product = new Product(productData);
        await product.save();
        res.json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: error.message });
    }
});
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'login.html';
}

let printSizesTemplate = [];
let productPrintSizes = [];

async function loadPrintSizeTemplates() {
    try {
        const response = await fetch('/api/settings');
        const settings = await response.json();
        
        if (settings.printSizes && settings.printSizes.length > 0) {
            printSizesTemplate = settings.printSizes;
        }
    } catch (error) {
        console.error('Error loading print size templates:', error);
    }
}

function displayPrintSizeOptions() {
    const container = document.getElementById('printSizesContainer');
    
    if (printSizesTemplate.length === 0) {
        container.innerHTML = `
            <p style="color: var(--text-tertiary); margin: 16px 0;">
                No print sizes configured. 
                <a href="settings.html" style="color: var(--accent-primary);">Go to Settings</a> to add print size templates first.
            </p>
        `;
        return;
    }
    
    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 2px solid var(--border-color);">
                    <th style="text-align: left; padding: 12px 8px; font-weight: 600;">Size</th>
                    <th style="text-align: left; padding: 12px 8px; font-weight: 600;">Quantity Available</th>
                    <th style="text-align: left; padding: 12px 8px; font-weight: 600;">Additional Price</th>
                </tr>
            </thead>
            <tbody>
                ${printSizesTemplate.map((template, index) => `
                    <tr>
                        <td style="padding: 12px 8px;">
                            <label style="display: flex; align-items: center; cursor: pointer; font-weight: 500;">
                                <input type="checkbox" 
                                       id="size_${index}" 
                                       value="${index}"
                                       onchange="togglePrintSize(${index})"
                                       style="margin-right: 12px; width: 16px; height: 16px;">
                                ${template.size}
                            </label>
                        </td>
                        <td style="padding: 12px 8px;">
                            <input type="number" 
                                   id="size_qty_${index}" 
                                   min="0" 
                                   value="0"
                                   disabled
                                   placeholder="Enter quantity"
                                   style="width: 120px; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px;"
                                   onchange="updatePrintSizeQuantity(${index})">
                        </td>
                        <td style="padding: 12px 8px;">
                            <span style="color: var(--accent-primary); font-weight: 600;">
                                +$${template.additionalPrice.toFixed(2)}
                            </span>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <p style="margin-top: 16px; color: var(--text-secondary); font-size: 0.875rem;">
            Select sizes and enter the quantity available for each size. The base product quantity will be set to 0 when using print sizes.
        </p>
    `;
}

function togglePrintSize(index) {
    const checkbox = document.getElementById(`size_${index}`);
    const quantityInput = document.getElementById(`size_qty_${index}`);
    
    if (checkbox.checked) {
        quantityInput.disabled = false;
        quantityInput.value = 1; // Default to 1 when enabled
        quantityInput.focus(); // Focus on the input for easy entry
        updateProductPrintSizes();
    } else {
        quantityInput.disabled = true;
        quantityInput.value = 0;
        updateProductPrintSizes();
    }
}

function updatePrintSizeQuantity(index) {
    const quantityInput = document.getElementById(`size_qty_${index}`);
    const checkbox = document.getElementById(`size_${index}`);
    
    // Auto-check the checkbox if quantity > 0
    if (quantityInput.value > 0 && !checkbox.checked) {
        checkbox.checked = true;
        quantityInput.disabled = false;
    }
    
    updateProductPrintSizes();
}

function updateProductPrintSizes() {
    productPrintSizes = [];
    
    printSizesTemplate.forEach((template, index) => {
        const checkbox = document.getElementById(`size_${index}`);
        const quantityInput = document.getElementById(`size_qty_${index}`);
        
        if (checkbox && checkbox.checked && quantityInput && parseInt(quantityInput.value) > 0) {
            productPrintSizes.push({
                size: template.size,
                quantity: parseInt(quantityInput.value),
                additionalPrice: template.additionalPrice
            });
        }
    });
}

// Handle print sizes checkbox
document.addEventListener('DOMContentLoaded', () => {
    const hasPrintSizesCheckbox = document.getElementById('hasPrintSizes');
    if (hasPrintSizesCheckbox) {
        hasPrintSizesCheckbox.addEventListener('change', (e) => {
            const section = document.getElementById('printSizesSection');
            const quantityInput = document.getElementById('quantity');
            
            if (e.target.checked) {
                section.style.display = 'block';
                displayPrintSizeOptions();
                // Disable regular quantity when using print sizes
                if (quantityInput) {
                    quantityInput.value = 0;
                    quantityInput.disabled = true;
                    quantityInput.parentElement.querySelector('label').innerHTML = 
                        'Regular Quantity <span style="color: var(--text-tertiary); font-size: 0.875rem;">(disabled when using print sizes)</span>';
                }
            } else {
                section.style.display = 'none';
                productPrintSizes = [];
                // Re-enable regular quantity
                if (quantityInput) {
                    quantityInput.disabled = false;
                    quantityInput.parentElement.querySelector('label').innerHTML = 'Quantity';
                }
            }
        });
    }
    
    // Handle form submission
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
});

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', document.getElementById('name').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('price', document.getElementById('price').value);
    formData.append('category', document.getElementById('category').value || 'Uncategorized');
    
    // Handle quantity based on print sizes
    if (document.getElementById('hasPrintSizes').checked && productPrintSizes.length > 0) {
        formData.append('quantity', '0'); // Set to 0 when using print sizes
        formData.append('printSizes', JSON.stringify(productPrintSizes));
    } else {
        formData.append('quantity', document.getElementById('quantity').value);
    }
    
    // Add multiple images
    const imageFiles = document.getElementById('images').files;
    if (imageFiles.length === 0) {
        alert('Please select at least one image');
        return;
    }
    
    for (let i = 0; i < imageFiles.length; i++) {
        formData.append('images', imageFiles[i]);
    }
    
    try {
        const response = await fetch('/api/admin/products', {
            method: 'POST',
            headers: {'Authorization': `Bearer ${token}`},
            body: formData
        });
        
        if (response.ok) {
            alert('Product added successfully!');
            e.target.reset();
            document.getElementById('printSizesSection').style.display = 'none';
            document.getElementById('quantity').disabled = false;
            document.getElementById('quantity').parentElement.querySelector('label').innerHTML = 'Quantity';
            productPrintSizes = [];
            loadProducts();
        } else {
            const error = await response.json();
            alert('Error adding product: ' + (error.message || 'Unknown error'));
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function displayProducts(products) {
    const container = document.getElementById('productList');
    if (!container) return;
    
    container.innerHTML = products.map(product => {
        let stockInfo = '';
        
        if (product.printSizes && product.printSizes.length > 0) {
            const totalStock = product.printSizes.reduce((sum, size) => sum + size.quantity, 0);
            stockInfo = `
                <p><strong>Print Sizes:</strong> ${product.printSizes.length} sizes</p>
                <p><strong>Total Stock:</strong> ${totalStock} units</p>
                <div style="margin-top: 8px; padding: 8px; background: var(--bg-tertiary); border-radius: 6px;">
                    ${product.printSizes.map(size => `
                        <span style="display: inline-block; margin: 4px; padding: 4px 8px; background: var(--bg-primary); border-radius: 4px; font-size: 0.875rem;">
                            ${size.size}: <strong>${size.quantity}</strong> @ +$${size.additionalPrice.toFixed(2)}
                        </span>
                    `).join('')}
                </div>
            `;
        } else {
            stockInfo = `<p><strong>Quantity:</strong> ${product.quantity} units</p>`;
        }
        
        return `
            <div class="admin-product-card">
                <img src="/uploads/${product.images[0]}" alt="${product.name}">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <p><strong>Base Price:</strong> $${product.price.toFixed(2)}</p>
                    ${stockInfo}
                    <p><strong>Category:</strong> ${product.category || 'Uncategorized'}</p>
                    ${product.images.length > 1 ? `<p><strong>Images:</strong> ${product.images.length}</p>` : ''}
                </div>
                <button onclick="deleteProduct('${product._id}')" class="delete-btn">Delete</button>
            </div>
        `;
    }).join('');
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        const response = await fetch(`/api/admin/products/${id}`, {
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${token}`}
        });
        
        if (response.ok) {
            loadProducts();
            showNotification('Product deleted successfully');
        } else {
            alert('Error deleting product');
        }
    } catch (error) {
        alert('Error deleting product: ' + error.message);
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: var(--success);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Initialize on page load
loadPrintSizeTemplates();
loadProducts();