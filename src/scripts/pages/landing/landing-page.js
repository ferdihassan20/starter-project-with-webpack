import { StoryModel } from '../../data/story-model.js';
import { LoginPresenter } from '../../presenter/login-presenter.js';

export default class LandingPage {
  constructor() {
    this.model = new StoryModel();
    this.presenter = new LoginPresenter(this.model, this);
  }

  async render() {
    return `
      <header>
        <a href="#main-content" class="skip-to-content">Lompat ke konten utama</a>
      </header>

      <main id="main-content" tabindex="-1">
        <div class="landing-container">
          <div class="hero-section">
            <h1>&lt;/&gt; Welcome to Story Share</h1>
            <p class="hero-subtitle">A platform where developers share their coding journey stories, experiences, and moments of growth. Join our community to share your story or explore others' journeys.</p>
            
            <p class="auth-prompt">Login to discover more stories and share your own journey</p>
            
            <div class="cta-buttons">
              <button id="show-login" class="cta-button login">
                <i class="fas fa-sign-in-alt"></i> Login
              </button>
              <button id="show-register" class="cta-button register">
                <i class="fas fa-user-plus"></i> Register
              </button>
            </div>
          </div>
        </div>

        <!-- Login Modal -->
        <div id="login-modal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="login-title">
          <div class="modal-content">
            <div class="exact-modal">
              <h2 id="login-title">LOGIN</h2>
              <form id="login-form" aria-label="Login form" autocomplete="on">
                <div class="form-group">
                  <label for="login-email">Email</label>
                  <input 
                    type="text" 
                    id="login-email" 
                    name="email" 
                    required 
                    placeholder="Enter your email"
                    autocomplete="email"
                  />
                </div>
                <div class="form-group">
                  <label for="login-password">Password</label>
                  <input 
                    type="password" 
                    id="login-password" 
                    name="password" 
                    required 
                    placeholder="Enter your password"
                    autocomplete="current-password"
                  />
                </div>
                <div id="login-message" class="message" role="alert" aria-live="polite"></div>
                <button type="submit" class="auth-button">SIGN IN</button>
              </form>
              <div class="auth-links">
                <a href="#" id="switch-to-register">Create an Account</a>
              </div>
            </div>
          </div>
        </div>

        <!-- Register Modal -->
        <div id="register-modal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="register-title">
          <div class="modal-content">
            <div class="exact-modal">
              <h2 id="register-title">CREATE ACCOUNT</h2>
              <form id="register-form" aria-label="Registration form" autocomplete="on">
                <div class="form-group">
                  <label for="register-name">Full Name</label>
                  <input 
                    type="text" 
                    id="register-name" 
                    name="name" 
                    required 
                    placeholder="Enter your full name"
                    autocomplete="name"
                  />
                </div>
                <div class="form-group">
                  <label for="register-email">Email</label>
                  <input 
                    type="text" 
                    id="register-email" 
                    name="email" 
                    required 
                    placeholder="Enter your email"
                    autocomplete="email"
                  />
                </div>
                <div class="form-group">
                  <label for="register-password">Password</label>
                  <input 
                    type="password" 
                    id="register-password" 
                    name="password" 
                    required 
                    placeholder="Enter your password"
                    autocomplete="new-password"
                  />
                </div>
                <div id="register-message" class="message" role="alert" aria-live="polite"></div>
                <button type="submit" class="auth-button">CREATE ACCOUNT</button>
              </form>
              <div class="auth-links">
                <a href="#" id="switch-to-login">Already have an account?</a>
              </div>
            </div>
          </div>
        </div>
      </main>
    `;
  }

  async afterRender() {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      window.location.hash = '#/';
      return;
    }

    // No need for complex skip link handling - using native browser behavior
    // The browser will automatically handle the focus management when clicking the skip link

    this._setupModalToggles();
    this._setupForms();
  }

  _setupModalToggles() {
    // Show modals
    document.getElementById('show-login').addEventListener('click', () => {
      const modal = document.getElementById('login-modal');
      modal.style.display = 'flex';
      setTimeout(() => modal.classList.add('visible'), 10);
    });

    document.getElementById('show-register').addEventListener('click', () => {
      const modal = document.getElementById('register-modal');
      modal.style.display = 'flex';
      setTimeout(() => modal.classList.add('visible'), 10);
    });

    // Switch between modals
    document.getElementById('switch-to-register').addEventListener('click', (e) => {
      e.preventDefault();
      const loginModal = document.getElementById('login-modal');
      const registerModal = document.getElementById('register-modal');
      
      loginModal.classList.remove('visible');
      setTimeout(() => {
        loginModal.style.display = 'none';
        registerModal.style.display = 'flex';
        setTimeout(() => registerModal.classList.add('visible'), 10);
      }, 300);
    });

    document.getElementById('switch-to-login').addEventListener('click', (e) => {
      e.preventDefault();
      const registerModal = document.getElementById('register-modal');
      const loginModal = document.getElementById('login-modal');
      
      registerModal.classList.remove('visible');
      setTimeout(() => {
        registerModal.style.display = 'none';
        loginModal.style.display = 'flex';
        setTimeout(() => loginModal.classList.add('visible'), 10);
      }, 150);
    });

    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('visible');
          setTimeout(() => modal.style.display = 'none', 300);
        }
      });
    });
  }

  _setupForms() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.email.value.trim();
      const password = loginForm.password.value;

      if (!email || !password) {
        this._showMessage('login-message', 'Please fill in all fields.', 'error');
        return;
      }

      try {
        await this.presenter.login(email, password);
      } catch (error) {
        // Error is already handled by renderError
      }
    });

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = registerForm.name.value.trim();
      const email = registerForm.email.value.trim();
      const password = registerForm.password.value;

      if (!name || !email || !password) {
        this._showMessage('register-message', 'Please fill in all fields.', 'error');
        return;
      }

      if (password.length < 8) {
        this._showMessage('register-message', 'Password must be at least 8 characters long.', 'error');
        return;
      }

      try {
        await this.model.register(name, email, password);
        this._showMessage('register-message', 'Account created successfully! You can now sign in.', 'success');
        
        // Switch to login modal after successful registration
        setTimeout(() => {
          document.getElementById('register-modal').style.display = 'none';
          document.getElementById('login-modal').style.display = 'flex';
        }, 300);
      } catch (error) {
        this._showMessage('register-message', error.message, 'error');
      }
    });
  }

  _setLoading(form, isLoading) {
    const button = form.querySelector('button[type="submit"]');
    if (isLoading) {
      button.disabled = true;
      button.textContent = 'Please wait...';
    } else {
      button.disabled = false;
      button.textContent = form.id === 'login-form' ? 'SIGN IN' : 'CREATE ACCOUNT';
    }
  }

  showLoading() {
    const form = document.getElementById('login-form');
    if (form) {
      this._setLoading(form, true);
    }
  }

  hideLoading() {
    const form = document.getElementById('login-form');
    if (form) {
      this._setLoading(form, false);
    }
  }

  renderError(message) {
    this._showMessage('login-message', message, 'error');
  }

  renderLoginSuccess(loginResult) {
    this._showMessage('login-message', 'Login successful! Redirecting...', 'success');
    
    // Store auth data
    localStorage.setItem('token', loginResult.token);
    localStorage.setItem('userId', loginResult.userId);
    if (loginResult.name) {
      localStorage.setItem('userName', loginResult.name);
    }
    
    // Redirect after a short delay
    setTimeout(() => {
      window.location.hash = '#/';
    }, 150);
  }

  _showMessage(elementId, message, type) {
    const messageEl = document.getElementById(elementId);
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.className = type ? `message ${type}` : 'message';
      messageEl.classList.add('visible');
    }
  }
} 