import { StoryModel } from '../../data/story-model.js';
import { StoryPresenter } from '../../presenter/story-presenter.js';

export default class HomePage {
  constructor() {
    this.model = new StoryModel();
    this.presenter = new StoryPresenter(this.model, this);
    this.token = localStorage.getItem("token") || null;
  }

  async render() {
    return `
      <section class="container" tabindex="0" aria-label="Story list section">
        <h1>Stories</h1>
        <div id="loading" aria-live="polite"></div>
        <div id="story-list" role="list"></div>
        <div id="map" style="height: 400px; margin-top: 20px;" aria-label="Map showing story locations"></div>
      </section>
    `;
  }

  async afterRender() {
    if (!this.token) {
      const storyList = document.createElement('div');
      storyList.id = 'story-list';
      storyList.innerText = 'Please login to view stories.';
      document.querySelector('.container').appendChild(storyList);
      return;
    }
    await this.presenter.loadStories(this.token, 1, 20, 1);
  }

  showLoading() {
    let loading = document.getElementById('loading');
    if (!loading) {
      loading = document.createElement('div');
      loading.id = 'loading';
      loading.setAttribute('aria-live', 'polite');
      document.querySelector('.container').appendChild(loading);
    }
    loading.innerText = 'Loading stories...';
  }

  renderStories(stories) {
    let storyList = document.getElementById('story-list');
    if (!storyList) {
      storyList = document.createElement('div');
      storyList.id = 'story-list';
      storyList.setAttribute('role', 'list');
      document.querySelector('.container').appendChild(storyList);
    }
    storyList.innerHTML = '';

    stories.forEach((story) => {
      const item = document.createElement('article');
      item.setAttribute('role', 'listitem');
      item.setAttribute('tabindex', '0');
      item.className = 'story-item';
      item.innerHTML = `
        <img src="${story.photoUrl}" alt="Photo of story by ${story.name}" width="200" />
        <h2>${story.name}</h2>
        <p>${story.description}</p>
        <p>Created at: ${new Date(story.createdAt).toLocaleString()}</p>
      `;
      storyList.appendChild(item);
    });

    this._renderMap(stories);
  }

  renderError(message) {
    let loading = document.getElementById('loading');
    if (loading) loading.innerText = '';
    let storyList = document.getElementById('story-list');
    if (storyList) storyList.innerText = 'Error: ' + message;
  }

  _renderMap(stories) {
    if (!window.L) {
      console.error('Leaflet library is not loaded.');
      return;
    }

    let mapContainer = document.getElementById('map');
    if (!mapContainer) {
      mapContainer = document.createElement('div');
      mapContainer.id = 'map';
      mapContainer.style.height = '400px';
      mapContainer.style.marginTop = '20px';
      mapContainer.setAttribute('aria-label', 'Map showing story locations');
      document.querySelector('.container').appendChild(mapContainer);
    }
    mapContainer.innerHTML = '';

    const map = L.map('map').setView([0, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    stories.forEach((story) => {
      if (story.lat && story.lon) {
        const marker = L.marker([story.lat, story.lon]).addTo(map);
        marker.bindPopup(`
          <strong>${story.name}</strong><br />
          ${story.description}<br />
          <img src="${story.photoUrl}" alt="Photo of story by ${story.name}" width="100" />
        `);
      }
    });
  }
}
