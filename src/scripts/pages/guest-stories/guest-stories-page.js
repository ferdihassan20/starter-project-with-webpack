import { StoryModel } from '../../data/story-model.js';

export default class GuestStoriesPage {
  constructor() {
    this.model = new StoryModel();
    this.latitude = null;
    this.longitude = null;
    this.stream = null;
    this.map = null;
    this.marker = null;
  }

  async render() {
    return `
      <section class="container" tabindex="0" aria-label="Guest stories section">
        <div class="guest-header">
          <h1>Share Your Story</h1>
          <p class="guest-subtitle">
            Share your coding journey with the community without creating an account. 
            <a href="#/register">Create an account</a> for full features.
          </p>
        </div>

        <div class="guest-content">
          <div class="add-story-section">
            <h2>Add Your Story</h2>
            <form id="guest-story-form" aria-label="Guest story form">
              <div class="form-group">
                <label for="description">Tell us about your coding journey</label>
                <textarea 
                  id="description" 
                  name="description" 
                  required 
                  aria-required="true"
                  placeholder="Share your experience, what you learned, or any coding story..."
                  rows="4"
                ></textarea>
              </div>

              <div class="form-group">
                <label for="photo">Add a Photo</label>
                <input type="file" id="photo" name="photo" accept="image/*" capture="environment" required aria-required="true" />
                <small class="form-help">Maximum file size: 1MB</small>
              </div>

              <div class="camera-section">
                <h3>Or Use Camera</h3>
                <div id="camera-container" aria-label="Camera preview"></div>
                <div class="camera-controls">
                  <button type="button" id="start-camera" class="secondary-button">
                    Start Camera
                  </button>
                  <button type="button" id="capture-photo" class="secondary-button" disabled>
                    Capture Photo
                  </button>
                </div>
                <canvas id="canvas" style="display:none;"></canvas>
              </div>

              <div class="form-group">
                <label for="map">Choose Location (Optional)</label>
                <div id="map" style="height: 300px;" aria-label="Map to select location"></div>
                <small class="form-help">Click on the map to set your location</small>
              </div>

              <button type="submit" class="submit-button">
                <span class="button-text">Share Story</span>
                <span class="button-loader" style="display: none;">Sharing...</span>
              </button>
            </form>

            <div id="message" role="alert" aria-live="assertive"></div>
          </div>

          <div class="recent-stories-section">
            <h2>Recent Stories</h2>
            <div id="loading" aria-live="polite"></div>
            <div id="story-list" role="list"></div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this._initMap();
    this._setupCamera();
    this._setupForm();
    await this._loadRecentStories();
  }

  _initMap() {
    if (!window.L) {
      console.error('Leaflet library is not loaded.');
      return;
    }

    this.map = L.map('map').setView([0, 0], 2);

    // Base layers
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri'
    });

    // Add default layer
    osmLayer.addTo(this.map);

    // Layer control
    const baseLayers = {
      "Street Map": osmLayer,
      "Satellite": satelliteLayer
    };

    L.control.layers(baseLayers).addTo(this.map);

    this.marker = null;

    this.map.on('click', (e) => {
      this.latitude = e.latlng.lat;
      this.longitude = e.latlng.lng;

      if (this.marker) {
        this.marker.setLatLng(e.latlng);
      } else {
        this.marker = L.marker(e.latlng).addTo(this.map);
      }
      
      this.marker.bindPopup('Location selected: ' + this.latitude.toFixed(6) + ', ' + this.longitude.toFixed(6)).openPopup();
    });
  }

  _setupCamera() {
    const startCameraBtn = document.getElementById('start-camera');
    const capturePhotoBtn = document.getElementById('capture-photo');
    const cameraContainer = document.getElementById('camera-container');
    const canvas = document.getElementById('canvas');
    const photoInput = document.getElementById('photo');

    startCameraBtn.addEventListener('click', async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          this.stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          cameraContainer.innerHTML = '';
          const video = document.createElement('video');
          video.srcObject = this.stream;
          video.autoplay = true;
          video.playsInline = true;
          video.style.width = '100%';
          video.style.borderRadius = '8px';
          cameraContainer.appendChild(video);
          capturePhotoBtn.disabled = false;
          startCameraBtn.textContent = 'Stop Camera';
        } catch (error) {
          cameraContainer.innerHTML = '<p class="error">Cannot access camera: ' + error.message + '</p>';
        }
      } else {
        cameraContainer.innerHTML = '<p class="error">Camera API not supported.</p>';
      }
    });

    capturePhotoBtn.addEventListener('click', () => {
      const video = cameraContainer.querySelector('video');
      if (!video) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        const file = new File([blob], 'captured-photo.png', { type: 'image/png' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        photoInput.files = dataTransfer.files;
        
        // Show success message
        const successMsg = document.createElement('p');
        successMsg.textContent = 'Photo captured successfully!';
        successMsg.className = 'success-message';
        cameraContainer.appendChild(successMsg);
      }, 'image/png');

      // Stop camera stream
      this._stopCamera();
    });
  }

  _stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    document.getElementById('camera-container').innerHTML = '';
    document.getElementById('capture-photo').disabled = true;
    document.getElementById('start-camera').textContent = 'Start Camera';
  }

  _setupForm() {
    const form = document.getElementById('guest-story-form');
    const message = document.getElementById('message');
    const button = form.querySelector('button[type="submit"]');
    const buttonText = button.querySelector('.button-text');
    const buttonLoader = button.querySelector('.button-loader');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const description = form.description.value.trim();
      const photoFile = form.photo.files[0];

      if (!description || !photoFile) {
        this._showMessage('Please provide both description and photo.', 'error');
        return;
      }

      if (photoFile.size > 1024 * 1024) {
        this._showMessage('Photo size must be less than 1MB.', 'error');
        return;
      }

      try {
        this._setLoading(true, button, buttonText, buttonLoader);
        this._showMessage('', '');

        await this.model.addStoryGuest(description, photoFile, this.latitude, this.longitude);
        
        this._showMessage('Story shared successfully! Thank you for contributing.', 'success');
        form.reset();
        
        // Reset map marker
        if (this.marker) {
          this.map.removeLayer(this.marker);
          this.marker = null;
        }
        this.latitude = null;
        this.longitude = null;

        // Stop camera if running
        this._stopCamera();

        // Reload recent stories
        await this._loadRecentStories();

      } catch (error) {
        this._showMessage('Failed to share story: ' + error.message, 'error');
      } finally {
        this._setLoading(false, button, buttonText, buttonLoader);
      }
    });
  }

  async _loadRecentStories() {
    const storyList = document.getElementById('story-list');
    try {
      this._showLoading();
      const token = localStorage.getItem('token');
      if (!token) {
        storyList.innerHTML = `
          <div class="guest-info">
            <p>Stories from our community members are displayed here.</p>
            <p>Sign in or create an account to view all stories and interact with the community.</p>
            <div class="feature-list">
              <h3>With an account, you can:</h3>
              <ul>
                <li>View all community stories</li>
                <li>See stories on an interactive map</li>
                <li>Build your profile</li>
                <li>Engage with other members</li>
              </ul>
            </div>
          </div>
        `;
      } else {
        const stories = await this.model.getStories(token, 1, 10, 0);
        if (stories.length === 0) {
          storyList.innerHTML = '<p>No stories available.</p>';
        } else {
          storyList.innerHTML = this._renderStories(stories);
        }
      }
    } catch (error) {
      this._showError('Failed to load stories: ' + error.message);
    } finally {
      this._hideLoading();
    }
  }

  _renderStories(stories) {
    return stories.map(story => `
      <article class="story-item" role="listitem" tabindex="0" aria-label="Story by ${story.name}">
        <h3>${story.name}</h3>
        <p>${story.description}</p>
        ${story.photoUrl ? `<img src="${story.photoUrl}" alt="Photo for story by ${story.name}" />` : ''}
        ${story.lat && story.lon ? `<p>Location: ${story.lat.toFixed(6)}, ${story.lon.toFixed(6)}</p>` : ''}
      </article>
    `).join('');
  }

  _setLoading(isLoading, button, buttonText, buttonLoader) {
    button.disabled = isLoading;
    buttonText.style.display = isLoading ? 'none' : 'inline';
    buttonLoader.style.display = isLoading ? 'inline' : 'none';
  }

  _showLoading() {
    const loading = document.getElementById('loading');
    loading.textContent = 'Loading...';
  }

  _hideLoading() {
    const loading = document.getElementById('loading');
    loading.textContent = '';
  }

  _showMessage(message, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = message;
    messageEl.className = type ? `message ${type}` : '';
  }

  _showError(message) {
    const storyList = document.getElementById('story-list');
    storyList.innerHTML = `<p class="error">${message}</p>`;
  }
}
