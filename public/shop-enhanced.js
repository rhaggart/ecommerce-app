// public/shop-enhanced.js - Railway-style interactions

// Add smooth page load animation
document.addEventListener('DOMContentLoaded', () => {
    // Animate products on load
    const products = document.querySelectorAll('.product-card');
    products.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 50);
    });

    // Add hover sound effect (optional)
    products.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-4px) scale(1.02)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Enhanced search with debounce
    let searchTimeout;
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(e.target.value);
            }, 300);
        });
    }

    // Add loading states
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.classList.contains('no-loading')) {
                this.style.position = 'relative';
                const originalText = this.innerHTML;
                this.innerHTML = '<span class="loading"></span> ' + originalText;
                setTimeout(() => {
                    this.innerHTML = originalText;
                }, 1000);
            }
        });
    });
});

// Enhanced product search with animation
function performSearch(searchTerm) {
    const products = document.querySelectorAll('.product-card');
    products.forEach((card, index) => {
        const name = card.querySelector('h3').textContent.toLowerCase();
        const category = card.querySelector('.category').textContent.toLowerCase();
        
        if (name.includes(searchTerm.toLowerCase()) || category.includes(searchTerm.toLowerCase())) {
            setTimeout(() => {
                card.style.display = 'block';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'scale(1)';
                }, 50);
            }, index * 30);
        } else {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });
}

// Enhanced cart notification
function showCartNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 100);
    
    // Animate out
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add to existing addToCart function
const originalAddToCart = window.addToCart;
window.addToCart = function() {
    originalAddToCart.apply(this, arguments);
    showCartNotification('Product added to cart!');
    
    // Animate cart count
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.style.transform = 'scale(1.5)';
        setTimeout(() => {
            cartCount.style.transform = 'scale(1)';
        }, 300);
    }
};

// Style for cart notification
const style = document.createElement('style');
style.innerHTML = `
    .cart-notification {
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, var(--accent-primary), var(--accent-dark));
        color: white;
        padding: 16px 24px;
        border-radius: var(--radius-lg);
        box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
        z-index: 3000;
        transform: translateX(400px);
        opacity: 0;
        transition: all 0.3s ease;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 500;
    }
    
    .loading {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    /* Smooth scroll indicator */
    .scroll-indicator {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--accent-primary), var(--accent-light));
        transform-origin: left;
        transform: scaleX(0);
        z-index: 1001;
        transition: transform 0.1s ease;
    }
`;
document.head.appendChild(style);

// Add scroll progress indicator
const scrollIndicator = document.createElement('div');
scrollIndicator.className = 'scroll-indicator';
document.body.appendChild(scrollIndicator);

window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height);
    scrollIndicator.style.transform = `scaleX(${scrolled})`;
});

// Enhanced modal with fade effect
const originalShowModal = window.showProductModal;
if (originalShowModal) {
    window.showProductModal = function(productId) {
        const modal = document.getElementById('productModal');
        modal.style.opacity = '0';
        originalShowModal.apply(this, arguments);
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 50);
    };
}

// Add parallax effect to header
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    const header = document.querySelector('header');
    
    if (currentScroll > lastScroll && currentScroll > 100) {
        header.style.transform = 'translateY(-100%)';
    } else {
        header.style.transform = 'translateY(0)';
    }
    
    lastScroll = currentScroll <= 0 ? 0 : currentScroll;
}, { passive: true });

// Add smooth reveal for elements as they come into view
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all product cards
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});

// Add cursor glow effect (optional premium feature)
const cursorGlow = document.createElement('div');
cursorGlow.style.cssText = `
    width: 400px;
    height: 400px;
    border-radius: 50%;
    position: fixed;
    pointer-events: none;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.3s ease;
`;
document.body.appendChild(cursorGlow);

document.addEventListener('mousemove', (e) => {
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
});

document.addEventListener('mouseenter', () => {
    cursorGlow.style.opacity = '1';
});

document.addEventListener('mouseleave', () => {
    cursorGlow.style.opacity = '0';
});