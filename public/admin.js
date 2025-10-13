// public/admin.js - Admin dashboard JavaScript
const token = localStorage.getItem('token') || getCookie('adminToken');
if (!token) {
    window.location.href = 'login.html';
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

let printSizesTemplate = [];
let productPrintSizes = [];

async function loadPrintSizeTemplates() {
    try {
        const response = await fetch('/api/print-sizes');
        const sizes = await response.json();
        
        if (sizes && sizes.length > 0) {
            printSizesTemplate = sizes.map(size => ({
                size: size.name,
                dimensions: size.dimensions,
                additionalPrice: 0 // Default additional price
            }));
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
                    <th style="text-align: left; padding: 12px 8px; font-weight: 600;">Quantity</th>
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
                                ${template.size} (${template.dimensions})
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
                            <input type="number" 
                                   id="size_price_${index}" 
                                   min="0" 
                                   step="0.01"
                                   value="${template.additionalPrice}"
                                   disabled
                                   placeholder="0.00"
                                   style="width: 120px; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px;"
                                   onchange="updatePrintSizePrice(${index})">
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <p style="margin-top: 16px; color: var(--text-secondary); font-size: 0.875rem;">
            Select sizes and enter the quantity and additional price for each size.
        </p>
    `;
}

function togglePrintSize(index) {
    const checkbox = document.getElementById(`size_${index}`);
    const quantityInput = document.getElementById(`size_qty_${index}`);
    const priceInput = document.getElementById(`size_price_${index}`);
    
    if (checkbox.checked) {
        quantityInput.disabled = false;
        priceInput.disabled = false;
        quantityInput.value = 1; // Default to 1 when enabled
        quantityInput.focus(); // Focus on the input for easy entry
        updateProductPrintSizes();
    } else {
        quantityInput.disabled = true;
        priceInput.disabled = true;
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
        document.getElementById(`size_price_${index}`).disabled = false;
    }
    
    updateProductPrintSizes();
}

function updatePrintSizePrice(index) {
    updateProductPrintSizes();
}

function updateProductPrintSizes() {
    productPrintSizes = [];
    
    printSizesTemplate.forEach((template, index) => {
        const checkbox = document.getElementById(`size_${index}`);
        const quantityInput = document.getElementById(`size_qty_${index}`);
        const priceInput = document.getElementById(`size_price_${index}`);
        
        if (checkbox && checkbox.checked && quantityInput && parseInt(quantityInput.value) > 0) {
            productPrintSizes.push({
                size: template.size,
                quantity: parseInt(quantityInput.value),
                additionalPrice: parseFloat(priceInput.value) || 0
            });
        }
    });
}

// Handle print sizes checkbox
document.addEventListener('DOMContentLoaded', () => {
    const hasPrintSizesCheckbox = document.getElementById('hasPrintSizes');
    const printSizeSection = document.getElementById('printSizeSection');
    
    hasPrintSizesCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            printSizeSection.style.display = 'block';
            loadPrintSizeTemplates().then(() => {
                displayPrintSizeOptions();
            });
        } else {
            printSizeSection.style.display = 'none';
            productPrintSizes = [];
        }
    });
    
    // Load initial print size templates
    loadPrintSizeTemplates();
});

// Initialize drag & drop functionality
function initializeDragDrop() {
    // Main images drag & drop
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('images');
    
    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
            handleFiles(files);
        });
    }
    
    // Logo drag & drop
    const logoDropZone = document.getElementById('logoDropZone');
    const logoInput = document.getElementById('logoUpload');
    
    if (logoDropZone && logoInput) {
        logoDropZone.addEventListener('click', () => logoInput.click());
        logoDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            logoDropZone.classList.add('drag-over');
        });
        logoDropZone.addEventListener('dragleave', () => {
            logoDropZone.classList.remove('drag-over');
        });
        logoDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            logoDropZone.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
            if (files.length > 0) {
                handleLogoFile(files[0]);
            }
        });
    }
}

function handleFiles(files) {
    const fileInput = document.getElementById('images');
    const dataTransfer = new DataTransfer();
    
    // Add existing files
    Array.from(fileInput.files).forEach(file => dataTransfer.items.add(file));
    
    // Add new files
    files.forEach(file => dataTransfer.items.add(file));
    
    fileInput.files = dataTransfer.files;
    updateImagePreview();
}

function handleLogoFile(file) {
    const logoInput = document.getElementById('logoUpload');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    logoInput.files = dataTransfer.files;
    updateLogoPreview();
}

function updateImagePreview() {
    const fileInput = document.getElementById('images');
    const preview = document.getElementById('imagePreview');
    
    if (!preview) return;
    
    if (fileInput.files.length === 0) {
        preview.style.display = 'none';
        return;
    }
    
    preview.style.display = 'block';
    preview.innerHTML = '';
    
    Array.from(fileInput.files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.cssText = 'width: 100px; height: 100px; object-fit: cover; margin: 5px; border-radius: 8px;';
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
}

function updateLogoPreview() {
    const logoInput = document.getElementById('logoUpload');
    const preview = document.getElementById('logoPreview');
    const previewImg = document.getElementById('logoPreviewImage');
    
    if (!preview || !previewImg) return;
    
    if (logoInput.files.length === 0) {
        preview.style.display = 'none';
        return;
    }
    
    const file = logoInput.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function removeLogo() {
    document.getElementById('logoUpload').value = '';
    document.getElementById('logoPreview').style.display = 'none';
}

// Product form submission
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    const name = document.getElementById('name').value;
    const description = document.getElementById('description').value;
    const price = document.getElementById('price').value;
    const images = document.getElementById('images').files;
    const logoFile = document.getElementById('logoUpload').files[0];
    const hasPrintSizes = document.getElementById('hasPrintSizes').checked;
    
    // Add basic product data
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('hasPrintSizes', hasPrintSizes);
    
    // Add images
    Array.from(images).forEach((image, index) => {
        formData.append('images', image);
    });
    
    // Add logo if exists
    if (logoFile) {
        formData.append('logo', logoFile);
    }
    
    // Add print sizes if enabled
    if (hasPrintSizes && productPrintSizes.length > 0) {
        formData.append('printSizes', JSON.stringify(productPrintSizes));
    }
    
    try {
        const response = await fetch('/api/admin/products', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (response.ok) {
            alert('Product created successfully!');
            document.getElementById('productForm').reset();
            document.getElementById('printSizeSection').style.display = 'none';
            document.getElementById('imagePreview').style.display = 'none';
            document.getElementById('logoPreview').style.display = 'none';
            productPrintSizes = [];
            loadProducts();
        } else {
            const error = await response.json();
            alert('Error creating product: ' + (error.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error creating product: ' + error.message);
    }
});

// Load and display products
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
    const container = document.getElementById('productsList');
    if (!container) return;
    
    container.innerHTML = products.map(product => `
        <div class="product-item" style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; gap: 16px; align-items: flex-start;">
                <img src="${product.images[0]}" alt="${product.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px;">
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 8px 0; color: var(--text-primary);">${product.name}</h3>
                    <p style="margin: 0 0 8px 0; color: var(--text-secondary); font-size: 0.875rem;">${product.description}</p>
                    <p style="margin: 0; color: var(--accent-primary); font-weight: 600;">$${product.price.toFixed(2)}</p>
                    ${product.hasPrintSizes ? '<span style="background: var(--accent-muted); color: var(--accent-primary); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;">Print Sizes</span>' : ''}
                </div>
                <div>
                    <button onclick="editProduct('${product._id}')" class="btn btn-secondary" style="margin-right: 8px;">Edit</button>
                    <button onclick="deleteProduct('${product._id}')" class="btn btn-danger">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

function editProduct(productId) {
    // TODO: Implement edit functionality
    alert('Edit functionality coming soon!');
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        const response = await fetch(`/api/admin/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            alert('Product deleted successfully!');
            loadProducts();
        } else {
            alert('Error deleting product');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error deleting product: ' + error.message);
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Clear admin cookie
    document.cookie = 'adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = 'login.html';
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeDragDrop();
    loadProducts();
    
    // Set up file input change handlers
    const imagesInput = document.getElementById('images');
    if (imagesInput) {
        imagesInput.addEventListener('change', updateImagePreview);
    }
    
    const logoInput = document.getElementById('logoUpload');
    if (logoInput) {
        logoInput.addEventListener('change', updateLogoPreview);
    }
});