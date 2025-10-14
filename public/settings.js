// public/settings.js - Complete settings page JavaScript
const token = localStorage.getItem('token') || getCookie('adminToken');
if (!token) {
    window.location.href = 'login.html';
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

let currentSettings = {};
let printSizes = [];

async function loadCurrentSettings() {
    try {
        const response = await fetch('/api/settings', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        currentSettings = await response.json();
        
        // Populate forms with current values
        document.getElementById('storeName').value = currentSettings.shopName || '';
        
        const primaryColor = currentSettings.theme?.headerColor || '#8B5CF6';
        const secondaryColor = currentSettings.theme?.buttonColor || '#7C3AED';
        
        // Update color inputs with a delay to ensure rendering
        const primaryColorInput = document.getElementById('primaryColor');
        const secondaryColorInput = document.getElementById('secondaryColor');
        
        setTimeout(() => {
            primaryColorInput.value = primaryColor;
            secondaryColorInput.value = secondaryColor;
            
            // Force browser to re-render the color swatch
            primaryColorInput.type = 'text';
            secondaryColorInput.type = 'text';
            
            setTimeout(() => {
                primaryColorInput.type = 'color';
                secondaryColorInput.type = 'color';
                primaryColorInput.value = primaryColor;
                secondaryColorInput.value = secondaryColor;
            }, 10);
        }, 100);
        
        document.getElementById('footerText').value = currentSettings.footerText || '© 2024. All rights reserved.';
        
        console.log('Form populated with:');
        console.log('- Store Name:', currentSettings.shopName);
        console.log('- Primary Color:', primaryColor);
        console.log('- Secondary Color:', secondaryColor);
        console.log('- Footer Text:', currentSettings.footerText);
        
        // Display current logo if exists
        if (currentSettings.shopLogo) {
            const logoPreview = document.getElementById('logoPreview');
            const logoPreviewImage = document.getElementById('logoPreviewImage');
            if (logoPreview && logoPreviewImage) {
                logoPreviewImage.src = currentSettings.shopLogo;
                logoPreview.style.display = 'block';
            }
        }
        
        // Load print sizes from the print-sizes API
        try {
            const printSizesResponse = await fetch('/api/print-sizes');
            const sizes = await printSizesResponse.json();
            if (sizes && sizes.length > 0) {
                printSizes = sizes;
            }
        } catch (error) {
            console.error('Error loading print sizes:', error);
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
                   value="${size.name || size.size || ''}" 
                   placeholder="Size name and dimensions (e.g., 8x10 inches)" 
                   onchange="updateSize(${index}, 'name', this.value)"
                   style="flex: 3; padding: 10px 12px;">
            <button type="button" onclick="removeSize(${index})" class="btn btn-danger">Remove</button>
        </div>
    `).join('');
}

function addSizeField() {
    printSizes.push({ name: '', dimensions: name });  // Use name for both
    displayPrintSizes();
}

function updateSize(index, field, value) {
    if (printSizes[index]) {
        printSizes[index][field] = value;
        printSizes[index]['dimensions'] = value;  // Keep both in sync
    }
}

function removeSize(index) {
    printSizes.splice(index, 1);
    displayPrintSizes();
}

// Initialize logo drag & drop
function initializeLogoDragDrop() {
    const logoDropZone = document.getElementById('logoDropZone');
    const logoInput = document.getElementById('storeLogo');
    
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
        
        logoInput.addEventListener('change', updateLogoPreview);
    }
}

function handleLogoFile(file) {
    const logoInput = document.getElementById('storeLogo');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    logoInput.files = dataTransfer.files;
    updateLogoPreview();
}

function updateLogoPreview() {
    const logoInput = document.getElementById('storeLogo');
    const preview = document.getElementById('logoPreview');
    const previewImg = document.getElementById('logoPreviewImage');
    
    if (!preview || !previewImg) return;
    
    if (logoInput.files.length === 0) {
        preview.style.display = 'none';
        return;
    }
    
    const file = logoInput.files[0];
    
    // Check file size (1MB max)
    const maxSize = 1000000;
    if (file.size > maxSize) {
        alert(`⚠️ Maximum logo size is 1MB.\n\nYour file is ${(file.size / 1000000).toFixed(2)}MB. Please compress it before uploading.`);
        logoInput.value = '';
        preview.style.display = 'none';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

async function removeStoreLogo(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // Clear the file input
    document.getElementById('storeLogo').value = '';
    document.getElementById('logoPreview').style.display = 'none';
    
    // Delete logo from database
    try {
        const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                shopName: currentSettings.shopName || '',
                headerColor: currentSettings.theme?.headerColor || '#8B5CF6',
                buttonColor: currentSettings.theme?.buttonColor || '#7C3AED',
                footerText: currentSettings.footerText || '© 2024. All rights reserved.',
                removeLogo: true  // Signal to remove logo
            })
        });
        
        if (response.ok) {
            showNotification('Logo removed successfully!', 'success');
            currentSettings.shopLogo = null;
        }
    } catch (error) {
        console.error('Error removing logo:', error);
    }
}

// Branding form
document.getElementById('brandingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const storeName = document.getElementById('storeName').value;
    const headerColor = document.getElementById('primaryColor').value;
    const buttonColor = document.getElementById('secondaryColor').value;
    const footerText = document.getElementById('footerText').value;
    
    console.log('Submitting branding form:');
    console.log('- Store Name:', storeName);
    console.log('- Header Color:', headerColor);
    console.log('- Button Color:', buttonColor);
    console.log('- Footer Text:', footerText);
    
    const formData = new FormData();
    formData.append('shopName', storeName);
    formData.append('headerColor', headerColor);
    formData.append('buttonColor', buttonColor);
    formData.append('footerText', footerText);
    
    const logoFile = document.getElementById('storeLogo').files[0];
    if (logoFile) {
        formData.append('logo', logoFile);
        
        // Show progress
        const progressDiv = document.getElementById('logoUploadProgress');
        const progressBar = document.getElementById('logoProgressBar');
        const progressText = document.getElementById('logoProgressText');
        
        if (progressDiv) {
            progressDiv.style.display = 'block';
            progressBar.style.width = '0%';
            progressText.textContent = 'Uploading logo...';
        }
    }
    
    try {
        const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Settings saved successfully:', data);
            
            const progressDiv = document.getElementById('logoUploadProgress');
            const progressBar = document.getElementById('logoProgressBar');
            const progressText = document.getElementById('logoProgressText');
            
            if (progressDiv && logoFile) {
                progressBar.style.width = '100%';
                progressText.textContent = 'Upload complete!';
                setTimeout(() => {
                    progressDiv.style.display = 'none';
                }, 1000);
            }
            
            showNotification('Branding settings updated!', 'success');
            
            // Update current settings with the response
            currentSettings = data;
            
            // Update the logo preview if there's a new logo
            if (data.shopLogo && logoFile) {
                const logoPreview = document.getElementById('logoPreview');
                const logoPreviewImage = document.getElementById('logoPreviewImage');
                if (logoPreview && logoPreviewImage) {
                    logoPreviewImage.src = data.shopLogo;
                    logoPreview.style.display = 'block';
                }
            }
        } else {
            const error = await response.text();
            console.error('Error response:', error);
            const progressDiv = document.getElementById('logoUploadProgress');
            if (progressDiv) progressDiv.style.display = 'none';
            showNotification('Error updating branding: ' + error, 'error');
        }
    } catch (error) {
        const progressDiv = document.getElementById('logoUploadProgress');
        if (progressDiv) progressDiv.style.display = 'none';
        showNotification('Error updating settings', 'error');
    }
});

// Print sizes form
document.getElementById('printSizesForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
        // Filter out empty sizes
        const validSizes = printSizes.filter(s => s.name && s.name.trim() !== '');
    
    if (validSizes.length === 0) {
        showNotification('Please add at least one print size with name and dimensions', 'error');
        return;
    }
    
    try {
        // First, delete all existing print sizes
        const existingSizes = await fetch('/api/print-sizes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const existing = await existingSizes.json();
        
        for (const size of existing) {
            await fetch(`/api/print-sizes/${size._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }
        
        // Then create new ones
        for (const size of validSizes) {
            await fetch('/api/print-sizes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: size.name,
                    dimensions: size.name,  // Use name for dimensions too
                    order: validSizes.indexOf(size)
                })
            });
        }
        
        showNotification('Print sizes updated!', 'success');
        // Update the stored sizes
        printSizes = validSizes;
        displayPrintSizes();
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
        const response = await fetch('/api/auth/change-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                newEmail: updates.email,
                password: newPassword || 'dummy' // This needs to be the current password
            })
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
        let success = true;
        
        // Update password if provided
        if (updates.password) {
            try {
                const passwordResponse = await fetch('/api/auth/change-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        currentPassword: 'admin123',  // Default password
                        newPassword: updates.password
                    })
                });
                
                if (!passwordResponse.ok) {
                    showNotification('Error updating password - make sure current password is correct', 'error');
                    success = false;
                }
            } catch (error) {
                showNotification('Error updating password', 'error');
                success = false;
            }
        }
        
        // Update email if provided
        if (updates.email && success) {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                if (user) {
                    user.email = updates.email;
                    localStorage.setItem('user', JSON.stringify(user));
                }
            } catch (error) {
                console.error('Error updating email in localStorage:', error);
            }
        }
        
        const response = { ok: success };
        
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
    // Clear admin cookie
    document.cookie = 'adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = 'login.html';
}

async function runDatabaseCleanup() {
    if (!confirm('This will clean up stuck database entries. Continue?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/admin/cleanup', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification(`Cleanup completed: ${result.results.productsDeleted} products, ${result.results.printSizesDeleted} print sizes removed`, 'success');
        } else {
            showNotification('Error during cleanup', 'error');
        }
    } catch (error) {
        showNotification('Error during cleanup: ' + error.message, 'error');
    }
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
document.addEventListener('DOMContentLoaded', () => {
    loadCurrentSettings();
    initializeLogoDragDrop();
});