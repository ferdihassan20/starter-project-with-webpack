import { StoryModel } from '../../data/story-model.js';

export default class LoginPage {
  constructor() {
    this.model = new StoryModel();
  }

  async render() {
    return `
      <section class="auth-container" tabindex="0" aria-label="Login form section">
        <div class="auth-card">
          <h1>Login to Dicoding Story</h1>
          <p class="auth-subtitle">Share your coding journey with the community</p>
          
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
    const form = document.getElementById('login-form');
    const message = document.getElementById('message');
    const button = form.querySelector('button[type="submit"]');
    const buttonText = button.querySelector('.button-text');
    const buttonLoader = button.querySelector('.button-loader');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = form.email.value.trim();
      const password = form.password.value;

      if (!email || !password) {
        this._showMessage('Please fill in all fields.', 'error');
        return;
      }

      try {
        this._setLoading(true, button, buttonText, buttonLoader);
        this._showMessage('', '');

        const loginResult = await this.model.login(email, password);
        
        // Store token and user info
        this._storeAuthData(loginResult);
        
        this._showMessage('Login successful! Redirecting...', 'success');
        
        // Redirect to home page
        setTimeout(() => {
          window.location.hash = '#/';
        }, 1000);

      } catch (error) {
        this._showMessage('Login failed: ' + error.message, 'error');
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

  _storeAuthData(loginResult) {
    localStorage.setItem('token', loginResult.token);
    localStorage.setItem('userId', loginResult.userId);
    localStorage.setItem('userName', loginResult.name);
  }

  _getStoredToken() {
    return localStorage.getItem('token');
  }
}
