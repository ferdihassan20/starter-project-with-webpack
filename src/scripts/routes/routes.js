import HomePage from '../pages/home/home-page';
import LandingPage from '../pages/landing/landing-page';
import BookmarkPage from '../pages/bookmark/bookmark-page';

const routes = {
  '/': HomePage,
  '/landing': LandingPage,
  '/bookmark': BookmarkPage,
};

function checkAuth(path) {
  const token = localStorage.getItem('token');
  
  // If user is logged in and tries to access landing, redirect to home
  if (token && path === '/landing') {
    window.location.hash = '#/';
    return null;
  }
  
  // If user is not logged in and tries to access protected pages, redirect to landing
  if (!token && path !== '/landing') {
    window.location.hash = '#/landing';
    return null;
  }
  
  // Return the page class for instantiation
  return routes[path] || routes['/landing']; // Default to landing for unknown routes
}

export default checkAuth;
