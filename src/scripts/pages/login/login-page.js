import { StoryModel } from '../../data/story-model.js';
import { LoginPresenter } from '../../presenter/login-presenter.js';

export default class LoginPage {
  constructor() {
    this.model = new StoryModel();
    this.presenter = new LoginPresenter(this.model, this);
    this.button = null;
    this.buttonText = null;
    this.buttonLoader = null;
  }

  async render() {
    return `
      <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="login-title">
        <div class="modal-content">
          <button class="modal-close" aria-label="Close login form" id="close-login">
            <i class="fas fa-times"></i>
          </button>
          
          <div class="auth-container">
            <div class="auth-card">
              <h1 id="login-title">Login</h1>
              <p class="auth-subtitle">Welcome back!</p>
              
              <form id="login-form" aria-label="Login form">
                <div class="form-group">
                  <label for="email">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    required 
                    aria-required="true"
                    placeholder="Enter your email"
                    autocomplete="email"
                  />
                </div>

                <div class="form-group">
                  <label for="password">Password</label>
                  <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    required 
                    aria-required="true"
                    placeholder="Enter your password"
                    autocomplete="current-password"
                  />
                </div>

                <button type="submit" class="auth-button">
                  <span class="button-text">Sign In</span>
                  <span class="button-loader" style="display: none;">Signing in...</span>
                </button>
              </form>

              <div id="message" role="alert" aria-live="assertive"></div>

              <div class="auth-links">
                <p>Don't have an account? <a href="#/register">Create one here</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    // Check if user is already logged in
    if (this.presenter.checkLoginStatus()) {
      window.location.hash = '#/';
      return;
    }

    this._setupForm();
    this._setupCloseButton();
  }

  _setupForm() {
    const form = document.getElementById('login-form');
    this.button = form.querySelector('button[type="submit"]');
    this.buttonText = this.button.querySelector('.button-text');
    this.buttonLoader = this.button.querySelector('.button-loader');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = form.email.value.trim();
      const password = form.password.value;

      if (!email || !password) {
        this.renderError('Please fill in all fields.');
        return;
      }

      try {
        const loginResult = await this.presenter.login(email, password);
        await this.renderLoginSuccess(loginResult);
      } catch (error) {
        // Error already handled by presenter
      }
    });
  }

  _setupCloseButton() {
    const closeButton = document.getElementById('close-login');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        window.location.hash = '#/';
      });
    }
  }

  showLoading() {
    if (this.button && this.buttonText && this.buttonLoader) {
      this.button.disabled = true;
      this.buttonText.style.display = 'none';
      this.buttonLoader.style.display = 'inline';
    }
  }

  hideLoading() {
    if (this.button && this.buttonText && this.buttonLoader) {
      this.button.disabled = false;
      this.buttonText.style.display = 'inline';
      this.buttonLoader.style.display = 'none';
    }
  }

  async renderLoginSuccess(loginResult) {
    this._showMessage('Login successful! Redirecting...', 'success');
    
    // First store the auth data
    this._storeAuthData(loginResult);
    
    // Wait a moment to ensure localStorage is updated
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Then redirect to home page
    window.location.hash = '#/';
  }

  renderError(message) {
    this._showMessage('Login failed: ' + message, 'error');
  }

  _showMessage(message, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = message;
    messageEl.className = type ? 'message ' + type : '';
  }

  _storeAuthData(loginResult) {
    localStorage.setItem('token', loginResult.token);
    localStorage.setItem('userId', loginResult.userId);
    localStorage.setItem('userName', loginResult.name);
  }
}
