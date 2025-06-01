import checkAuth from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';

class App {
  #content = null;
  #header = null;

  constructor({ content }) {
    this.#content = content;
    this.#header = document.getElementById('app-header');
  }

  async renderNav() {
    const token = localStorage.getItem('token');
    const currentRoute = getActiveRoute();

    // Don't show navigation on landing page
    if (currentRoute === '/landing') {
      return '';
    }

    return `
      <nav class="navbar" role="navigation" aria-label="Main navigation">
        <div class="nav-left">
          <a href="#" class="navbar-brand" aria-label="Story Share Home">
            <i class="fas fa-book-open"></i> Story Share
          </a>
        </div>
        <div class="nav-right">
          ${token ? 
            `<a href="#" class="nav-link" id="logout-link">
              <i class="fas fa-sign-out-alt"></i> Logout
            </a>` : 
            `<a href="#/landing" class="nav-link">
              <i class="fas fa-sign-in-alt"></i> Login / Register
            </a>`
          }
        </div>
      </nav>
    `;
  }

  async renderPage() {
    const url = getActiveRoute();
    const PageClass = checkAuth(url);

    if (!PageClass) {
      // If checkAuth returns null, it means a redirect is happening
      return;
    }

    try {
      const page = new PageClass();
      
      // Update navigation in header
      if (this.#header) {
        this.#header.innerHTML = await this.renderNav();
        this._setupNavListeners();
      }

      if (document.startViewTransition) {
        // Using View Transition API
        const transition = document.startViewTransition(async () => {
          const content = await page.render();
          this.#content.innerHTML = content;
          await page.afterRender();
        });

        // Add custom animation styles
        transition.ready.then(() => {
          document.documentElement.classList.add('view-transition-active');
        });

        await transition.finished;
        document.documentElement.classList.remove('view-transition-active');
      } else {
        // Fallback for browsers that don't support View Transition API
        this.#content.style.opacity = '0';
        this.#content.innerHTML = await page.render();
        await page.afterRender();
        
        // Simple fade-in animation as fallback
        requestAnimationFrame(() => {
          this.#content.style.transition = 'opacity 0.3s ease-in-out';
          this.#content.style.opacity = '1';
        });
      }
    } catch (error) {
      console.error('Error rendering page:', error);
      this.#content.innerHTML = '<div class="error-page"><h2>Error</h2><p>Failed to load the page. Please try again.</p></div>';
    }
  }

  _setupNavListeners() {
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        window.location.hash = '#/landing';
      });
    }
  }
}

export default App;
