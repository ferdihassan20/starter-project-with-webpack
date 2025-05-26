import HomePage from '../pages/home/home-page';
import AboutPage from '../pages/about/about-page';
import AddStoryPage from '../pages/add-story/add-story-page';
import LoginPage from '../pages/login/login-page';
import RegisterPage from '../pages/register/register-page';
import GuestStoriesPage from '../pages/guest-stories/guest-stories-page';

const routes = {
  '/': new HomePage(),
  '/about': new AboutPage(),
  '/add-story': new AddStoryPage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),
  '/guest-stories': new GuestStoriesPage(),
};

export default routes;
