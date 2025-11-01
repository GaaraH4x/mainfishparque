// Global state
let currentUser = null;
let cart = [];
let products = {};

// Product images
const productImages = {
    fish_feed: 'https://images.unsplash.com/photo-1535082623926-b39352a03fb7?w=400',
    catfish: 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=400',
    materials: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400'
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    const savedUser = localStorage.getItem('fishParqueUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUIForLoggedInUser();
    }
    
    await loadProducts();
    
    const savedCart = localStorage.getItem('fishParqueCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }
    
    showSection('shop');
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    document.getElementById('themeIcon').textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Auth Functions
function switchAuthTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(btn => btn.classList.remove('active'));
    
    if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        tabs[0].classList.add('active');
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        tabs[1].classList.add('active');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('fishParqueUser', JSON.stringify(data.user));
            updateUIForLoggedInUser();
            showMessage('authMessage', data.message, 'success');
            setTimeout(() => showSection('shop'), 1500);
        } else {
            showMessage('authMessage', data.message, 'error');
        }
    } catch (error) {
        showMessage('authMessage', 'Login failed. Please try again.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        phone: document.getElementById('regPhone').value,
        address: document.getElementById('regAddress').value,
        password: document.getElementById('regPassword').value
    };
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('authMessage', data.message, 'success');
            setTimeout(() => switchAuthTab('login'), 2000);
            document.getElementById('registerForm').reset();
        } else {
            showMessage('authMessage', data.message, 'error');
        }
    } catch (error) {
        showMessage('authMessage', 'Registration failed. Please try again.', 'error');
    }
}

function logout() {
    currentUser = null;
    cart = [];
    localStorage.removeItem('fishParqueUser');
    localStorage.removeItem('fishParqueCart');
    updateUIForLoggedOutUser();
    showSection('shop');
}

function updateUIForLoggedInUser() {
    document.getElementById('accountText').textContent = currentUser.name.split(' ')[0];
}

function updateUIForLoggedOutUser() {
    document.getElementById('accountText').textContent = 'Account';
}

// Products
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        
        if (data.success) {
            products = data.products;
            displayProducts();
        }
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

function displayProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    
    Object.keys(products).forEach(key => {
        const product = products[key];
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${productImages[key]}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/400x200?text=${product.name}'">
            <h3>${product.name}</h3>
            <p class="product-price">₦${product.price.toLocaleString()}/${product.unit}</p>
            <p class="product-info">Minimum order: ${product.minQty}${product.unit}</p>
            <div class="quantity-controls">
                <button onclick="changeQuantity('${key}', -1)">-</button>
                <input type="number" id="qty-${key}" value="${product.minQty}" min="${product.minQty}" step="0.1">
                <button onclick="changeQuantity('${key}', 1)">+</button>
            </div>
            <button class="btn-primary" onclick="addToCart('${key}')">🛒 Add to Cart</button>
        `;
        grid.appendChild(card);
    });
}

function changeQuantity(productKey, delta) {
    const input = document.getElementById(`qty-${productKey}`);
    const product = products[productKey];
    let value = parseFloat(input.value) + delta;
    
    if (value < product.minQty) value = product.minQty;
    input.value = value;
}

function addToCart(productKey) {
    const product = products[productKey];
    const quantity = parseFloat(document.getElementById(`qty-${productKey}`).value);
    
    if (quantity < product.minQty) {
        alert(`Minimum order for ${product.name} is ${product.minQty}${product.unit}`);
        return;
    }
    
    const existingItem = cart.find(item => item.id === productKey);
    
    if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.subtotal = existingItem.quantity * existingItem.price;
    } else {
        cart.push({
            id: productKey,
            name: product.name,
            price: product.price,
            quantity: quantity,
            subtotal: quantity * product.price,
            image: productImages[productKey]
        });
    }
    
    saveCart();
    updateCartUI();
    showToast(`${product.name} added to cart!`);
}

function removeFromCart(productKey) {
    cart = cart.filter(item => item.id !== productKey);
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('fishParqueCart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartBadge = document.getElementById('cartBadge');
    const cartItems = document.getElementById('cartItems');
    const cartSummary = document.getElementById('cartSummarySection');
    const cartTotal = document.getElementById('cartTotal');
    const cartSubtotal = document.getElementById('cartSubtotal');
    
    cartBadge.textContent = cart.length;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty<br><button onclick="showSection(\'shop\')" class="btn-primary" style="max-width:200px;margin:1rem auto;">Start Shopping</button></p>';
        cartSummary.style.display = 'none';
        return;
    }
    
    let total = 0;
    cartItems.innerHTML = '';
    
    cart.forEach(item => {
        total += item.subtotal;
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/100'">
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p class="cart-item-price">₦${item.price.toLocaleString()}/${item.quantity}kg</p>
                <p>Subtotal: ₦${item.subtotal.toLocaleString()}</p>
            </div>
            <div class="cart-item-actions">
                <button class="remove-btn" onclick="removeFromCart('${item.id}')">Remove</button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
    
    cartTotal.textContent = total.toLocaleString();
    cartSubtotal.textContent = total.toLocaleString();
    cartSummary.style.display = 'block';
}

// Checkout
function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    const modal = document.getElementById('checkoutModal');
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    if (currentUser) {
        document.getElementById('checkoutName').value = currentUser.name;
        document.getElementById('checkoutPhone').value = currentUser.phone;
        document.getElementById('checkoutAddress').value = currentUser.address;
    }
    
    let total = 0;
    checkoutItems.innerHTML = '';
    cart.forEach(item => {
        total += item.subtotal;
        checkoutItems.innerHTML += `<p>${item.name}: ${item.quantity}kg × ₦${item.price.toLocaleString()} = ₦${item.subtotal.toLocaleString()}</p>`;
    });
    
    checkoutTotal.textContent = total.toLocaleString();
    modal.classList.add('active');
}

function closeCheckout() {
    document.getElementById('checkoutModal').classList.remove('active');
}

async function placeOrder(e) {
    e.preventDefault();
    
    const orderData = {
        userEmail: currentUser ? currentUser.email : 'guest@fishparque.com',
        userName: document.getElementById('checkoutName').value,
        userPhone: document.getElementById('checkoutPhone').value,
        userAddress: document.getElementById('checkoutAddress').value,
        cart: cart,
        total: cart.reduce((sum, item) => sum + item.subtotal, 0)
    };
    
    try {
        const response = await fetch('/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('checkoutMessage', data.message, 'success');
            cart = [];
            saveCart();
            updateCartUI();
            
            setTimeout(() => {
                closeCheckout();
                if (currentUser) {
                    showSection('orders');
                    loadUserOrders();
                } else {
                    showSection('shop');
                }
            }, 3000);
        } else {
            showMessage('checkoutMessage', data.message, 'error');
        }
    } catch (error) {
        showMessage('checkoutMessage', 'Order failed. Please try again.', 'error');
    }
}

// Orders
async function loadUserOrders() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`/api/orders/${currentUser.email}`);
        const data = await response.json();
        
        if (data.success) {
            displayOrders(data.orders);
        }
    } catch (error) {
        console.error('Failed to load orders:', error);
    }
}

function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<p class="empty-cart">No orders yet</p>';
        return;
    }
    
    ordersList.innerHTML = '';
    orders.reverse().forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        orderCard.innerHTML = `
            <div class="order-header">
                <div>
                    <strong>Order #${order.orderNumber}</strong>
                    <p style="color: var(--text-secondary);">${new Date(order.date).toLocaleString()}</p>
                </div>
                <span class="order-status ${order.status}">${order.status}</span>
            </div>
            <div>
                ${order.items.map(item => `
                    <p>${item.name}: ${item.quantity}kg × ₦${item.price.toLocaleString()} = ₦${item.subtotal.toLocaleString()}</p>
                `).join('')}
            </div>
            <h3 style="margin-top: 1rem; color: var(--primary-color);">Total: ₦${order.total.toLocaleString()}</h3>
        `;
        ordersList.appendChild(orderCard);
    });
}

// Feedback
async function submitFeedback(e) {
    e.preventDefault();
    
    const feedbackData = {
        name: document.getElementById('feedbackName').value,
        email: document.getElementById('feedbackEmail').value,
        category: document.getElementById('feedbackCategory').value,
        message: document.getElementById('feedbackMessage').value
    };
    
    try {
        const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedbackData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('feedbackResponseMessage', data.message, 'success');
            document.querySelector('.feedback-form').reset();
        } else {
            showMessage('feedbackResponseMessage', data.message, 'error');
        }
    } catch (error) {
        showMessage('feedbackResponseMessage', 'Failed to submit. Please try again.', 'error');
    }
}

// Search
function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.product-card');
    
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

// UI Functions
function showSection(sectionName) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.style.display = 'none');
    
    const targetSection = document.getElementById(sectionName + 'Section');
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    if (sectionName === 'orders' && currentUser) {
        loadUserOrders();
    }
    
    if (sectionName === 'cart') {
        updateCartUI();
    }
    
    if (sectionName === 'help' && currentUser) {
        document.getElementById('feedbackName').value = currentUser.name;
        document.getElementById('feedbackEmail').value = currentUser.email;
    }
}

function showMessage(elementId, message, type) {
    const messageDiv = document.getElementById(elementId);
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.className = 'message';
        }, 5000);
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--success-color);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
