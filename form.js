// Changed this line from:
// const API_URL = "https://xf4yu98rqh.execute-api.us-east-1.amazonaws.com/prod/subscribe";

/// Updated API URL to use CloudFlare Worker route
const API_URL = "https://elijahu.me/api/subscribe";

// Double submission prevention flag
let isSubmitting = false;

// Enhanced email validation
function isValidEmail(email) {
  // Basic regex check
  const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicRegex.test(email)) return false;
  
  // Additional checks
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  
  const [local, domain] = parts;
  
  // Local part checks
  if (local.length === 0 || local.length > 64) return false;
  if (local.startsWith('.') || local.endsWith('.')) return false;
  if (local.includes('..')) return false;
  
  // Domain part checks
  if (domain.length === 0 || domain.length > 255) return false;
  if (domain.startsWith('-') || domain.endsWith('-') || domain.startsWith('.') || domain.endsWith('.')) return false;
  if (!domain.includes('.')) return false;
  
  // Check for valid TLD
  const tld = domain.split('.').pop().toLowerCase();
  if (tld.length < 2) return false;
  
  // Common disposable email domains
  const disposableDomains = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
    'mailinator.com', 'temp-mail.org', 'throwaway.email',
    'yopmail.com', 'maildrop.cc', 'trashmail.com', 'getnada.com'
  ];
  
  if (disposableDomains.includes(domain.toLowerCase())) {
    return false;
  }
  
  return true;
}

// Enhanced name validation
function isValidName(name) {
  const trimmedName = name.trim();
  
  // Basic checks
  if (trimmedName.length < 2) return false;
  if (trimmedName.length > 50) return false;
  
  // Check for obvious fake names
  const fakeNames = [
    'test', 'testing', 'fake', 'example', 'sample', 'demo',
    'user', 'admin', 'null', 'undefined', 'name', 'firstname',
    'lastname', 'john doe', 'jane doe', 'asdf', 'qwerty',
    'abc', '123', 'aaa', 'bbb', 'xxx', 'yyy', 'zzz', 'anonymous',
    'anon', 'guest', 'temp', 'temporary', 'default', 'lorem', 'ipsum',
    'hello', 'hi', 'hey', 'yo', 'sup'
  ];
  
  if (fakeNames.includes(trimmedName.toLowerCase())) {
    return false;
  }
  
  // Check for patterns that look fake
  const suspiciousPatterns = [
    /^[a-z]{1,2}$/i,           // Single or double letters
    /^\d+$/,                   // Only numbers
    /^(.)\1{3,}$/,            // Same character repeated 4+ times
    /^[a-z]+\d+$/i,           // Letters followed by numbers only
    /^\d+[a-z]+$/i,           // Numbers followed by letters only
    /^[^a-zA-Z\s\-'\.]+$/,    // No letters at all
    /keyboard|qwerty|asdf|zxcv|hjkl|yuiop|wasd/i, // Keyboard mashing
    /^(.)(.)\1\2/i,           // Alternating pattern like abab
    /^(test|fake|temp|sample)/i // Starts with suspicious words
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmedName)) {
      return false;
    }
  }
  
  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(trimmedName)) {
    return false;
  }
  
  return true;
}

// Create floating particles
function createFloatingParticles() {
  const particlesContainer = document.getElementById('particles');
  if (!particlesContainer) return;
  
  const particleCount = 15;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle-dot';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 20 + 's';
    particle.style.animationDuration = (15 + Math.random() * 10) + 's';
    particlesContainer.appendChild(particle);
  }
}

// Success animation
function createSuccessAnimation() {
  const overlay = document.createElement('div');
  overlay.className = 'success-overlay';
  overlay.innerHTML = `
    <div class="success-content">
      <div class="checkmark-container">
        <svg class="checkmark" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#98971a" stroke-width="2">
          <circle cx="12" cy="12" r="10" class="checkmark-circle"/>
          <path d="m9 12 2 2 4-4" class="checkmark-check"/>
        </svg>
      </div>
      <h2 class="success-title">You're all set!</h2>
      <p class="success-message">Thanks for subscribing. You'll hear from me soooon.</p>
      <div class="celebration-particles"></div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  setTimeout(() => {
    createParticles(overlay.querySelector('.celebration-particles'));
  }, 1000);
  
  setTimeout(() => {
    overlay.style.animation = 'successFadeIn 0.3s ease reverse forwards';
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 300);
  }, 4000);
}

// Already subscribed animation
function createAlreadySubscribedAnimation() {
  const overlay = document.createElement('div');
  overlay.className = 'success-overlay';
  overlay.innerHTML = `
    <div class="success-content">
      <div class="checkmark-container">
        <svg class="already-subscribed-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d79921" stroke-width="2">
          <path d="M9 12l2 2 4-4"/>
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="6" stroke="#fabd2f" stroke-width="1"/>
        </svg>
      </div>
      <h2 class="success-title">Hey there! 👋</h2>
      <p class="success-message">You're already on the list! No need to sign up again.</p>
      <div class="celebration-particles"></div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  setTimeout(() => {
    createWarningParticles(overlay.querySelector('.celebration-particles'));
  }, 1000);
  
  setTimeout(() => {
    overlay.style.animation = 'successFadeIn 0.3s ease reverse forwards';
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 300);
  }, 3500);
}

// Error animation for invalid email or name
function createErrorAnimation(type, value) {
  console.log(`Creating error animation for ${type}:`, value);
  
  const overlay = document.createElement('div');
  overlay.className = 'success-overlay';
  
  let title, message;
  if (type === 'email') {
    title = "Hold up! 🤔";
    message = "That email looks sus. Use your real email address please!";
  } else if (type === 'name') {
    title = "Nice try! 😏";
    message = "Come on, what's your real name? I promise I won't judge!";
  } else if (type === 'fake-name') {
    title = "Enter a real name! 🙄";
    message = "Seriously? Try using your actual name this time.";
  }
  
  overlay.innerHTML = `
    <div class="success-content">
      <div class="checkmark-container">
        <svg class="error-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cc241d" stroke-width="2">
          <circle cx="12" cy="12" r="10" class="error-circle"/>
          <line x1="15" y1="9" x2="9" y2="15" class="error-x"/>
          <line x1="9" y1="9" x2="15" y2="15" class="error-x"/>
        </svg>
      </div>
      <h2 class="success-title">${title}</h2>
      <p class="success-message">${message}</p>
      <div class="celebration-particles"></div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  setTimeout(() => {
    createErrorParticles(overlay.querySelector('.celebration-particles'));
  }, 1000);
  
  setTimeout(() => {
    overlay.style.animation = 'successFadeIn 0.3s ease reverse forwards';
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 300);
  }, 3500);
}

function createParticles(container) {
  if (!container) return;
  const particleCount = 12;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const angle = (i / particleCount) * Math.PI * 2;
    const distance = 80 + Math.random() * 40;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    
    particle.style.setProperty('--dx', `${dx}px`);
    particle.style.setProperty('--dy', `${dy}px`);
    particle.style.animation = `particle 1.2s ease-out forwards`;
    particle.style.animationDelay = `${i * 0.05}s`;
    
    container.appendChild(particle);
  }
}

function createErrorParticles(container) {
  if (!container) return;
  const particleCount = 8;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.background = '#cc241d'; // Red particles for error
    
    const angle = (i / particleCount) * Math.PI * 2;
    const distance = 60 + Math.random() * 30;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    
    particle.style.setProperty('--dx', `${dx}px`);
    particle.style.setProperty('--dy', `${dy}px`);
    particle.style.animation = `particle 1s ease-out forwards`;
    particle.style.animationDelay = `${i * 0.08}s`;
    
    container.appendChild(particle);
  }
}

function createWarningParticles(container) {
  if (!container) return;
  const particleCount = 10;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.background = '#d79921'; // Yellow particles for warning
    
    const angle = (i / particleCount) * Math.PI * 2;
    const distance = 70 + Math.random() * 35;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    
    particle.style.setProperty('--dx', `${dx}px`);
    particle.style.setProperty('--dy', `${dy}px`);
    particle.style.animation = `particle 1.1s ease-out forwards`;
    particle.style.animationDelay = `${i * 0.06}s`;
    
    container.appendChild(particle);
  }
}

// Main form handling
document.addEventListener("DOMContentLoaded", () => {
  console.log('DOM loaded, initializing form...');
  createFloatingParticles();

  const form = document.getElementById("subscriptionForm");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const submitBtn = document.getElementById("submitBtn");
  const nameError = document.getElementById("nameError");
  const emailError = document.getElementById("emailError");
  
  if (!form || !nameInput || !emailInput || !submitBtn) {
    console.error('Required form elements not found');
    return;
  }
  
  console.log('All form elements found, setting up event listeners...');
  
  const showError = (el) => el && el.classList.add("show");
  const hideError = (el) => el && el.classList.remove("show");

  // Input focus effects
  [nameInput, emailInput].forEach(input => {
    input.addEventListener('focus', (e) => {
      const label = e.target.previousElementSibling;
      if (label) {
        label.style.color = 'var(--yellow)';
        label.style.transform = 'translateY(-2px)';
      }
    });

    input.addEventListener('blur', (e) => {
      const label = e.target.previousElementSibling;
      if (label) {
        label.style.color = 'var(--fg)';
        label.style.transform = 'translateY(0)';
      }
    });
  });

  // Real-time email validation as user types
  emailInput.addEventListener("input", () => {
    hideError(emailError);
    emailInput.classList.remove('error');
    
    const email = emailInput.value.trim();
    if (email && !isValidEmail(email)) {
      emailInput.style.borderColor = '#d79921'; // Yellow warning
    } else {
      emailInput.style.borderColor = ''; // Reset to default
    }
  });

  // Real-time name validation as user types
  nameInput.addEventListener("input", () => {
    hideError(nameError);
    nameInput.classList.remove('error');
    
    const name = nameInput.value.trim();
    if (name && !isValidName(name)) {
      nameInput.style.borderColor = '#d79921'; // Yellow warning
    } else {
      nameInput.style.borderColor = ''; // Reset to default
    }
  });

  // Test function for debugging (you can remove this after testing)
  window.testErrorAnimation = (type) => {
    if (type === 'name') {
      createErrorAnimation('name', 'test');
    } else if (type === 'email') {
      createErrorAnimation('email', 'fake@fake.com');
    } else if (type === 'already') {
      createAlreadySubscribedAnimation();
    }
  };

  // Form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) {
      console.log('Submission already in progress');
      return;
    }
    
    isSubmitting = true;
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    
    console.log('Form submitted with:', { name, email });
    
    // Client-side validation
    let hasError = false;
    
    if (!name) {
      console.log('No name provided');
      showError(nameError);
      nameInput.classList.add('error');
      hasError = true;
    } else if (!isValidName(name)) {
      console.log('Invalid name detected:', name);
      createErrorAnimation('name', name);
      isSubmitting = false;
      return;
    } else {
      hideError(nameError);
      nameInput.classList.remove('error');
    }
    
    if (!email) {
      console.log('No email provided');
      showError(emailError);
      emailInput.classList.add('error');
      hasError = true;
    } else if (!isValidEmail(email)) {
      console.log('Invalid email detected:', email);
      createErrorAnimation('email', email);
      isSubmitting = false;
      return;
    } else {
      hideError(emailError);
      emailInput.classList.remove('error');
    }
    
    if (hasError) {
      isSubmitting = false;
      return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    
    console.log('Making API call to CloudFlare Worker:', API_URL);
    
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email })
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Success response:', data);
        form.reset();
        createSuccessAnimation();
      } else {
        const data = await response.json();
        console.log('Error response:', data);
        
        // Handle different types of errors from your Cloudflare Worker
        if (response.status === 409 || 
            (data.error && data.error.toLowerCase().includes('already')) ||
            (data.message && data.message.toLowerCase().includes('already')) ||
            (data.error && data.error.toLowerCase().includes('exist'))) {
          // Already subscribed
          console.log('User already subscribed');
          createAlreadySubscribedAnimation();
        } else if (data.error && (
          data.error.toLowerCase().includes('email') || 
          data.error.toLowerCase().includes('invalid email') ||
          data.error.toLowerCase().includes('fake') || 
          data.error.toLowerCase().includes('disposable') ||
          data.error.toLowerCase().includes('temporary')
        )) {
          console.log('Email validation error from server');
          createErrorAnimation('email', email);
        } else if (data.error && (
          data.error.toLowerCase().includes('name') ||
          data.error.toLowerCase().includes('invalid name')
        )) {
          console.log('Name validation error from server');
          createErrorAnimation('name', name);
        } else {
          // Generic error fallback
          console.log('Generic error:', data.error || data.message);
          alert(data.error || data.message || "Something went wrong. Please try again.");
        }
      }
    } catch (error) {
      console.error('Network error:', error);
      alert("Network error. Please check your connection and try again.");
    } finally {
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
    }
  });
  
  console.log('Form initialization complete');
});
