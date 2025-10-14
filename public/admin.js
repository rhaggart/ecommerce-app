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
        console.log('✅ Drop zone initialized successfully');
        
        // Click to select - trigger on any click within drop zone
        dropZone.addEventListener('click', (e) => {
            console.log('Drop zone clicked!', e.target);
            
            // Only prevent if clicking on actual preview images or buttons
            if (e.target.closest('#imagePreview img') || e.target.closest('button')) {
                console.log('Click ignored - preview image or button');
                return;
            }
            
            console.log('Opening file dialog...');
            fileInput.click();
        });
        
        // Drag over
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        // Drag leave
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        
        // Drop
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
            if (files.length > 0) {
                const dataTransfer = new DataTransfer();
                files.forEach(file => dataTransfer.items.add(file));
                fileInput.files = dataTransfer.files;
                updateImagePreview();
            }
        });
        
        // File input change
        fileInput.addEventListener('change', updateImagePreview);
    }
}

function handleFiles(files) {
    const fileInput = document.getElementById('images');
    const dataTransfer = new DataTransfer();
    
    // Add existing files
    Array.from(fileInput.files).forEach(file => dataTransfer.items.add(file));
    
    // Add new files, but check for duplicates
    files.forEach(file => {
        const isDuplicate = Array.from(fileInput.files).some(existingFile => 
            existingFile.name === file.name && existingFile.size === file.size
        );
        if (!isDuplicate) {
            dataTransfer.items.add(file);
        }
    });
    
    fileInput.files = dataTransfer.files;
    updateImagePreview();
}


function updateImagePreview() {
    const fileInput = document.getElementById('images');
    const preview = document.getElementById('imagePreview');
    
    if (!preview) return;
    
    if (fileInput.files.length === 0) {
        preview.style.display = 'none';
        return;
    }
    
    // Check file sizes
    const maxSize = 1000000; // 1MB
    const oversizedFiles = Array.from(fileInput.files).filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
        alert(`⚠️ Maximum image size is 1MB.\n\n${oversizedFiles.length} file(s) are too large:\n${oversizedFiles.map(f => `- ${f.name} (${(f.size / 1000000).toFixed(2)}MB)`).join('\n')}\n\nPlease compress your images before uploading.`);
        fileInput.value = ''; // Clear the selection
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
    
    // Add print sizes if enabled
    if (hasPrintSizes && productPrintSizes.length > 0) {
        formData.append('printSizes', JSON.stringify(productPrintSizes));
    }
    
    try {
        // Show progress bar
        const progressDiv = document.getElementById('uploadProgress');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        progressDiv.style.display = 'block';
        progressBar.style.width = '0%';
        progressText.textContent = 'Uploading...';
        
        const response = await fetch('/api/admin/products', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (response.ok) {
            // Update progress to 100%
            progressBar.style.width = '100%';
            progressText.textContent = 'Upload complete!';
            
            setTimeout(() => {
                alert('Product created successfully!');
                document.getElementById('productForm').reset();
                document.getElementById('printSizeSection').style.display = 'none';
                document.getElementById('imagePreview').style.display = 'none';
                progressDiv.style.display = 'none';
                productPrintSizes = [];
                loadProducts();
            }, 500);
        } else {
            progressDiv.style.display = 'none';
            const errorText = await response.text();
            let errorMsg = 'Unknown error';
            try {
                const errorData = JSON.parse(errorText);
                errorMsg = errorData.message || errorText;
            } catch (e) {
                errorMsg = errorText || response.statusText;
            }
            
            if (errorMsg.includes('too large') || errorMsg.includes('File too large')) {
                alert('⚠️ Maximum image size is 1MB.\n\nOne or more of your images is too large. Please compress your images before uploading.');
            } else {
                alert('Error creating product: ' + errorMsg);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        progressDiv.style.display = 'none';
        
        if (error.message.includes('Failed to fetch')) {
            alert('⚠️ Error: Could not connect to server.\n\nThe images might be too large (max 1MB each) or check your internet connection.');
        } else {
            alert('Error creating product: ' + error.message);
        }
    }
});

// Load and display products
async function loadProducts() {
    try {
        const response = await fetch('/api/admin/products/all', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function displayProducts(products) {
    const container = document.getElementById('productsList');
    if (!container) return;
    
    container.innerHTML = products.map(product => {
        const imageUrl = (product.images && product.images[0]) ? product.images[0] : 'https://via.placeholder.com/80?text=No+Image';
        const name = product.name || 'Unnamed Product';
        const description = product.description || 'No description';
        const price = product.price ? product.price.toFixed(2) : '0.00';
        const hasInvalidData = !product.name || !product.images || product.images.length === 0;
        
        return `
        <div class="product-item" style="border: 1px solid ${hasInvalidData ? 'var(--danger)' : 'var(--border-color)'}; border-radius: 8px; padding: 16px; margin-bottom: 16px; ${hasInvalidData ? 'background: rgba(239, 68, 68, 0.05);' : ''}">
            <div style="display: flex; gap: 16px; align-items: flex-start;">
                <img src="${imageUrl}" alt="${name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px;" onerror="this.src='https://via.placeholder.com/80?text=Error'">
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 8px 0; color: var(--text-primary);">${name}</h3>
                    ${hasInvalidData ? '<p style="margin: 0 0 8px 0; color: var(--danger); font-size: 0.75rem; font-weight: 600;">⚠️ INVALID DATA - Delete this product</p>' : ''}
                    <p style="margin: 0 0 8px 0; color: var(--text-secondary); font-size: 0.875rem;">${description}</p>
                    <p style="margin: 0; color: var(--accent-primary); font-weight: 600;">$${price}</p>
                    ${product.printSizes && product.printSizes.length > 0 ? '<span style="background: var(--accent-muted); color: var(--accent-primary); padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;">Print Sizes</span>' : ''}
                </div>
                <div>
                    <button onclick="deleteProduct('${product._id}')" class="btn btn-danger">Delete</button>
                </div>
            </div>
        </div>
    `;
    }).join('');
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
});