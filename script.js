/**
 * THE DAILY GRIND - CUSTOM SCRIPT
 */

let cart = [];
let currentUser = null;
let orderHistory = [];
let initialAuthHTML = '';
let pendingAction = null; // Remembers if we need to open cart after login

window.onload = () => {
    const authWrapper = document.getElementById('auth-content-wrapper');
    if (authWrapper) initialAuthHTML = authWrapper.innerHTML;
    handleReveal();
};

function showPopup(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>☕</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function addToCart(name, price) {
    cart.push({ name, price });
    updateCartCount();
    showPopup(`${name} added to cart!`);
}

function updateCartCount() {
    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.innerText = cart.length;
}

function openCart() {
    const list = document.getElementById('cart-items');
    const totalSpan = document.getElementById('total-price');
    const checkoutBtn = document.querySelector('#cart-modal .btn');
   
    list.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        list.innerHTML = "<p class='empty-msg'>Your cart is empty.</p>";
        if (checkoutBtn) checkoutBtn.style.display = "none";
    } else {
        if (checkoutBtn) {

    checkoutBtn.style.display = "block";

    if (currentUser) {

        checkoutBtn.innerText = "Proceed to Payment";
        checkoutBtn.onclick = goToPayment;

    } else {

        checkoutBtn.innerText = "Login to Checkout";

        checkoutBtn.onclick = () => {
            pendingAction = 'checkout';
            closeModals();
            openLogin();
        };
    }
}
        cart.forEach((item, i) => {
            total += item.price;
            list.innerHTML += `<div class="cart-item">
                <div class="cart-item-info"><span>${item.name}</span><small>$${item.price.toFixed(2)}</small></div>
                <button class="remove-btn" onclick="removeFromCart(${i})">Remove</button>
            </div>`;
        });
    }
    totalSpan.innerText = total.toFixed(2);
    document.getElementById('cart-modal').style.display = "block";
}

function removeFromCart(index) {
    const removedItem = cart[index].name;
    cart.splice(index, 1);
    updateCartCount();
    openCart();
    showPopup(`Removed ${removedItem} from cart.`);
}

function openLogin() {
    console.log("Login clicked");
    const wrapper = document.getElementById('auth-content-wrapper');
    if (wrapper) wrapper.innerHTML = initialAuthHTML;
    toggleAuth(false);
    document.getElementById('login-modal').style.display = "block";
}

function handleAuth(event, type) {
    event.preventDefault();
    const email = event.target.querySelector('input[type="email"]').value;
    const password = event.target.querySelector('input[type="password"]').value;

    if (type === 'login') {
        // Dummy check: email must contain '@' and password must be longer than 3 chars
        if (password.length < 4) {
            showPopup("Password too short!");
            return;
        }
        currentUser = { 
            name: email.split('@')[0], 
            email: email,
            orders: 0, 
            points: 0 
        };
    } else {
        // SIGNUP: Create a fresh profile
        currentUser = { 
            name: event.target.querySelector('input[type="text"]').value,
            email: email,
            orders: 0, 
            points: 0 
        };
    }

    document.getElementById('auth-content-wrapper').innerHTML = `<div style="text-align:center; padding: 50px;"><h2>Brewing Profile...</h2></div>`;

    setTimeout(() => {
        document.getElementById('login-modal').style.display = "none";
        updateNavUI(true);
        
        // Logic for auto-redirect
        if (pendingAction === 'checkout') {
            pendingAction = null;
            openCart();
        } else {
            showPopup(`Welcome back, ${currentUser.name}!`);
        }
    }, 1000);
}

function updateNavUI(isLoggedIn) {
    const navLinks = document.querySelector('.nav-links');
    const loginLink = navLinks.querySelector('li:last-child');
    
    if (isLoggedIn) {
        loginLink.innerHTML = `<a href="javascript:void(0)" onclick="openProfile()">Profile</a>`;
    } else {
        loginLink.innerHTML = `<a href="javascript:void(0)" onclick="openLogin()">Login</a>`;
    }
}

function openProfile() {
    if (!currentUser) return openLogin();

    document.getElementById('user-display-name').innerText = currentUser.name;
    document.getElementById('user-display-email').innerText = currentUser.email;
    
    // Update stats dynamically based on the current user session
    document.querySelector('.profile-stats .stat-box:nth-child(1) h4').innerText = currentUser.orders;
    document.querySelector('.profile-stats .stat-box:nth-child(2) h4').innerText = currentUser.points;

    document.getElementById('user-orders').innerText =
    currentUser.orders || 0;

    document.getElementById('user-points').innerText =
    currentUser.points || 0;

    const historyList = document.getElementById('recent-orders-list');
    if (currentUser.orders > 0) {
        // Display user-specific history
    } else {
        historyList.innerHTML = `<p class="empty-msg">No recent orders yet. Time for a brew?</p>`;
    }
    document.getElementById('profile-modal').style.display = "block";
}

function handleLogout() {
    currentUser = null;
    updateNavUI(false);
    closeModals();
    showPopup("Logged out successfully.");
}

function goToPayment() {
    if (cart.length === 0) return;
    if (!currentUser) {
        pendingAction = 'checkout';
        closeModals();
        openLogin();
        return;
    }
    closeModals();
    document.getElementById('payment-modal').style.display = "block";
}

function closeModals() {
    ['cart-modal', 'payment-modal', 'login-modal', 'profile-modal'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
}

// Payment Logic
function selectPayment(method) {
    const details = document.getElementById('payment-details');
    document.getElementById('payment-step-1').style.display = 'none';
    document.getElementById('payment-step-2').style.display = 'block';

    if (method === 'qr') {
        details.innerHTML = `
            <h3>Scan to Pay</h3>

            <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=9876543210@upi&pn=TheDailyGrind"
                alt="UPI QR Code"
                style="width:250px;height:250px;border-radius:10px;margin:15px 0;"
            >

            <p><strong>UPI ID:</strong> 9876543210@upi</p>
        `;
    } else if (method === 'card') {
        details.innerHTML = `
            <h3>Enter Card Details</h3>
            <input id="card-number" type="text" maxlength="16" oninput="this.value=this.value.replace(/[^0-9]/g,'')" placeholder="Card Number" maxlength="16" required style="width:100%;padding:10px;margin-bottom:10px;">
            <input id="card-holder" type="text" placeholder="Card Holder Name" required style="width:100%;padding:10px;margin-bottom:10px;">
            <input id="card-cvv" type="password" placeholder="CVV" maxlength="3" required style="width:100%;padding:10px;margin-bottom:10px;">
        `;
    } else {
        details.innerHTML = `<h3>Pay at Counter</h3><p>Please present your order number at the counter.</p>`;
    }
}

function processPayment() {

    const cardNumber = document.getElementById('card-number');

    if (cardNumber) {

        const holder = document.getElementById('card-holder');
        const cvv = document.getElementById('card-cvv');

        if (
            cardNumber.value.trim() === '' ||
            holder.value.trim() === '' ||
            cvv.value.trim() === ''
        ) {
            showAlert(
                'Please fill all card details.',
                'Payment Error'
            );
            return;
        }

        if (cardNumber.value.length < 16) {
            showAlert(
                'Card number must contain 16 digits.',
                'Invalid Card'
            );
            return;
        }

        if (cvv.value.length !== 3) {
            showAlert(
                'CVV must contain exactly 3 digits.',
                'Invalid CVV'
            );
            return;
        }
    }

    if (currentUser) {
        currentUser.orders++;
        currentUser.points += 50;
    }

    const receipt = document.getElementById('receipt-container');

let receiptHTML = `
    <h3 style="text-align:center;">THE DAILY GRIND</h3>
    <hr>
    <p><strong>Receipt No:</strong> #${Date.now()}</p>
    <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
    <hr>
`;

let total = 0;

cart.forEach(item => {
    total += item.price;

    receiptHTML += `
        <div style="display:flex;justify-content:space-between;">
            <span>${item.name}</span>
            <span>$${item.price.toFixed(2)}</span>
        </div>
    `;
});

receiptHTML += `
    <hr>
    <div style="display:flex;justify-content:space-between;font-weight:bold;">
        <span>Total</span>
        <span>$${total.toFixed(2)}</span>
    </div>
    <hr>
    <p style="text-align:center;">
        Thank you for visiting The Daily Grind ☕
    </p>
`;

receipt.innerHTML = receiptHTML;

    document.getElementById('payment-step-2').style.display = 'none';
    document.getElementById('payment-success').style.display = 'block';

    cart = [];
    updateCartCount();
}

function downloadReceipt() {

    const receiptContent =
        document.getElementById('receipt-container').innerText;

    const blob = new Blob(
        [receiptContent],
        { type: 'text/plain' }
    );

    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);

    link.download =
        `receipt-${Date.now()}.txt`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    closeModals();

    document.getElementById('success-screen').style.display = "flex";
}

// Helpers
window.onclick = (e) => { if (e.target.classList.contains('modal')) closeModals(); };
function handleReveal() { document.querySelectorAll('.reveal').forEach(el => { if (el.getBoundingClientRect().top < window.innerHeight - 50) el.classList.add('active'); }); }
window.addEventListener('scroll', () => { handleReveal(); });

// Event Listeners
window.addEventListener('scroll', () => {
    handleReveal();
    const nav = document.querySelector('.navbar');
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
});

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        closeModals();
    }
};

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === "#") return;
        e.preventDefault();
        const target = document.querySelector(targetId);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

function processOrder() {
    // 1. Target the modal content area
    const paymentModalContent = document.querySelector('#payment-modal .modal-content');
    // 2. Clear the options and show a loading message
    paymentModalContent.innerHTML = `
        <div style="padding: 40px 0;">
            <h2 style="font-family:'Playfair Display'">Processing Payment...</h2>
            <p>Verifying with your bank...</p>
        </div>
    `;
    // 3. Wait 2 seconds, then show success screen
    setTimeout(() => {
        // Hide the payment modal
        document.getElementById('payment-modal').style.display = "none";
        // Show the dark success screen
        document.getElementById('success-screen').style.display = "flex";
        // Reset the cart and history
        const orderDetails = {
            items: cart.length + (cart.length === 1 ? " item" : " items"),
            total: document.getElementById('total-price').innerText
        };
        orderHistory.unshift(orderDetails);
        cart = [];
        updateCartCount();
        showPopup("Order confirmed!");
    }, 2000);
    if (currentUser) {
        currentUser.orders += 1;
        currentUser.points += 50; // Add points on order
    }
}

/**
 * Handles the Newsletter subscription
 */
function handleNewsletter(event) {
    event.preventDefault();
    const email = event.target.querySelector('input[type="email"]').value;
    
    // Replace with your API endpoint or email service logic
    console.log("Newsletter subscribed:", email);
    showAlert(
        'Thanks for joining the Coffee Club!',
        'Subscription Successful'
    );
    event.target.reset();
}

/**
 * Handles the Contact Form submission
 */
function handleContact(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('contact-name').value,
        email: document.getElementById('contact-email').value,
        feedback: document.getElementById('contact-feedback').value
    };

    // Example: Sending data to a backend
    console.log("Feedback received:", formData);
    showAlert(
        `Thank you for your feedback, ${formData.name}!`,
        'Feedback Received'
    );
    event.target.reset();
}

function toggleAuth(showSignup) {
    document.getElementById('login-side').style.display =
        showSignup ? 'none' : 'block';

    document.getElementById('signup-side').style.display =
        showSignup ? 'block' : 'none';
}

function backToHome() {

    document.getElementById('success-screen').style.display = 'none';

    closeModals();

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    showPopup('Welcome back!');
}

function showAlert(message, title = "Notice") {

    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-message').innerText = message;

    document.getElementById('alert-modal').style.display = 'block';
}

function closeAlert() {
    document.getElementById('alert-modal').style.display = 'none';
}