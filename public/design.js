// design.js - Comprehensive design customization system
const token = localStorage.getItem('token') || getCookie('adminToken');
if (!token) {
    window.location.href = 'login.html';
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

let currentDesign = {};
let previewFrame = null;

// Theme presets
const presets = {
    default: {
        colors: {
            primary: '#8B5CF6',
            secondary: '#7C3AED',
            background: '#F7F8F9',
            cardBackground: '#FFFFFF',
            textPrimary: '#111827',
            textSecondary: '#6B7280',
            headerBg: '#FFFFFF',
            footerBg: '#F3F4F6',
            buttonBg: '#8B5CF6',
            buttonText: '#FFFFFF',
            inStock: '#10B981',
            outOfStock: '#EF4444'
        },
        fonts: {
            primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
            heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
            baseSize: '16px',
            priceSize: '1.25rem'
        },
        spacing: {
            productGap: '24px',
            cardPadding: '24px'
        },
        layout: {
            maxWidth: '1200px',
            productMinWidth: '280px',
            productImageHeight: '240px'
        },
        style: {
            borderRadius: '12px',
            borderWidth: '1px',
            shadowIntensity: 'medium',
            cardHoverEffect: 'lift'
        }
    },
    
    dark: {
        colors: {
            primary: '#A78BFA',
            secondary: '#8B5CF6',
            background: '#1F2937',
            cardBackground: '#111827',
            textPrimary: '#F9FAFB',
            textSecondary: '#9CA3AF',
            headerBg: '#111827',
            footerBg: '#0F172A',
            buttonBg: '#8B5CF6',
            buttonText: '#FFFFFF',
            inStock: '#34D399',
            outOfStock: '#F87171'
        }
    },
    
    minimal: {
        colors: {
            primary: '#000000',
            secondary: '#333333',
            background: '#FFFFFF',
            cardBackground: '#FFFFFF',
            textPrimary: '#000000',
            textSecondary: '#666666',
            headerBg: '#FFFFFF',
            footerBg: '#F5F5F5',
            buttonBg: '#000000',
            buttonText: '#FFFFFF',
            inStock: '#2D7A3E',
            outOfStock: '#C41E3A'
        },
        style: {
            borderRadius: '0px',
            shadowIntensity: 'none',
            cardHoverEffect: 'none'
        }
    },
    
    bold: {
        colors: {
            primary: '#FF6B6B',
            secondary: '#4ECDC4',
            background: '#FFE66D',
            cardBackground: '#FFFFFF',
            textPrimary: '#2C3E50',
            textSecondary: '#7F8C8D',
            headerBg: '#FF6B6B',
            footerBg: '#4ECDC4',
            buttonBg: '#FF6B6B',
            buttonText: '#FFFFFF',
            inStock: '#4ECDC4',
            outOfStock: '#FF6B6B'
        }
    },
    
    elegant: {
        colors: {
            primary: '#8B7355',
            secondary: '#A0826D',
            background: '#FAF8F3',
            cardBackground: '#FFFFFF',
            textPrimary: '#2C2416',
            textSecondary: '#6B5D4F',
            headerBg: '#FFFFFF',
            footerBg: '#F5F1E8',
            buttonBg: '#8B7355',
            buttonText: '#FFFFFF',
            inStock: '#6B8E4E',
            outOfStock: '#B85C5C'
        },
        fonts: {
            heading: "'Playfair Display', serif",
            primary: "'Georgia', serif"
        }
    },
    
    modern: {
        colors: {
            primary: '#0EA5E9',
            secondary: '#06B6D4',
            background: '#F8FAFC',
            cardBackground: '#FFFFFF',
            textPrimary: '#0F172A',
            textSecondary: '#64748B',
            headerBg: '#FFFFFF',
            footerBg: '#F1F5F9',
            buttonBg: '#0EA5E9',
            buttonText: '#FFFFFF',
            inStock: '#14B8A6',
            outOfStock: '#EF4444'
        },
        fonts: {
            primary: "'Inter', sans-serif",
            heading: "'Inter', sans-serif"
        },
        style: {
            borderRadius: '16px',
            shadowIntensity: 'light'
        }
    }
};

// Load current design settings
async function loadCurrentDesign() {
    try {
        const response = await fetch('/api/settings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const settings = await response.json();
        currentDesign = settings.theme || {};
        
        populateForm(currentDesign);
    } catch (error) {
        console.error('Error loading design:', error);
    }
}

// Populate form with current values
function populateForm(theme) {
    // Colors
    if (theme.colors) {
        setColorInput('colorPrimary', theme.colors.primary);
        setColorInput('colorSecondary', theme.colors.secondary);
        setColorInput('colorBackground', theme.colors.background);
        setColorInput('colorCardBg', theme.colors.cardBackground);
        setColorInput('colorInStock', theme.colors.inStock);
        setColorInput('colorOutOfStock', theme.colors.outOfStock);
    }
    
    // Fonts
    if (theme.fonts) {
        const primarySelect = document.getElementById('fontPrimary');
        const headingSelect = document.getElementById('fontHeading');
        const baseSizeInput = document.getElementById('fontBaseSize');
        const h1SizeInput = document.getElementById('fontH1Size');
        const priceSizeInput = document.getElementById('fontPriceSize');
        
        if (primarySelect && theme.fonts.primary) primarySelect.value = theme.fonts.primary;
        if (headingSelect && theme.fonts.heading) headingSelect.value = theme.fonts.heading;
        if (baseSizeInput && theme.fonts.baseSize) updateSliderValue('fontBaseSize', parseInt(theme.fonts.baseSize));
        if (h1SizeInput && theme.fonts.h1Size) updateSliderValue('fontH1Size', parseFloat(theme.fonts.h1Size));
        if (priceSizeInput && theme.fonts.priceSize) updateSliderValue('fontPriceSize', parseFloat(theme.fonts.priceSize));
    }
    
    // Layout
    if (theme.layout) {
        if (theme.layout.maxWidth) updateSliderValue('layoutMaxWidth', parseInt(theme.layout.maxWidth));
        if (theme.layout.productMinWidth) updateSliderValue('layoutProductMinWidth', parseInt(theme.layout.productMinWidth));
    }
    
    // Spacing
    if (theme.spacing) {
        if (theme.spacing.productGap) updateSliderValue('spacingProductGap', parseInt(theme.spacing.productGap));
        if (theme.spacing.cardPadding) updateSliderValue('spacingCardPadding', parseInt(theme.spacing.cardPadding));
    }
    
    // Style
    if (theme.style) {
        if (theme.style.borderRadius) updateSliderValue('styleBorderRadius', parseInt(theme.style.borderRadius));
        if (theme.style.shadowIntensity) {
            const select = document.getElementById('styleShadowIntensity');
            if (select) select.value = theme.style.shadowIntensity;
        }
        if (theme.style.cardHoverEffect) {
            const select = document.getElementById('styleCardHoverEffect');
            if (select) select.value = theme.style.cardHoverEffect;
        }
    }
    
    // Header
    if (theme.header) {
        const logoPositionSelect = document.getElementById('headerLogoPosition');
        const stickyCheckbox = document.getElementById('headerSticky');
        
        if (theme.header.logoSize) updateSliderValue('headerLogoSize', parseInt(theme.header.logoSize));
        if (logoPositionSelect && theme.header.logoPosition) logoPositionSelect.value = theme.header.logoPosition;
        if (stickyCheckbox && theme.header.sticky !== undefined) stickyCheckbox.checked = theme.header.sticky;
    }
    
    // Footer
    if (theme.footer) {
        const alignmentSelect = document.getElementById('footerAlignment');
        
        if (theme.footer.padding) updateSliderValue('footerPadding', parseInt(theme.footer.padding));
        if (alignmentSelect && theme.footer.alignment) alignmentSelect.value = theme.footer.alignment;
    }
    
    applyPreviewStyles();
}

function updateSliderValue(id, value) {
    const slider = document.getElementById(id);
    const valueDisplay = document.getElementById(id + 'Value');
    if (slider) slider.value = value;
    if (valueDisplay) valueDisplay.textContent = value;
}

function setColorInput(id, value) {
    if (!value) return;
    const colorInput = document.getElementById(id);
    const hexInput = document.getElementById(id + 'Hex');
    if (colorInput) colorInput.value = value;
    if (hexInput) hexInput.value = value;
}

function setSlider(id, value) {
    const slider = document.getElementById(id);
    const valueDisplay = document.getElementById(id + 'Value');
    if (slider) slider.value = value;
    if (valueDisplay) valueDisplay.textContent = value;
}

// Sync color picker with hex input
function setupColorSync() {
    const colorInputs = document.querySelectorAll('input[type="color"]');
    colorInputs.forEach(input => {
        const hexInput = document.getElementById(input.id + 'Hex');
        
        input.addEventListener('input', (e) => {
            if (hexInput) hexInput.value = e.target.value;
            applyPreviewStyles();
        });
        
        if (hexInput) {
            hexInput.addEventListener('input', (e) => {
                if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                    input.value = e.target.value;
                    applyPreviewStyles();
                }
            });
        }
    });
}

// Setup slider value displays
function setupSliders() {
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
        const valueDisplay = document.getElementById(slider.id + 'Value');
        slider.addEventListener('input', (e) => {
            if (valueDisplay) valueDisplay.textContent = e.target.value;
            applyPreviewStyles();
        });
    });
}

// Setup select changes
function setupSelects() {
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
        select.addEventListener('change', () => applyPreviewStyles());
    });
}

// Setup text input changes
function setupTextInputs() {
    const textInputs = document.querySelectorAll('input[type="text"]');
    textInputs.forEach(input => {
        input.addEventListener('input', () => applyPreviewStyles());
    });
}

// Setup checkbox changes
function setupCheckboxes() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => applyPreviewStyles());
    });
}

// Apply styles to preview frame
function applyPreviewStyles() {
    previewFrame = document.getElementById('previewFrame');
    if (!previewFrame || !previewFrame.contentWindow) return;
    
    try {
        const previewDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
        const root = previewDoc.documentElement;
        
        // Get values from form
        const primaryColor = document.getElementById('colorPrimary')?.value;
        const secondaryColor = document.getElementById('colorSecondary')?.value;
        const backgroundColor = document.getElementById('colorBackground')?.value;
        const cardBgColor = document.getElementById('colorCardBg')?.value;
        const inStockColor = document.getElementById('colorInStock')?.value;
        const outOfStockColor = document.getElementById('colorOutOfStock')?.value;
        
        const primaryFont = document.getElementById('fontPrimary')?.value;
        const headingFont = document.getElementById('fontHeading')?.value;
        const baseSize = document.getElementById('fontBaseSize')?.value;
        const h1Size = document.getElementById('fontH1Size')?.value;
        const priceSize = document.getElementById('fontPriceSize')?.value;
        
        const maxWidth = document.getElementById('layoutMaxWidth')?.value;
        const productMinWidth = document.getElementById('layoutProductMinWidth')?.value;
        const productGap = document.getElementById('spacingProductGap')?.value;
        const cardPadding = document.getElementById('spacingCardPadding')?.value;
        
        const borderRadius = document.getElementById('styleBorderRadius')?.value;
        const shadowIntensity = document.getElementById('styleShadowIntensity')?.value;
        const cardHoverEffect = document.getElementById('styleCardHoverEffect')?.value;
        
        // Apply colors to body/root
        if (backgroundColor) previewDoc.body.style.backgroundColor = backgroundColor;
        if (primaryColor) {
            root.style.setProperty('--color-primary', primaryColor);
            // Apply to buttons in preview (only background color, not size)
            const buttons = previewDoc.querySelectorAll('button');
            buttons.forEach(btn => {
                const btnStyle = window.getComputedStyle(btn);
                const currentBg = btnStyle.backgroundColor;
                // Only change primary/accent colored buttons
                if (currentBg.includes('99, 102, 241') || currentBg.includes('139, 92, 246') || btn.classList.contains('bg-indigo') || btn.classList.contains('bg-purple')) {
                    btn.style.backgroundColor = primaryColor;
                    btn.style.setProperty('background-image', 'none'); // Remove gradients
                }
            });
        }
        
        if (secondaryColor) {
            root.style.setProperty('--color-secondary', secondaryColor);
            // Apply hover state via CSS variable
            root.style.setProperty('--hover-color', secondaryColor);
        }
        
        // Apply fonts
        if (primaryFont) previewDoc.body.style.fontFamily = primaryFont;
        if (headingFont) {
            const headings = previewDoc.querySelectorAll('h1, h2, h3, h4, h5, h6');
            headings.forEach(h => h.style.fontFamily = headingFont);
        }
        if (baseSize) previewDoc.body.style.fontSize = baseSize;
        if (h1Size) {
            const h1s = previewDoc.querySelectorAll('h1');
            h1s.forEach(h => h.style.fontSize = h1Size);
        }
        if (priceSize) {
            const prices = previewDoc.querySelectorAll('[class*="price"], .text-price');
            prices.forEach(p => p.style.fontSize = priceSize);
        }
        
        // Apply layout - find product grid
        const container = previewDoc.querySelector('.max-w-7xl, .container');
        if (container && maxWidth) {
            container.style.maxWidth = maxWidth + 'px';
        }
        
        const productGrid = previewDoc.querySelector('[class*="grid"]');
        if (productGrid) {
            if (productGap) productGrid.style.gap = productGap + 'px';
            if (productMinWidth) {
                productGrid.style.gridTemplateColumns = `repeat(auto-fill, minmax(${productMinWidth}, 1fr))`;
            }
        }
        
        // Apply card styles
        const cards = previewDoc.querySelectorAll('[class*="rounded"], [class*="card"], [class*="bg-white"]');
        cards.forEach(card => {
            if (cardBgColor) card.style.backgroundColor = cardBgColor;
            if (borderRadius) card.style.borderRadius = borderRadius + 'px';
            if (cardPadding) card.style.padding = cardPadding + 'px';
            
            // Apply hover effects
            if (cardHoverEffect === 'lift' || cardHoverEffect === 'both') {
                card.style.transition = 'all 0.3s ease';
                card.addEventListener('mouseenter', () => {
                    card.style.transform = 'translateY(-8px)';
                });
                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'translateY(0)';
                });
            }
            if (cardHoverEffect === 'scale' || cardHoverEffect === 'both') {
                card.addEventListener('mouseenter', () => {
                    card.style.transform = (card.style.transform || '') + ' scale(1.02)';
                });
            }
        });
        
        // Apply shadow intensity
        if (shadowIntensity) {
            const shadowMap = {
                'none': 'none',
                'light': '0 1px 3px rgba(0,0,0,0.08)',
                'medium': '0 4px 6px rgba(0,0,0,0.1)',
                'strong': '0 10px 15px rgba(0,0,0,0.15)'
            };
            cards.forEach(card => {
                card.style.boxShadow = shadowMap[shadowIntensity] || shadowMap.medium;
            });
        }
        
        // Apply stock badge colors
        const inStockBadges = previewDoc.querySelectorAll('[class*="in-stock"], .badge-success');
        if (inStockColor) {
            inStockBadges.forEach(badge => badge.style.backgroundColor = inStockColor);
        }
        
        const outOfStockBadges = previewDoc.querySelectorAll('[class*="out-of-stock"], .badge-danger');
        if (outOfStockColor) {
            outOfStockBadges.forEach(badge => badge.style.backgroundColor = outOfStockColor);
        }
        
    } catch (error) {
        console.error('Error applying preview styles:', error);
    }
}

// Apply preset theme
function applyPreset(presetName) {
    const preset = presets[presetName];
    if (!preset) return;
    
    // Merge preset with defaults
    const mergedPreset = {
        colors: { ...presets.default.colors, ...(preset.colors || {}) },
        fonts: { ...presets.default.fonts, ...(preset.fonts || {}) },
        spacing: { ...presets.default.spacing, ...(preset.spacing || {}) },
        layout: { ...presets.default.layout, ...(preset.layout || {}) },
        style: { ...presets.default.style, ...(preset.style || {}) }
    };
    
    populateForm(mergedPreset);
    applyPreviewStyles();
}

// Save design to database
async function saveDesign() {
    const designData = {
        colors: {
            primary: document.getElementById('colorPrimary')?.value,
            secondary: document.getElementById('colorSecondary')?.value,
            background: document.getElementById('colorBackground')?.value,
            cardBackground: document.getElementById('colorCardBg')?.value,
            inStock: document.getElementById('colorInStock')?.value,
            outOfStock: document.getElementById('colorOutOfStock')?.value
        },
        fonts: {
            primary: document.getElementById('fontPrimary')?.value,
            heading: document.getElementById('fontHeading')?.value,
            baseSize: document.getElementById('fontBaseSize')?.value + 'px',
            h1Size: document.getElementById('fontH1Size')?.value + 'rem',
            priceSize: document.getElementById('fontPriceSize')?.value + 'rem'
        },
        spacing: {
            productGap: document.getElementById('spacingProductGap')?.value + 'px',
            cardPadding: document.getElementById('spacingCardPadding')?.value + 'px'
        },
        layout: {
            maxWidth: document.getElementById('layoutMaxWidth')?.value + 'px',
            productMinWidth: document.getElementById('layoutProductMinWidth')?.value + 'px'
        },
        style: {
            borderRadius: document.getElementById('styleBorderRadius')?.value + 'px',
            shadowIntensity: document.getElementById('styleShadowIntensity')?.value,
            cardHoverEffect: document.getElementById('styleCardHoverEffect')?.value
        },
        header: {
            logoSize: document.getElementById('headerLogoSize')?.value + 'px',
            logoPosition: document.getElementById('headerLogoPosition')?.value,
            sticky: document.getElementById('headerSticky')?.checked
        },
        footer: {
            padding: document.getElementById('footerPadding')?.value + 'px',
            alignment: document.getElementById('footerAlignment')?.value
        }
    };
    
    try {
        const response = await fetch('/api/settings/design', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ theme: designData })
        });
        
        if (response.ok) {
            alert('✅ Design saved successfully! Your store has been updated.');
        } else {
            alert('Error saving design. Please try again.');
        }
    } catch (error) {
        console.error('Error saving design:', error);
        alert('Error saving design: ' + error.message);
    }
}

// Reset to defaults
function resetToDefaults() {
    if (!confirm('Reset all design settings to defaults?')) return;
    applyPreset('default');
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = 'login.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupColorSync();
    setupSliders();
    setupSelects();
    setupTextInputs();
    setupCheckboxes();
    loadCurrentDesign();
    
    // Wait for iframe to load before applying preview
    const iframe = document.getElementById('previewFrame');
    iframe.addEventListener('load', () => {
        setTimeout(() => {
            applyPreviewStyles();
        }, 500);
    });
});

