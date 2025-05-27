import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer();
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (!this.#navigationDrawer.contains(event.target) && !this.#drawerButton.contains(event.target)) {
        this.#navigationDrawer.classList.remove('open');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
        }
      });
    });
  }

  async renderPage() {
    const url = getActiveRoute();
    const page = routes[url];

    if (!page) {
      this.#content.innerHTML = '<div class="error-page"><h2>404 - Page Not Found</h2><p>The page you are looking for does not exist.</p></div>';
      return;
    }

    try {
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
}

export default App;
