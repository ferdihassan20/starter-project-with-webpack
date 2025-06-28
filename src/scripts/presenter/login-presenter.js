export class LoginPresenter {
  constructor(model, view) {
    this.model = model;
    this.view = view;
  }

  async login(email, password) {
    try {
      this.view.showLoading();
      const loginResult = await this.model.login(email, password);
      this.view.renderLoginSuccess(loginResult);
      return loginResult;
    } catch (error) {
      this.view.renderError(error.message);
      throw error;
    } finally {
      this.view.hideLoading();
    }
  }

  checkLoginStatus() {
    const token = localStorage.getItem('token');
    if (token) {
      return true;
    }
    return false;
  }
} 