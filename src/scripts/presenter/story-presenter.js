export class StoryPresenter {
  constructor(model, view) {
    this.model = model;
    this.view = view;
  }

  async loadStories(token, page = 1, size = 10, location = 0) {
    try {
      this.view.showLoading();
      const stories = await this.model.getStories(token, page, size, location);
      this.view.renderStories(stories);
    } catch (error) {
      this.view.renderError(error.message);
    }
  }

  async addNewStory(token, description, photoFile, lat = null, lon = null) {
    try {
      this.view.showLoading();
      const result = await this.model.addStory(token, description, photoFile, lat, lon);
      this.view.renderAddStorySuccess(result.message);
    } catch (error) {
      this.view.renderError(error.message);
    }
  }
}
