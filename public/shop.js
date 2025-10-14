// public/shop.js - Complete file for the shop page
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let products = [];
let currentProduct = null;
let currentImageIndex = 0;
let settings = {};

async function loadSettings() {
    try {
        const response = await fetch('/api/settings/public');
        settings = await response.json();
        
        // Apply branding - prioritize logo over name
        const shopBranding = document.getElementById('shopBranding');
        const shopNameElement = document.getElementById('shopName');
        
        if (settings.shopLogo) {
            // Replace with logo if available
            shopBranding.innerHTML = `<img src="${settings.shopLogo}" alt="${settings.shopName || 'Store Logo'}" style="height: 40px; max-width: 200px; object-fit: contain;">`;
            document.getElementById('pageTitle').textContent = settings.shopName || 'Shop';
        } else if (settings.shopName) {
            // Show store name if no logo
            shopNameElement.textContent = settings.shopName;
            document.getElementById('pageTitle').textContent = settings.shopName;
        }
        
        // Apply theme colors
        if (settings.theme && settings.theme.headerColor) {
            document.documentElement.style.setProperty('--accent-primary', settings.theme.headerColor);
        }
        if (settings.theme && settings.theme.buttonColor) {
            document.documentElement.style.setProperty('--accent-hover', settings.theme.buttonColor);
        }
        
        // Apply footer text
        if (settings.footerText) {
            const footer = document.querySelector('footer p');
            if (footer) {
                footer.textContent = settings.footerText;
            }
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        products = await response.json();
        displayProducts(products);
        updateCartCount();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function displayProducts(productsToShow) {
    const container = document.getElementById('products');
    
    container.innerHTML = productsToShow.map(product => {
        // Calculate total stock including all print sizes
        let totalStock = product.quantity || 0;
        if (product.printSizes && product.printSizes.length > 0) {
            totalStock = product.printSizes.reduce((sum, size) => sum + (size.quantity || 0), 0);
        }
        
        return `
            <div class="product-card" onclick="showProductModal('${product._id}')">
                <img src="${product.images[0]}" alt="${product.name}">
                <div class="product-card-content">
                    <h3>${product.name}</h3>
                    <p class="price">$${product.price.toFixed(2)}</p>
                    ${totalStock > 0 
                        ? `<p class="in-stock">In Stock</p>`
                        : `<p class="out-of-stock">Out of Stock</p>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

function showProductModal(productId) {
    currentProduct = products.find(p => p._id === productId);
    currentImageIndex = 0;
    
    const modal = document.getElementById('productModal');
    document.getElementById('modalProductName').textContent = currentProduct.name;
    document.getElementById('modalProductPrice').textContent = `$${currentProduct.price.toFixed(2)}`;
    document.getElementById('modalProductDescription').textContent = currentProduct.description;
    
    // Display stock information
    if (currentProduct.printSizes && currentProduct.printSizes.length > 0) {
        // Don't show quantity for products with print sizes
        document.getElementById('modalProductQuantity').style.display = 'none';
    } else {
        // Show regular quantity for products without print sizes
        document.getElementById('modalProductQuantity').style.display = 'block';
        document.getElementById('modalProductQuantity').textContent = 
            currentProduct.quantity > 0 ? `${currentProduct.quantity} in stock` : 'Out of stock';
    }
    
    // Display images
    updateModalImages();
    
    // Display print sizes if available
    const sizesContainer = document.getElementById('printSizesContainer');
    const sizeOptions = document.getElementById('sizeOptions');
    
    if (currentProduct.printSizes && currentProduct.printSizes.length > 0) {
        // Filter to only show sizes with quantity > 0
        const availableSizes = currentProduct.printSizes.filter(size => size.quantity > 0);
        
        if (availableSizes.length > 0) {
            sizesContainer.style.display = 'block';
            sizeOptions.innerHTML = availableSizes.map((size, index) => `
                <label>
                    <input type="radio" name="printSize" value="${index}" 
                           ${index === 0 ? 'checked' : ''} 
                           onchange="updatePriceForSize(${index})"
                           data-size="${size.size}"
                           data-quantity="${size.quantity}"
                           data-price="${size.additionalPrice}">
                    <span class="size-name">${size.size}</span>
                    ${size.additionalPrice > 0 ? `<span class="size-price">+$${size.additionalPrice.toFixed(2)}</span>` : ''}
                    <span class="size-stock">${size.quantity} available</span>
                </label>
            `).join('');
            
            // Update price for first size if it has additional cost
            if (availableSizes[0].additionalPrice > 0) {
                updatePriceForSize(0);
            }
        } else {
            sizesContainer.style.display = 'none';
            document.getElementById('modalProductQuantity').style.display = 'block';
            document.getElementById('modalProductQuantity').textContent = 'Out of stock';
        }
    } else {
        sizesContainer.style.display = 'none';
    }
    
    modal.style.display = 'block';
}

function updateModalImages() {
    const mainImage = document.getElementById('modalMainImage');
    mainImage.src = currentProduct.images[currentImageIndex];
    
    const thumbnailContainer = document.getElementById('thumbnails');
    if (currentProduct.images.length > 1) {
        thumbnailContainer.innerHTML = currentProduct.images.map((image, index) => `
            <img src="${image}" 
                 class="thumbnail ${index === currentImageIndex ? 'active' : ''}"
                 onclick="selectImage(${index})" alt="">
        `).join('');
    } else {
        thumbnailContainer.innerHTML = '';
    }
}

function selectImage(index) {
    currentImageIndex = index;
    updateModalImages();
}

function previousImage() {
    currentImageIndex = (currentImageIndex - 1 + currentProduct.images.length) % currentProduct.images.length;
    updateModalImages();
}

function nextImage() {
    currentImageIndex = (currentImageIndex + 1) % currentProduct.images.length;
    updateModalImages();
}

function updatePriceForSize(index) {
    if (currentProduct.printSizes && currentProduct.printSizes.length > 0) {
        const availableSizes = currentProduct.printSizes.filter(size => size.quantity > 0);
        if (availableSizes[index]) {
            const totalPrice = currentProduct.price + (availableSizes[index].additionalPrice || 0);
            document.getElementById('modalProductPrice').textContent = `$${totalPrice.toFixed(2)}`;
        }
    }
}

function addToCart() {
    if (!currentProduct) return;
    
    // Check if product has print sizes
    if (currentProduct.printSizes && currentProduct.printSizes.length > 0) {
        const selectedSizeInput = document.querySelector('input[name="printSize"]:checked');
        if (!selectedSizeInput) {
            alert('Please select a size');
            return;
        }
        
        const sizeIndex = parseInt(selectedSizeInput.value);
        const availableSizes = currentProduct.printSizes.filter(size => size.quantity > 0);
        const selectedSize = availableSizes[sizeIndex];
        
        if (!selectedSize || selectedSize.quantity <= 0) {
            alert('This size is out of stock');
            return;
        }
        
        const cartItem = {
            id: currentProduct._id,
            name: currentProduct.name,
            price: currentProduct.price + (selectedSize.additionalPrice || 0),
            basePrice: currentProduct.price,
            image: currentProduct.images[0],
            quantity: 1,
            size: selectedSize.size
        };
        
        // Check if this exact product and size combo exists in cart
        const existingItem = cart.find(item => 
            item.id === cartItem.id && item.size === cartItem.size
        );
        
        if (existingItem) {
            // Check if we can add more
            const cartQuantity = existingItem.quantity;
            if (cartQuantity >= selectedSize.quantity) {
                alert(`Only ${selectedSize.quantity} available for this size`);
                return;
            }
            existingItem.quantity++;
        } else {
            cart.push(cartItem);
        }
    } else {
        // Regular product without print sizes
        if (currentProduct.quantity <= 0) {
            alert('Product is out of stock');
            return;
        }
        
        const cartItem = {
            id: currentProduct._id,
            name: currentProduct.name,
            price: currentProduct.price,
            image: currentProduct.images[0],
            quantity: 1
        };
        
        const existingItem = cart.find(item => item.id === cartItem.id && !item.size);
        
        if (existingItem) {
            if (existingItem.quantity >= currentProduct.quantity) {
                alert(`Only ${currentProduct.quantity} available`);
                return;
            }
            existingItem.quantity++;
        } else {
            cart.push(cartItem);
        }
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    closeModal();
    showNotification('Added to cart!');
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countElement = document.getElementById('cartCount');
    if (countElement) {
        countElement.textContent = count > 0 ? count : '';
    }
}

function closeModal() {
    document.getElementById('productModal').style.display = 'none';
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: var(--accent-primary);
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // Click outside modal to close
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('productModal');
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Load settings and products
    loadSettings();
    loadProducts();
});

// Add styles for print sizes and notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .size-options label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        gap: 12px;
    }
    
    .size-options label .size-name {
        font-weight: 500;
        min-width: 80px;
    }
    
    .size-options label .size-price {
        color: var(--accent-primary);
        font-weight: 600;
        margin-left: auto;
    }
    
    .size-options label .size-stock {
        color: var(--text-tertiary);
        font-size: 0.875rem;
        min-width: 80px;
        text-align: right;
    }
`;
document.head.appendChild(style);