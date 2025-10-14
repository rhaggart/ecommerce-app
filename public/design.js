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
            buttonText: '#FFFFFF'
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
            buttonText: '#FFFFFF'
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
            buttonText: '#FFFFFF'
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
            buttonText: '#FFFFFF'
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
            buttonText: '#FFFFFF'
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
            buttonText: '#FFFFFF'
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
        setColorInput('colorTextPrimary', theme.colors.textPrimary);
        setColorInput('colorTextSecondary', theme.colors.textSecondary);
        setColorInput('colorHeaderBg', theme.colors.headerBg);
        setColorInput('colorFooterBg', theme.colors.footerBg);
        setColorInput('colorButtonBg', theme.colors.buttonBg);
        setColorInput('colorButtonText', theme.colors.buttonText);
    }
    
    // Fonts
    if (theme.fonts) {
        if (theme.fonts.primary) document.getElementById('fontPrimary').value = theme.fonts.primary;
        if (theme.fonts.heading) document.getElementById('fontHeading').value = theme.fonts.heading;
        if (theme.fonts.baseSize) setSlider('fontBaseSize', parseInt(theme.fonts.baseSize));
        if (theme.fonts.priceSize) setSlider('fontPriceSize', parseFloat(theme.fonts.priceSize));
    }
    
    // Layout
    if (theme.layout) {
        if (theme.layout.maxWidth) setSlider('layoutMaxWidth', parseInt(theme.layout.maxWidth));
        if (theme.layout.productMinWidth) setSlider('layoutProductMinWidth', parseInt(theme.layout.productMinWidth));
        if (theme.layout.productImageHeight) setSlider('layoutImageHeight', parseInt(theme.layout.productImageHeight));
    }
    
    // Spacing
    if (theme.spacing) {
        if (theme.spacing.productGap) setSlider('spacingProductGap', parseInt(theme.spacing.productGap));
        if (theme.spacing.cardPadding) setSlider('spacingCardPadding', parseInt(theme.spacing.cardPadding));
    }
    
    // Style
    if (theme.style) {
        if (theme.style.borderRadius) setSlider('styleBorderRadius', parseInt(theme.style.borderRadius));
        if (theme.style.borderWidth) setSlider('styleBorderWidth', parseInt(theme.style.borderWidth));
        if (theme.style.shadowIntensity) document.getElementById('styleShadowIntensity').value = theme.style.shadowIntensity;
        if (theme.style.cardHoverEffect) document.getElementById('styleCardHover').value = theme.style.cardHoverEffect;
    }
    
    applyPreviewStyles();
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

// Apply styles to preview frame
function applyPreviewStyles() {
    previewFrame = document.getElementById('previewFrame');
    if (!previewFrame || !previewFrame.contentWindow) return;
    
    try {
        const previewDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
        const root = previewDoc.documentElement;
        
        // Apply colors
        root.style.setProperty('--accent-primary', document.getElementById('colorPrimary').value);
        root.style.setProperty('--accent-hover', document.getElementById('colorSecondary').value);
        root.style.setProperty('--bg-secondary', document.getElementById('colorBackground').value);
        root.style.setProperty('--bg-card', document.getElementById('colorCardBg').value);
        root.style.setProperty('--text-primary', document.getElementById('colorTextPrimary').value);
        root.style.setProperty('--text-secondary', document.getElementById('colorTextSecondary').value);
        root.style.setProperty('--bg-primary', document.getElementById('colorHeaderBg').value);
        
        // Apply fonts
        const bodyFont = document.getElementById('fontPrimary').value;
        const headingFont = document.getElementById('fontHeading').value;
        previewDoc.body.style.fontFamily = bodyFont;
        const headings = previewDoc.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(h => h.style.fontFamily = headingFont);
        
        // Apply layout
        root.style.setProperty('--space-lg', document.getElementById('spacingProductGap').value + 'px');
        const productGrid = previewDoc.querySelector('.product-grid');
        if (productGrid) {
            productGrid.style.gridTemplateColumns = `repeat(auto-fill, minmax(${document.getElementById('layoutProductMinWidth').value}px, 1fr))`;
            productGrid.style.gap = document.getElementById('spacingProductGap').value + 'px';
        }
        
        // Apply style
        root.style.setProperty('--radius-lg', document.getElementById('styleBorderRadius').value + 'px');
        
        const productCards = previewDoc.querySelectorAll('.product-card');
        productCards.forEach(card => {
            card.style.borderWidth = document.getElementById('styleBorderWidth').value + 'px';
            card.style.borderRadius = document.getElementById('styleBorderRadius').value + 'px';
        });
        
        const productImages = previewDoc.querySelectorAll('.product-card img');
        productImages.forEach(img => {
            img.style.height = document.getElementById('layoutImageHeight').value + 'px';
        });
        
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
            primary: document.getElementById('colorPrimary').value,
            secondary: document.getElementById('colorSecondary').value,
            background: document.getElementById('colorBackground').value,
            cardBackground: document.getElementById('colorCardBg').value,
            textPrimary: document.getElementById('colorTextPrimary').value,
            textSecondary: document.getElementById('colorTextSecondary').value,
            headerBg: document.getElementById('colorHeaderBg').value,
            footerBg: document.getElementById('colorFooterBg').value,
            buttonBg: document.getElementById('colorButtonBg').value,
            buttonText: document.getElementById('colorButtonText').value
        },
        fonts: {
            primary: document.getElementById('fontPrimary').value,
            heading: document.getElementById('fontHeading').value,
            baseSize: document.getElementById('fontBaseSize').value + 'px',
            priceSize: document.getElementById('fontPriceSize').value + 'rem'
        },
        spacing: {
            productGap: document.getElementById('spacingProductGap').value + 'px',
            cardPadding: document.getElementById('spacingCardPadding').value + 'px'
        },
        layout: {
            maxWidth: document.getElementById('layoutMaxWidth').value + 'px',
            productMinWidth: document.getElementById('layoutProductMinWidth').value + 'px',
            productImageHeight: document.getElementById('layoutImageHeight').value + 'px'
        },
        style: {
            borderRadius: document.getElementById('styleBorderRadius').value + 'px',
            borderWidth: document.getElementById('styleBorderWidth').value + 'px',
            shadowIntensity: document.getElementById('styleShadowIntensity').value,
            cardHoverEffect: document.getElementById('styleCardHover').value
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
    loadCurrentDesign();
    
    // Wait for iframe to load before applying preview
    const iframe = document.getElementById('previewFrame');
    iframe.addEventListener('load', () => {
        setTimeout(() => {
            applyPreviewStyles();
        }, 500);
    });
});

