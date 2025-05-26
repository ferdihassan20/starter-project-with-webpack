import { StoryModel } from '../../data/story-model.js';

export default class RegisterPage {
  constructor() {
    this.model = new StoryModel();
  }

  async render() {
    return `
      <section class="auth-container" tabindex="0" aria-label="Registration form section">
        <div class="auth-card">
          <h1>Join Dicoding Story</h1>
          <p class="auth-subtitle">Create your account and start sharing your coding journey</p>
          
          <form id="register-form" aria-label="Registration form">
            <div class="form-group">
              <label for="name">Full Name</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                required 
                aria-required="true"
                placeholder="Enter your full name"
                autocomplete="name"
              />
            </div>

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
                placeholder="At least 8 characters"
                autocomplete="new-password"
                minlength="8"
              />
              <small class="form-help">Password must be at least 8 characters long</small>
            </div>

            <button type="submit" class="auth-button">
              <span class="button-text">Create Account</span>
              <span class="button-loader" style="display: none;">Creating account...</span>
            </button>
          </form>

          <div id="message" role="alert" aria-live="assertive"></div>

          <div class="auth-links">
            <p>Already have an account? <a href="#/login">Sign in here</a></p>
            <p>Or <a href="#/guest-stories">browse stories as guest</a></p>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Check if user is already logged in
    const token = this._getStoredToken();
    if (token) {
      window.location.hash = '#/';
      return;
    }

    this._setupForm();
  }

  _setupForm() {
    const form = document.getElementById('register-form');
    const message = document.getElementById('message');
    const button = form.querySelector('button[type="submit"]');
    const buttonText = button.querySelector('.button-text');
    const buttonLoader = button.querySelector('.button-loader');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const password = form.password.value;

      if (!name || !email || !password) {
        this._showMessage('Please fill in all fields.', 'error');
        return;
      }

      if (password.length < 8) {
        this._showMessage('Password must be at least 8 characters long.', 'error');
        return;
      }

      try {
        this._setLoading(true, button, buttonText, buttonLoader);
        this._showMessage('', '');

        await this.model.register(name, email, password);
        
        this._showMessage('Account created successfully! You can now sign in.', 'success');
        
        // Redirect to login page
        setTimeout(() => {
          window.location.hash = '#/login';
        }, 2000);

      } catch (error) {
        this._showMessage('Registration failed: ' + error.message, 'error');
      } finally {
        this._setLoading(false, button, buttonText, buttonLoader);
      }
    });
  }

  _setLoading(isLoading, button, buttonText, buttonLoader) {
    button.disabled = isLoading;
    buttonText.style.display = isLoading ? 'none' : 'inline';
    buttonLoader.style.display = isLoading ? 'inline' : 'none';
  }

  _showMessage(message, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = message;
    messageEl.className = type ? 'message ' + type : '';
  }

  _getStoredToken() {
    return localStorage.getItem('token');
  }
}
