// public/shop.js - Complete file for the shop page
let cart = [];
try {
    const cartData = localStorage.getItem('cart');
    if (cartData) {
        cart = JSON.parse(cartData);
        if (!Array.isArray(cart)) cart = [];
    }
} catch (e) {
    console.error('Error parsing cart from localStorage:', e);
    cart = [];
    localStorage.setItem('cart', '[]');
}
let products = [];
let currentProduct = null;
let currentImageIndex = 0;
let settings = {};

// Clean cart of deleted products on page load
function cleanCart() {
    const validCart = cart.filter(item => {
        // Keep items that have valid product IDs
        return item.id && item.name;
    });
    
    if (validCart.length !== cart.length) {
        console.log('Cleaned cart: removed', cart.length - validCart.length, 'invalid items');
        cart = validCart;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
    }
}

async function loadSettings() {
    try {
        const response = await fetch('/api/settings/public');
        if (!response.ok) {
            console.error('Failed to load settings:', response.statusText);
            return;
        }
        settings = await response.json();
        
        console.log('Settings loaded:', settings);
        
        // Apply branding - prioritize logo over name
        const shopBranding = document.getElementById('shopBranding');
        const shopNameElement = document.getElementById('shopName');
        
        console.log('shopBranding element:', shopBranding);
        console.log('shopName element:', shopNameElement);
        console.log('Logo:', settings.shopLogo);
        console.log('Name:', settings.shopName);
        
        if (settings.shopLogo) {
            // Replace with logo if available
            console.log('Setting logo...');
            shopBranding.innerHTML = `<img src="${settings.shopLogo}" alt="${settings.shopName || 'Store Logo'}" style="height: 40px; max-width: 200px; object-fit: contain;">`;
            document.getElementById('pageTitle').textContent = settings.shopName || 'Shop';
        } else if (settings.shopName) {
            // Show store name if no logo
            console.log('Setting store name...');
            shopNameElement.textContent = settings.shopName;
            document.getElementById('pageTitle').textContent = settings.shopName;
        }
        
        // Apply comprehensive theme settings
        if (settings.theme) {
            // Apply colors
            if (settings.theme.colors) {
                const colors = settings.theme.colors;
                console.log('Applying colors:', colors);
                
                // Apply background color directly to body
                if (colors.background) {
                    document.body.style.backgroundColor = colors.background;
                    console.log('Set body background to:', colors.background);
                }
                
                // Apply primary color to buttons using CSS injection
                if (colors.primary) {
                    const style = document.createElement('style');
                    style.id = 'dynamic-theme-colors';
                    style.textContent = `
                        button[class*="bg-indigo"],
                        button[class*="bg-purple"],
                        button[class*="gradient"],
                        .bg-gradient-to-r {
                            background: ${colors.primary} !important;
                        }
                        button[class*="bg-indigo"]:hover,
                        button[class*="bg-purple"]:hover,
                        button[class*="gradient"]:hover {
                            background: ${colors.secondary || colors.primary} !important;
                            opacity: 0.9;
                        }
                        .text-indigo-600, .bg-clip-text {
                            color: ${colors.primary} !important;
                        }
                    `;
                    const oldStyle = document.getElementById('dynamic-theme-colors');
                    if (oldStyle) oldStyle.remove();
                    document.head.appendChild(style);
                    console.log('Injected button color styles');
                }
                
                // Apply card backgrounds
                if (colors.cardBackground) {
                    const cards = document.querySelectorAll('.bg-white');
                    cards.forEach(card => card.style.backgroundColor = colors.cardBackground);
                    console.log('Applied card backgrounds');
                }
                
                // Apply text colors - exclude gradient elements
                if (colors.textPrimary || colors.textSecondary) {
                    const textStyle = document.createElement('style');
                    textStyle.id = 'dynamic-text-colors';
                    let textStyleContent = '';
                    
                    if (colors.textPrimary) {
                        textStyleContent += `
                            body { color: ${colors.textPrimary} !important; }
                            h1, h2, h3, h4, h5, h6 { color: ${colors.textPrimary} !important; }
                            /* Don't override description and other gray text unless explicitly set */
                            p:not([class*="gradient"]):not([class*="bg-clip"]):not(.text-gray-600):not(.text-gray-500):not(.text-gray-700),
                            span:not([class*="gradient"]):not([class*="bg-clip"]):not(.text-gray-600):not(.text-gray-500):not(.text-gray-700) {
                                color: ${colors.textPrimary} !important;
                            }
                        `;
                    }
                    
                    if (colors.textSecondary) {
                        textStyleContent += `
                            .text-gray-600:not([class*="gradient"]):not([class*="bg-clip"]),
                            .text-gray-500:not([class*="gradient"]):not([class*="bg-clip"]),
                            .text-gray-700:not([class*="gradient"]):not([class*="bg-clip"]),
                            [id*="Description"]:not([class*="gradient"]) {
                                color: ${colors.textSecondary} !important;
                            }
                        `;
                    }
                    
                    // Preserve gradient text
                    textStyleContent += `
                        [class*="bg-gradient"]:not([style*="color"]),
                        [class*="bg-clip-text"] {
                            background-clip: text !important;
                            -webkit-background-clip: text !important;
                        }
                    `;
                    
                    textStyle.textContent = textStyleContent;
                    const oldTextStyle = document.getElementById('dynamic-text-colors');
                    if (oldTextStyle) oldTextStyle.remove();
                    document.head.appendChild(textStyle);
                }
                
                // Apply button text color
                if (colors.buttonText) {
                    const buttons = document.querySelectorAll('button');
                    buttons.forEach(btn => btn.style.color = colors.buttonText);
                }
                
                // Apply header and footer backgrounds
                if (colors.headerBg) {
                    const header = document.querySelector('header, nav');
                    if (header) header.style.backgroundColor = colors.headerBg;
                }
                if (colors.footerBg) {
                    const footer = document.querySelector('footer');
                    if (footer) {
                        footer.style.setProperty('background-color', colors.footerBg, 'important');
                    }
                }
                
                // Apply border colors
                if (colors.borderColor) {
                    const borderedElements = document.querySelectorAll('[class*="border"]');
                    borderedElements.forEach(el => el.style.borderColor = colors.borderColor);
                }
                
                // Apply stock badge colors
                if (colors.inStock) {
                    const inStockBadges = document.querySelectorAll('[class*="bg-green"], .in-stock');
                    inStockBadges.forEach(badge => badge.style.backgroundColor = colors.inStock);
                    
                    // Apply in-stock color to cart count badge (light background like stock badges)
                    const cartCount = document.getElementById('cartCount');
                    if (cartCount) {
                        // Convert hex to rgba with low opacity (similar to bg-green-100)
                        const hex = colors.inStock.replace('#', '');
                        const r = parseInt(hex.substr(0, 2), 16);
                        const g = parseInt(hex.substr(2, 2), 16);
                        const b = parseInt(hex.substr(4, 2), 16);
                        // Use 15% opacity for light background (similar to Tailwind's -100 classes)
                        cartCount.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.15)`;
                        // Use the full color for text (darker, like text-green-700)
                        cartCount.style.color = colors.inStock;
                    }
                }
                if (colors.outOfStock) {
                    const outOfStockBadges = document.querySelectorAll('[class*="bg-red"], .out-of-stock');
                    outOfStockBadges.forEach(badge => badge.style.backgroundColor = colors.outOfStock);
                }
            }
            
            // Apply fonts
            if (settings.theme.fonts) {
                const fonts = settings.theme.fonts;
                if (fonts.primary) document.body.style.fontFamily = fonts.primary;
                if (fonts.heading) {
                    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                    headings.forEach(h => h.style.fontFamily = fonts.heading);
                }
                if (fonts.baseSize) {
                    document.body.style.fontSize = fonts.baseSize;
                    document.documentElement.style.fontSize = fonts.baseSize;
                }
                if (fonts.h1Size) {
                    const h1s = document.querySelectorAll('h1, h2, [id*="ProductName"], .text-3xl');
                    h1s.forEach(h => h.style.fontSize = fonts.h1Size);
                }
                if (fonts.priceSize) {
                    const prices = document.querySelectorAll('[id*="Price"], [class*="price"], .text-2xl, .text-4xl, [class*="bg-gradient"]');
                    prices.forEach(p => p.style.fontSize = fonts.priceSize);
                }
            }
            
            // Apply layout
            if (settings.theme.layout) {
                const layout = settings.theme.layout;
                
                // Apply max width to main container
                if (layout.maxWidth) {
                    const mainContainer = document.querySelector('main, .max-w-7xl');
                    if (mainContainer) {
                        mainContainer.style.maxWidth = layout.maxWidth;
                    }
                }
                
                if (layout.productMinWidth || layout.productGap) {
                    const productGrid = document.querySelector('.product-grid');
                    if (productGrid) {
                        const minWidth = layout.productMinWidth || '280px';
                        const gap = settings.theme.spacing?.productGap || '24px';
                        productGrid.style.gridTemplateColumns = `repeat(auto-fill, minmax(${minWidth}, 1fr))`;
                        productGrid.style.gap = gap;
                    }
                }
                
                if (layout.productImageHeight) {
                    const images = document.querySelectorAll('.product-card img');
                    images.forEach(img => img.style.height = layout.productImageHeight);
                }
            }
            
            // Apply spacing
            if (settings.theme.spacing) {
                const spacing = settings.theme.spacing;
                if (spacing.productGap) document.documentElement.style.setProperty('--space-lg', spacing.productGap);
                if (spacing.cardPadding) {
                    const cards = document.querySelectorAll('.product-card-content');
                    cards.forEach(card => card.style.padding = spacing.cardPadding);
                }
            }
            
            // Apply style effects
            if (settings.theme.style) {
                const style = settings.theme.style;
                if (style.borderRadius) document.documentElement.style.setProperty('--radius-lg', style.borderRadius);
                if (style.borderWidth) {
                    const cards = document.querySelectorAll('.product-card');
                    cards.forEach(card => card.style.borderWidth = style.borderWidth);
                }
            }
            
            // Legacy support - ONLY if new colors don't exist
            if (!settings.theme.colors && settings.theme.headerColor) {
                console.log('Using legacy headerColor:', settings.theme.headerColor);
                document.documentElement.style.setProperty('--accent-primary', settings.theme.headerColor);
            }
            if (!settings.theme.colors && settings.theme.buttonColor) {
                console.log('Using legacy buttonColor:', settings.theme.buttonColor);
                document.documentElement.style.setProperty('--accent-hover', settings.theme.buttonColor);
            }
        }
        
        // Apply header settings
        if (settings.theme.header) {
            const header = document.querySelector('header, nav');
            if (header) {
                const branding = document.getElementById('shopBranding');
                
                // Apply logo size
                if (settings.theme.header.logoSize && branding) {
                    // Find logo image first
                    const logoImg = branding.querySelector('img');
                    if (logoImg) {
                        // Logo image exists - apply size to image
                        logoImg.style.height = settings.theme.header.logoSize;
                        logoImg.style.maxWidth = 'none';
                        logoImg.style.width = 'auto';
                    } else {
                        // No logo image - apply to text/container
                        branding.style.fontSize = settings.theme.header.logoSize;
                        const shopName = branding.querySelector('#shopName, h1');
                        if (shopName) {
                            shopName.style.fontSize = settings.theme.header.logoSize;
                        }
                    }
                }
                
                // Apply logo position
                if (settings.theme.header.logoPosition && branding) {
                    // Find the flex container that holds logo and nav items
                    let navContainer = header.querySelector('.flex.justify-between');
                    if (!navContainer) {
                        // Fallback: find first flex container with justify-between
                        const containers = Array.from(header.querySelectorAll('.flex'));
                        navContainer = containers.find(c => c.classList.contains('justify-between') || 
                            window.getComputedStyle(c).justifyContent.includes('space-between'));
                    }
                    if (!navContainer) {
                        // Last resort: first flex container
                        navContainer = header.querySelector('.flex');
                    }
                    
                    if (navContainer) {
                        // Ensure container is relative for absolute positioning
                        navContainer.style.position = 'relative';
                        
                        if (settings.theme.header.logoPosition === 'left') {
                            // Reset to default layout
                            navContainer.style.justifyContent = 'space-between';
                            branding.style.position = 'relative';
                            branding.style.left = 'auto';
                            branding.style.right = 'auto';
                            branding.style.transform = 'none';
                            branding.style.marginLeft = '0';
                            branding.style.marginRight = 'auto';
                        } else if (settings.theme.header.logoPosition === 'center') {
                            // Center logo using absolute positioning
                            navContainer.style.justifyContent = 'flex-end'; // Keep nav items on right
                            branding.style.position = 'absolute';
                            branding.style.left = '50%';
                            branding.style.transform = 'translateX(-50%)';
                            branding.style.right = 'auto';
                            branding.style.marginLeft = '0';
                            branding.style.marginRight = '0';
                        } else if (settings.theme.header.logoPosition === 'right') {
                            // Right align: swap order or use flex-end
                            navContainer.style.justifyContent = 'flex-end';
                            branding.style.position = 'relative';
                            branding.style.left = 'auto';
                            branding.style.right = '0';
                            branding.style.transform = 'none';
                            branding.style.marginLeft = 'auto';
                            branding.style.marginRight = '0';
                            // Move nav items to the left of logo
                            const navItemsContainer = navContainer.querySelector('.flex.items-center.gap-1');
                            if (navItemsContainer && navItemsContainer !== branding && navItemsContainer.parentElement === navContainer) {
                                navContainer.insertBefore(navItemsContainer, branding);
                            }
                        }
                    }
                }
                
                // Apply sticky header
                if (settings.theme.header.sticky !== undefined) {
                    if (settings.theme.header.sticky) {
                        header.style.position = 'sticky';
                        header.style.top = '0';
                        header.style.zIndex = '50';
                    } else {
                        header.style.position = 'relative';
                        header.style.zIndex = 'auto';
                    }
                }
            }
        }
        
        // Apply footer settings
        if (settings.theme.footer) {
            const footer = document.querySelector('footer');
            if (footer) {
                // Apply padding (add 'px' unit if not present)
                if (settings.theme.footer.padding) {
                    const padding = settings.theme.footer.padding.toString().includes('px') 
                        ? settings.theme.footer.padding 
                        : settings.theme.footer.padding + 'px';
                    footer.style.padding = padding;
                }
                
                // Apply alignment
                if (settings.theme.footer.alignment) {
                    footer.style.textAlign = settings.theme.footer.alignment;
                    // Apply to all direct children and text nodes
                    const footerContent = footer.querySelector('div, p');
                    if (footerContent) {
                        footerContent.style.textAlign = settings.theme.footer.alignment;
                    }
                    // Also apply to footer itself and any nested elements
                    const allFooterElements = footer.querySelectorAll('*');
                    allFooterElements.forEach(el => {
                        if (el.tagName === 'P' || el.tagName === 'DIV' || el.tagName === 'SPAN') {
                            el.style.textAlign = settings.theme.footer.alignment;
                        }
                    });
                }
            }
        }
        
        // Re-apply footer background (in case it was set before footer was loaded)
        if (settings.theme.colors?.footerBg) {
            const footer = document.querySelector('footer');
            if (footer) {
                footer.style.setProperty('background-color', settings.theme.colors.footerBg, 'important');
            }
        }
        
        // Apply footer text
        if (settings.footerText) {
            console.log('Setting footer text:', settings.footerText);
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
        if (!response.ok) {
            console.error('Failed to load products:', response.statusText);
            return;
        }
        products = await response.json();
        displayProducts(products);
        updateCartCount();
        
        // Re-apply theme after products are loaded (for dynamic elements)
        if (settings.theme) {
            applyThemeToProducts();
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function applyThemeToProducts() {
    // Apply layout to product grid
    if (settings.theme.layout) {
        const layout = settings.theme.layout;
        const productGrid = document.querySelector('.product-grid');
        if (productGrid) {
            const minWidth = layout.productMinWidth || '280px';
            const gap = settings.theme.spacing?.productGap || '24px';
            productGrid.style.gridTemplateColumns = `repeat(auto-fill, minmax(${minWidth}, 1fr))`;
            productGrid.style.gap = gap;
        }
    }
    
    // Apply image height to product cards
    if (settings.theme.layout?.productImageHeight) {
        const images = document.querySelectorAll('.product-card img');
        images.forEach(img => img.style.height = settings.theme.layout.productImageHeight);
    }
    
    // Apply card padding
    if (settings.theme.spacing?.cardPadding) {
        const cards = document.querySelectorAll('.product-card-content');
        cards.forEach(card => card.style.padding = settings.theme.spacing.cardPadding);
    }
    
    // Apply card backgrounds (re-apply after products load)
    if (settings.theme.colors?.cardBackground) {
        const cards = document.querySelectorAll('.bg-white');
        cards.forEach(card => card.style.backgroundColor = settings.theme.colors.cardBackground);
    }
    
    // Apply border styles, shadow intensity, and hover effects
    if (settings.theme.style) {
        const cards = document.querySelectorAll('.product-card, [class*="bg-white"][class*="rounded"]');
        const style = settings.theme.style;
        
        // Apply border radius
        if (style.borderRadius) {
            // Add 'px' unit if not already present
            const borderRadius = style.borderRadius.toString().includes('px') ? style.borderRadius : style.borderRadius + 'px';
            cards.forEach(card => card.style.borderRadius = borderRadius);
        }
        
        // Apply border width
        if (style.borderWidth) {
            cards.forEach(card => card.style.borderWidth = style.borderWidth);
        }
        
        // Apply shadow intensity
        if (style.shadowIntensity) {
            const shadowMap = {
                'none': 'none',
                'light': '0 1px 3px rgba(0,0,0,0.08)',
                'medium': '0 4px 6px rgba(0,0,0,0.1)',
                'strong': '0 10px 15px rgba(0,0,0,0.15)'
            };
            cards.forEach(card => {
                card.style.boxShadow = shadowMap[style.shadowIntensity] || shadowMap.medium;
            });
        }
        
        // Apply card hover effects
        if (style.cardHoverEffect) {
            cards.forEach(card => {
                // Remove ALL Tailwind hover classes that might conflict
                card.classList.remove('hover:shadow-2xl', 'hover:scale-[1.03]', 'hover:-translate-y-2', 'transform');
                
                // Store onclick attribute to preserve it
                const onclickAttr = card.getAttribute('onclick');
                
                // Remove any existing hover listeners by cloning (clean slate)
                const newCard = card.cloneNode(true);
                card.parentNode.replaceChild(newCard, card);
                
                // Restore onclick attribute
                if (onclickAttr) {
                    newCard.setAttribute('onclick', onclickAttr);
                }
                
                // Get the image inside the card
                const cardImage = newCard.querySelector('img');
                
                // Apply only the selected hover effect
                if (style.cardHoverEffect === 'lift') {
                    // Lift: card lifts, image doesn't scale
                    newCard.style.transition = 'all 0.3s ease';
                    // Remove image scale effect
                    if (cardImage) {
                        cardImage.classList.remove('group-hover:scale-110');
                        cardImage.style.transition = 'none';
                    }
                    newCard.addEventListener('mouseenter', function() {
                        this.style.setProperty('transform', 'translateY(-8px)', 'important');
                    });
                    newCard.addEventListener('mouseleave', function() {
                        this.style.setProperty('transform', 'none', 'important');
                    });
                } else if (style.cardHoverEffect === 'scale') {
                    // Scale: only image scales, card doesn't lift
                    newCard.style.transition = 'all 0.3s ease';
                    // Ensure image has scale effect
                    if (cardImage) {
                        cardImage.classList.add('group-hover:scale-110');
                        cardImage.style.transition = 'transform 0.5s ease';
                    }
                    // Card doesn't transform
                    newCard.addEventListener('mouseenter', function() {
                        // Card stays in place, only image scales
                        this.style.setProperty('transform', 'none', 'important');
                    });
                    newCard.addEventListener('mouseleave', function() {
                        this.style.setProperty('transform', 'none', 'important');
                    });
                } else if (style.cardHoverEffect === 'both') {
                    // Both: card lifts AND image scales
                    newCard.style.transition = 'all 0.3s ease';
                    // Ensure image has scale effect
                    if (cardImage) {
                        cardImage.classList.add('group-hover:scale-110');
                        cardImage.style.transition = 'transform 0.5s ease';
                    }
                    newCard.addEventListener('mouseenter', function() {
                        this.style.setProperty('transform', 'translateY(-8px)', 'important');
                    });
                    newCard.addEventListener('mouseleave', function() {
                        this.style.setProperty('transform', 'none', 'important');
                    });
                }
            });
        }
    }
}

function displayProducts(productsToShow) {
    const container = document.getElementById('products');
    
    container.innerHTML = productsToShow.map((product, index) => {
        // Calculate total stock including all print sizes
        let totalStock = product.quantity || 0;
        if (product.printSizes && product.printSizes.length > 0) {
            totalStock = product.printSizes.reduce((sum, size) => sum + (size.quantity || 0), 0);
        }
        
        const stockBadgeClass = totalStock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
        const stockText = totalStock > 0 ? 'In Stock' : 'Out of Stock';
        const delayClass = `stagger-${Math.min(index % 3 + 1, 3)}`;
        
        return `
            <div class="animate-fade-in ${delayClass}">
                <div class="bg-white rounded-2xl overflow-hidden shadow-sm transition-all duration-300 cursor-pointer group product-card" 
                    onclick="showProductModal('${product._id}')">
                    <div class="aspect-square overflow-hidden">
                        <img src="${product.images[0]}" alt="${product.name}" 
                            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                    </div>
                    <div class="p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">${product.name}</h3>
                        <p class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                            $${product.price.toFixed(2)}
                        </p>
                        <span class="${stockBadgeClass} px-3 py-1 rounded-full text-xs font-medium">
                            ${stockText}
                        </span>
                    </div>
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
                <label class="flex items-center justify-between p-4 border-2 ${index === 0 ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} rounded-xl cursor-pointer hover:border-indigo-300 transition-all">
                    <div class="flex items-center gap-3">
                        <input type="radio" name="printSize" value="${index}" 
                               ${index === 0 ? 'checked' : ''} 
                               onchange="updatePriceForSize(${index})"
                               data-size="${size.size}"
                               data-quantity="${size.quantity}"
                               data-price="${size.additionalPrice}"
                               class="w-4 h-4 text-indigo-600">
                        <div>
                            <p class="font-semibold text-gray-900">${size.size}</p>
                            ${size.additionalPrice > 0 ? `<p class="text-sm text-indigo-600">+$${size.additionalPrice.toFixed(2)}</p>` : ''}
                        </div>
                    </div>
                    <span class="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">${size.quantity} left</span>
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
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function updateModalImages() {
    const mainImage = document.getElementById('modalMainImage');
    mainImage.src = currentProduct.images[currentImageIndex];
    
    const thumbnailContainer = document.getElementById('thumbnails');
    if (currentProduct.images.length > 1) {
        thumbnailContainer.innerHTML = currentProduct.images.map((image, index) => `
            <div onclick="selectImage(${index})" class="cursor-pointer rounded-lg overflow-hidden border-2 ${index === currentImageIndex ? 'border-indigo-500' : 'border-transparent'} hover:border-gray-300 transition-all">
                <img src="${image}" alt="" class="w-full h-full object-cover">
            </div>
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

async function addToCart() {
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
            image: (currentProduct.images && currentProduct.images.length > 0) ? currentProduct.images[0] : '',
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
    
    // Also sync with backend API
    const lastItem = cart.length > 0 ? cart[cart.length - 1] : null;
    if (lastItem) {
        try {
            const syncResponse = await fetch('/api/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    productId: currentProduct._id,
                    quantity: 1,
                    size: lastItem.size || null,
                    additionalPrice: lastItem.size ? (lastItem.price - (lastItem.basePrice || lastItem.price) || 0) : 0
                })
            });
            
            if (syncResponse.ok) {
                console.log('Cart synced with backend successfully');
            } else {
                try {
                    const error = await syncResponse.json();
                    console.error('Failed to sync cart with backend:', error);
                } catch (e) {
                    console.error('Failed to sync cart with backend:', syncResponse.statusText);
                }
            }
        } catch (error) {
            console.error('Error syncing cart with backend:', error);
        }
    }
    
    updateCartCount();
    closeModal();
    showNotification('Added to cart!');
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countElement = document.getElementById('cartCount');
    if (countElement) {
        countElement.textContent = count;
        if (count > 0) {
            countElement.classList.remove('hidden');
            countElement.classList.add('inline-flex');
        } else {
            countElement.classList.add('hidden');
            countElement.classList.remove('inline-flex');
        }
    }
}

function closeModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

let zoomImageIndex = 0;

function zoomImage() {
    if (!currentProduct || !currentProduct.images || currentProduct.images.length === 0) return;
    
    const mainImage = document.getElementById('modalMainImage');
    const zoomedImage = document.getElementById('zoomedImage');
    const zoomModal = document.getElementById('zoomModal');
    
    // Set zoom index to match current modal image
    zoomImageIndex = currentImageIndex;
    
    // Set the zoomed image source
    zoomedImage.src = currentProduct.images[zoomImageIndex];
    
    // Update image counter
    updateZoomCounter();
    
    // Show/hide navigation arrows based on number of images
    const prevBtn = document.getElementById('zoomPrevBtn');
    const nextBtn = document.getElementById('zoomNextBtn');
    const counter = document.getElementById('zoomImageCounter');
    
    if (currentProduct.images.length > 1) {
        if (prevBtn) prevBtn.classList.remove('hidden');
        if (nextBtn) nextBtn.classList.remove('hidden');
        if (counter) counter.classList.remove('hidden');
    } else {
        if (prevBtn) prevBtn.classList.add('hidden');
        if (nextBtn) nextBtn.classList.add('hidden');
        if (counter) counter.classList.add('hidden');
    }
    
    // Show zoom modal
    zoomModal.classList.remove('hidden');
    zoomModal.classList.add('flex');
}

function navigateZoomImage(direction) {
    if (!currentProduct || !currentProduct.images || currentProduct.images.length === 0) return;
    
    // Update index
    zoomImageIndex = (zoomImageIndex + direction + currentProduct.images.length) % currentProduct.images.length;
    
    // Update image
    const zoomedImage = document.getElementById('zoomedImage');
    if (zoomedImage) {
        zoomedImage.src = currentProduct.images[zoomImageIndex];
    }
    
    // Update counter
    updateZoomCounter();
}

function updateZoomCounter() {
    if (!currentProduct || !currentProduct.images) return;
    
    const currentIndexEl = document.getElementById('zoomCurrentIndex');
    const totalImagesEl = document.getElementById('zoomTotalImages');
    
    if (currentIndexEl) {
        currentIndexEl.textContent = zoomImageIndex + 1;
    }
    if (totalImagesEl) {
        totalImagesEl.textContent = currentProduct.images.length;
    }
}

function closeZoom(event) {
    // Don't close if clicking on the image, navigation buttons, or counter
    if (event) {
        const target = event.target;
        if (target.closest('img') || 
            target.closest('button') || 
            target.closest('#zoomImageCounter') ||
            target.id === 'zoomedImage') {
            return;
        }
    }
    
    const zoomModal = document.getElementById('zoomModal');
    if (zoomModal) {
        zoomModal.classList.add('hidden');
        zoomModal.classList.remove('flex');
    }
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
    
    // Listen for cart updates from cart page
    window.addEventListener('storage', (e) => {
        if (e.key === 'cart') {
            cart = JSON.parse(e.newValue || '[]');
            updateCartCount();
        }
    });
    
    // Load settings and products
    cleanCart();  // Clean up invalid cart items
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