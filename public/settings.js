// public/settings.js - Complete settings page JavaScript
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'login.html';
}

let currentSettings = {};
let printSizes = [];

async function loadCurrentSettings() {
    try {
        const response = await fetch('/api/settings');
        currentSettings = await response.json();
        
        // Populate forms with current values
        if (currentSettings.storeName) {
            document.getElementById('storeName').value = currentSettings.storeName;
        }
        if (currentSettings.storeLogo) {
            document.getElementById('storeLogo').value = currentSettings.storeLogo;
        }
        if (currentSettings.primaryColor) {
            document.getElementById('primaryColor').value = currentSettings.primaryColor;
        }
        if (currentSettings.secondaryColor) {
            document.getElementById('secondaryColor').value = currentSettings.secondaryColor;
        }
        
        // Load print sizes
        if (currentSettings.printSizes && currentSettings.printSizes.length > 0) {
            printSizes = currentSettings.printSizes;
        } else {
            // Default print sizes if none exist
            printSizes = [
                { size: '8x10', additionalPrice: 0 },
                { size: '11x14', additionalPrice: 10 },
                { size: '16x20', additionalPrice: 25 }
            ];
        }
        displayPrintSizes();
        
        // Load payment settings (public keys only)
        if (currentSettings.stripePublicKey) {
            document.getElementById('stripePublicKey').value = currentSettings.stripePublicKey;
        }
        if (currentSettings.paypalClientId) {
            document.getElementById('paypalClientId').value = currentSettings.paypalClientId;
        }
        
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

function displayPrintSizes() {
    const container = document.getElementById('sizesContainer');
    
    if (printSizes.length === 0) {
        container.innerHTML = '<p style="color: var(--text-tertiary);">No print sizes configured. Click "Add Size" to create one.</p>';
        return;
    }
    
    container.innerHTML = printSizes.map((size, index) => `
        <div class="size-row" style="display: flex; gap: 12px; margin-bottom: 12px; align-items: center;">
            <input type="text" 
                   value="${size.size}" 
                   placeholder="Size (e.g., 8x10)" 
                   onchange="updateSize(${index}, 'size', this.value)"
                   style="flex: 2; padding: 10px 12px;">
            <input type="number" 
                   value="${size.additionalPrice}" 
                   step="0.01"
                   min="0"
                   placeholder="Additional price" 
                   onchange="updateSize(${index}, 'additionalPrice', parseFloat(this.value))"
                   style="flex: 1; padding: 10px 12px;">
            <button type="button" onclick="removeSize(${index})" class="btn btn-danger">Remove</button>
        </div>
    `).join('');
}

function addSizeField() {
    printSizes.push({ size: '', additionalPrice: 0 });
    displayPrintSizes();
}

function updateSize(index, field, value) {
    if (printSizes[index]) {
        printSizes[index][field] = value;
    }
}

function removeSize(index) {
    printSizes.splice(index, 1);
    displayPrintSizes();
}

// Branding form
document.getElementById('brandingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const updates = {
        storeName: document.getElementById('storeName').value,
        storeLogo: document.getElementById('storeLogo').value,
        primaryColor: document.getElementById('primaryColor').value,
        secondaryColor: document.getElementById('secondaryColor').value
    };
    
    try {
        const response = await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates)
        });
        
        if (response.ok) {
            showNotification('Branding settings updated!', 'success');
        } else {
            showNotification('Error updating branding', 'error');
        }
    } catch (error) {
        showNotification('Error updating settings', 'error');
    }
});

// Print sizes form
document.getElementById('printSizesForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Filter out empty sizes
    const validSizes = printSizes.filter(s => s.size && s.size.trim() !== '');
    
    if (validSizes.length === 0) {
        showNotification('Please add at least one print size', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ printSizes: validSizes })
        });
        
        if (response.ok) {
            showNotification('Print sizes updated!', 'success');
            // Update the stored sizes
            printSizes = validSizes;
            displayPrintSizes();
        } else {
            showNotification('Error updating print sizes', 'error');
        }
    } catch (error) {
        showNotification('Error updating print sizes', 'error');
    }
});

// Payment settings form
document.getElementById('paymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const updates = {
        stripePublicKey: document.getElementById('stripePublicKey').value,
        stripeSecretKey: document.getElementById('stripeSecretKey').value,
        paypalClientId: document.getElementById('paypalClientId').value
    };
    
    try {
        const response = await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates)
        });
        
        if (response.ok) {
            showNotification('Payment settings updated!', 'success');
        } else {
            showNotification('Error updating payment settings', 'error');
        }
    } catch (error) {
        showNotification('Error updating payment settings', 'error');
    }
});

// Account form
document.getElementById('accountForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword && newPassword !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    const updates = {
        email: document.getElementById('adminEmail').value
    };
    
    if (newPassword) {
        updates.password = newPassword;
    }
    
    try {
        const response = await fetch('/api/admin/account', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates)
        });
        
        if (response.ok) {
            showNotification('Account updated successfully!', 'success');
            if (updates.email) {
                // Update stored user info
                const user = JSON.parse(localStorage.getItem('user'));
                user.email = updates.email;
                localStorage.setItem('user', JSON.stringify(user));
            }
            // Clear password fields
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            showNotification('Error updating account', 'error');
        }
    } catch (error) {
        showNotification('Error updating account', 'error');
    }
});

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'var(--success)' : 'var(--danger)';
    
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${bgColor};
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
    }, 3000);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Add animation styles
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
`;
document.head.appendChild(style);

// Initialize
loadCurrentSettings();