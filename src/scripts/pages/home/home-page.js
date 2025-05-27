import { StoryModel } from '../../data/story-model.js';
import { StoryPresenter } from '../../presenter/story-presenter.js';
import '../../../styles/home.css';

export default class HomePage {
  constructor() {
    this.model = new StoryModel();
    this.presenter = new StoryPresenter(this.model, this);
    this.token = localStorage.getItem("token") || null;
    this.storiesPerPage = 20;
    this.stream = null;
    this.map = null;
    this.markers = [];
    
    // Add Font Awesome
    if (!document.getElementById('font-awesome')) {
      const link = document.createElement('link');
      link.id = 'font-awesome';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
      document.head.appendChild(link);
    }
  }

  async render() {
    return `
      <nav class="navbar" role="navigation" aria-label="Main navigation">
        <div class="nav-left">
          <a href="#" class="navbar-brand" aria-label="Story Share Home">
            <i class="fas fa-book-open"></i> Story Share
          </a>
          ${this.token ? `<a href="#" class="nav-link active" aria-current="page">
            <i class="fas fa-home"></i> Home
          </a>` : ''}
        </div>
        <div class="nav-right">
          ${this.token ? 
            `<a href="#" class="nav-link" id="logout-link">
              <i class="fas fa-sign-out-alt"></i> Logout
            </a>` : 
            `<a href="#/login" class="nav-link">
              <i class="fas fa-sign-in-alt"></i> Login
            </a>`
          }
        </div>
      </nav>

      <main class="home-container" id="main-content">
        <div class="app-intro" role="banner">
          <h1><i class="fas fa-code"></i> Welcome to Story Share</h1>
          <p><i class="fas fa-users"></i> A platform where developers share their coding journey stories, experiences, and moments of growth. Join our community to share your story or explore others' journeys.</p>
          ${!this.token ? `
            <div class="cta-section">
              <p><i class="fas fa-user-plus"></i> Want to share your story? <a href="#/login" class="cta-link">Login</a> to join the community!</p>
            </div>
          ` : ''}
        </div>

        <section class="map-section" aria-labelledby="map-heading">
          <h2 id="map-heading"><i class="fas fa-map-marked-alt"></i> Story Locations</h2>
          <p><i class="fas fa-globe"></i> Explore coding stories from developers around the world. Each marker represents a unique story from our global community.</p>
          <div id="map" role="region" aria-label="Interactive map showing story locations"></div>
        </section>

        ${this.token ? `
        <section class="add-story-section" aria-labelledby="share-heading">
          <h2 id="share-heading"><i class="fas fa-plus-circle"></i> Share Your Story</h2>
          <p><i class="fas fa-lightbulb"></i> Inspire others by sharing your coding experience. Add a photo and tell us about your journey, challenges, or achievements.</p>
          <button class="add-story-toggle" id="add-story-toggle" aria-expanded="false" aria-controls="add-story-form">
            <i class="fas fa-share"></i> Share Your Story
          </button>
          <form id="add-story-form" class="add-story-form" aria-labelledby="share-heading">
            <div class="form-group">
              <label for="description"><i class="fas fa-pen"></i> Tell us about your coding journey</label>
              <textarea 
                id="description" 
                name="description" 
                required 
                aria-required="true"
                aria-describedby="description-help"
                placeholder="Share your experience, what you learned, or any coding story..."
                rows="4"
              ></textarea>
              <small id="description-help" class="form-help">Share your coding experience, challenges overcome, or lessons learned</small>
            </div>

            <div class="form-group">
              <label for="photo"><i class="fas fa-camera"></i> Add a Photo</label>
              <input 
                type="file" 
                id="photo" 
                name="photo" 
                accept="image/*" 
                capture="environment" 
                required 
                aria-required="true"
                aria-describedby="photo-help"
              />
              <small id="photo-help" class="form-help">Maximum file size: 1MB</small>
            </div>

            <div class="camera-section" aria-labelledby="camera-heading">
              <h3 id="camera-heading"><i class="fas fa-video"></i> Or Use Camera</h3>
              <div id="camera-container" aria-live="polite"></div>
              <div class="camera-controls">
                <button type="button" id="start-camera" class="secondary-button">
                  <i class="fas fa-play"></i> Start Camera
                </button>
                <button type="button" id="capture-photo" class="secondary-button" disabled>
                  <i class="fas fa-camera"></i> Capture Photo
                </button>
              </div>
              <canvas id="canvas" style="display:none;" aria-hidden="true"></canvas>
            </div>

            <button type="submit" class="submit-button">
              <span class="button-text"><i class="fas fa-paper-plane"></i> Share Story</span>
              <span class="button-loader" style="display: none;">Sharing...</span>
            </button>
          </form>
          <div id="message" role="alert" aria-live="assertive"></div>
        </section>
        ` : ''}

        <section class="stories-section" aria-labelledby="stories-heading">
          <h2 id="stories-heading"><i class="fas fa-stories"></i> Community Stories</h2>
          <p><i class="fas fa-book-reader"></i> Discover inspiring coding journeys shared by our community members. Each story represents a unique perspective and learning experience.</p>
          <div id="loading" role="status" aria-live="polite"></div>
          <div id="story-list" class="stories-grid" role="list"></div>
        </section>
      </main>
    `;
  }

  async afterRender() {
    this._setupNavbar();
    await this.loadStories();
    if (this.token) {
      this._setupAddStoryForm();
    }
  }

  async loadStories() {
    try {
      this.showLoading();
      const stories = await this.model.getStories(this.token, 1, this.storiesPerPage, 1);
      
      // Clear existing content
      const storyList = document.getElementById('story-list');
      if (storyList) {
        storyList.innerHTML = '';
      }
      
      this.renderStories(stories);
    } catch (error) {
      this.renderError(error.message);
    } finally {
      this.hideLoading();
    }
  }

  _setupAddStoryForm() {
    const toggle = document.getElementById('add-story-toggle');
    const form = document.getElementById('add-story-form');
    
    toggle.addEventListener('click', () => {
      form.classList.toggle('visible');
      toggle.textContent = form.classList.contains('visible') ? 'Hide Form' : 'Share Your Story';
    });

    this._setupCamera();
    this._setupFormSubmission();
  }

  _setupFormSubmission() {
    const form = document.getElementById('add-story-form');
    const message = document.getElementById('message');
    const button = form.querySelector('button[type="submit"]');
    const buttonText = button.querySelector('.button-text');
    const buttonLoader = button.querySelector('.button-loader');
    const descriptionInput = form.querySelector('#description');
    const photoInput = form.querySelector('#photo');

    // Add input validation listeners
    descriptionInput.addEventListener('input', () => {
      if (descriptionInput.value.trim().length === 0) {
        descriptionInput.classList.add('invalid');
        descriptionInput.setAttribute('aria-invalid', 'true');
        document.getElementById('description-help').textContent = 'Please tell us about your coding journey';
        document.getElementById('description-help').classList.add('error-message');
      } else {
        descriptionInput.classList.remove('invalid');
        descriptionInput.setAttribute('aria-invalid', 'false');
        document.getElementById('description-help').textContent = 'Share your coding experience, challenges overcome, or lessons learned';
        document.getElementById('description-help').classList.remove('error-message');
      }
    });

    photoInput.addEventListener('change', () => {
      const file = photoInput.files[0];
      if (!file) {
        photoInput.classList.add('invalid');
        photoInput.setAttribute('aria-invalid', 'true');
        document.getElementById('photo-help').textContent = 'Please select a photo';
        document.getElementById('photo-help').classList.add('error-message');
      } else if (file.size > 1024 * 1024) {
        photoInput.classList.add('invalid');
        photoInput.setAttribute('aria-invalid', 'true');
        document.getElementById('photo-help').textContent = 'Photo size must be less than 1MB';
        document.getElementById('photo-help').classList.add('error-message');
      } else if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        photoInput.classList.add('invalid');
        photoInput.setAttribute('aria-invalid', 'true');
        document.getElementById('photo-help').textContent = 'Please upload a valid image file (JPEG, PNG, or WebP)';
        document.getElementById('photo-help').classList.add('error-message');
      } else {
        photoInput.classList.remove('invalid');
        photoInput.setAttribute('aria-invalid', 'false');
        document.getElementById('photo-help').textContent = 'Maximum file size: 1MB';
        document.getElementById('photo-help').classList.remove('error-message');
      }
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const description = descriptionInput.value.trim();
      const photoFile = photoInput.files[0];

      // Validate description
      if (!description) {
        descriptionInput.classList.add('invalid');
        descriptionInput.setAttribute('aria-invalid', 'true');
        document.getElementById('description-help').textContent = 'Please tell us about your coding journey';
        document.getElementById('description-help').classList.add('error-message');
        descriptionInput.focus();
        return;
      }

      // Validate photo
      if (!photoFile) {
        photoInput.classList.add('invalid');
        photoInput.setAttribute('aria-invalid', 'true');
        document.getElementById('photo-help').textContent = 'Please select a photo';
        document.getElementById('photo-help').classList.add('error-message');
        photoInput.focus();
        return;
      }

      if (photoFile.size > 1024 * 1024) {
        photoInput.classList.add('invalid');
        photoInput.setAttribute('aria-invalid', 'true');
        document.getElementById('photo-help').textContent = 'Photo size must be less than 1MB';
        document.getElementById('photo-help').classList.add('error-message');
        photoInput.focus();
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(photoFile.type)) {
        photoInput.classList.add('invalid');
        photoInput.setAttribute('aria-invalid', 'true');
        document.getElementById('photo-help').textContent = 'Please upload a valid image file (JPEG, PNG, or WebP)';
        document.getElementById('photo-help').classList.add('error-message');
        photoInput.focus();
        return;
      }

      try {
        this._setLoading(true, button, buttonText, buttonLoader);
        this._showMessage('', '');

        // Get user's location if available
        let lat = null;
        let lon = null;
        
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          lat = position.coords.latitude;
          lon = position.coords.longitude;
        } catch (error) {
          console.log('Location not available:', error);
        }

        // Add the new story with location if available
        const result = await this.model.addStory(this.token, description, photoFile, lat, lon);
        
        if (result.error) {
          throw new Error(result.message);
        }

        // Show success message
        this._showMessage('Story shared successfully!', 'success');
        
        // Reset form and validation states
        form.reset();
        descriptionInput.classList.remove('invalid');
        photoInput.classList.remove('invalid');
        document.getElementById('description-help').textContent = 'Share your coding experience, challenges overcome, or lessons learned';
        document.getElementById('photo-help').textContent = 'Maximum file size: 1MB';
        document.getElementById('description-help').classList.remove('error-message');
        document.getElementById('photo-help').classList.remove('error-message');
        
        // Hide form
        form.classList.remove('visible');
        document.getElementById('add-story-toggle').textContent = 'Share Your Story';

        // Stop camera if running
        this._stopCamera();

        // Immediately fetch and display the updated stories
        const stories = await this.model.getStories(this.token, 1, this.storiesPerPage, 1);
        this.renderStories(stories);

      } catch (error) {
        this._showMessage('Failed to share story: ' + error.message, 'error');
      } finally {
        this._setLoading(false, button, buttonText, buttonLoader);
      }
    });
  }

  _setupCamera() {
    const startCameraBtn = document.getElementById('start-camera');
    const capturePhotoBtn = document.getElementById('capture-photo');
    const cameraContainer = document.getElementById('camera-container');
    const canvas = document.getElementById('canvas');
    const photoInput = document.getElementById('photo');

    this._stopCamera();

    startCameraBtn.addEventListener('click', async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          this.stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } 
          });
          
          cameraContainer.innerHTML = '';
          const video = document.createElement('video');
          video.srcObject = this.stream;
          video.autoplay = true;
          video.playsInline = true;
          video.style.width = '100%';
          video.style.borderRadius = '8px';
          
          await new Promise((resolve) => {
            video.onloadedmetadata = resolve;
          });
          
          cameraContainer.appendChild(video);
          capturePhotoBtn.disabled = false;
          startCameraBtn.textContent = 'Stop Camera';
        } catch (error) {
          console.error('Camera access error:', error);
          cameraContainer.innerHTML = '<p class="error">Cannot access camera: ' + error.message + '</p>';
        }
      } else {
        cameraContainer.innerHTML = '<p class="error">Camera API not supported in this browser.</p>';
      }
    });

    capturePhotoBtn.addEventListener('click', () => {
      const video = cameraContainer.querySelector('video');
      if (!video) return;

      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (!blob) {
            throw new Error('Failed to capture photo');
          }

          if (blob.size > 1024 * 1024) {
            throw new Error('Captured photo is too large (max 1MB)');
          }

          const file = new File([blob], 'captured-photo.png', { type: 'image/png' });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          photoInput.files = dataTransfer.files;
          
          const successMsg = document.createElement('p');
          successMsg.textContent = 'Photo captured successfully!';
          successMsg.className = 'success-message';
          cameraContainer.appendChild(successMsg);

          this._stopCamera();
        }, 'image/png', 0.8);
      } catch (error) {
        console.error('Photo capture error:', error);
        cameraContainer.innerHTML += '<p class="error">Failed to capture photo: ' + error.message + '</p>';
      }
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

  renderStories(stories) {
    const storyList = document.getElementById('story-list');
    
    // Clear existing stories
    storyList.innerHTML = '';

    // Add new stories
    stories.forEach((story) => {
      const item = document.createElement('article');
      item.setAttribute('role', 'listitem');
      item.setAttribute('tabindex', '0');
      item.className = 'story-item';
      item.innerHTML = `
        <img src="${story.photoUrl}" alt="Photo from ${story.name}'s coding journey" loading="lazy" />
        <div class="story-content">
          <h2>${story.name}</h2>
          <p>${story.description}</p>
          <div class="story-meta">
            Posted on ${new Date(story.createdAt).toLocaleDateString()}
          </div>
        </div>
      `;
      storyList.appendChild(item);
    });

    // Update the map with new stories
    this._renderMap(stories);
  }

  renderError(message) {
    const loading = document.getElementById('loading');
    if (loading) loading.textContent = '';
    const storyList = document.getElementById('story-list');
    if (storyList) storyList.innerHTML = `<p class="error">${message}</p>`;
  }

  _renderMap(stories) {
    if (!window.L) {
      console.error('Leaflet library is not loaded.');
      return;
    }

    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // Clean up existing map instance if it exists
    if (this.map) {
      this.markers.forEach(marker => marker.remove());
      this.markers = [];
      this.map.remove();
    }
    
    mapContainer.innerHTML = '';

    // Initialize map
    this.map = L.map('map').setView([0, 0], 2);

    // Base layers
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    });

    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    });

    // Add default layer
    osm.addTo(this.map);

    // Base layers for layer control
    const baseLayers = {
      "OpenStreetMap": osm,
      "Satellite": satellite,
      "Dark Mode": dark
    };

    // Add layer control
    L.control.layers(baseLayers).addTo(this.map);

    // Add markers
    this.markers = [];
    stories.forEach((story) => {
      if (story.lat && story.lon) {
        const marker = L.marker([story.lat, story.lon]).addTo(this.map);
        marker.bindPopup(`
          <div class="map-popup">
            <strong>${story.name}</strong><br />
            ${story.description}<br />
            <img src="${story.photoUrl}" alt="Photo of story by ${story.name}" style="width: 100%; max-width: 200px; border-radius: 8px; margin-top: 8px;" />
          </div>
        `);
        this.markers.push(marker);
      }
    });

    if (this.markers.length > 0) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  _setLoading(isLoading, button, buttonText, buttonLoader) {
    button.disabled = isLoading;
    buttonText.style.display = isLoading ? 'none' : 'inline';
    buttonLoader.style.display = isLoading ? 'inline' : 'none';
  }

  _showMessage(message, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = message;
    messageEl.className = type ? `message ${type}` : '';
  }

  showLoading() {
    const loading = document.getElementById('loading');
    loading.textContent = 'Loading stories...';
  }

  hideLoading() {
    const loading = document.getElementById('loading');
    loading.textContent = '';
  }

  _setupNavbar() {
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        window.location.reload();
      });
    }
  }
}
