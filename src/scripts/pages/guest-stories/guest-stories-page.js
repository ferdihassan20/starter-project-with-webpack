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
    const mapElement = document.getElementById('map');
    if (!mapElement) {
      console.error('Map element not found.');
      return;
    }

    if (!window.L) {
      console.error('Leaflet library is not loaded.');
      mapElement.innerHTML = '<div class="error">Map service is currently unavailable.</div>';
      return;
    }

    // Destroy existing map instance if any to avoid errors on re-initialization
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const initialize = () => {
      try {
        this.map = L.map('map').setView([0, 0], 2);

        // Base layers with error handling
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          errorTileUrl: 'path/to/error-tile.png',
          maxZoom: 19
        });

        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri',
          errorTileUrl: 'path/to/error-tile.png',
          maxZoom: 19
        });

        const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenTopoMap contributors',
          errorTileUrl: 'path/to/error-tile.png',
          maxZoom: 17
        });

        const cycleLayer = L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
          attribution: '&copy; CyclOSM contributors',
          errorTileUrl: 'path/to/error-tile.png',
          maxZoom: 19
        });

        // Add default layer with error handling
        osmLayer.on('tileerror', (error) => {
          console.error('Failed to load map tile:', error);
          mapElement.querySelector('.leaflet-control-layers').classList.add('highlight-error');
        });

        osmLayer.addTo(this.map);

        // Layer control with grouped overlays
        const baseLayers = {
          "Street Map": osmLayer,
          "Satellite": satelliteLayer,
          "Topographic": topoLayer,
          "Cycle Map": cycleLayer
        };

        const overlays = {
          "Points of Interest": L.layerGroup([]),
          "Story Locations": L.layerGroup([])
        };

        L.control.layers(baseLayers, overlays, {
          collapsed: false,
          position: 'topright'
        }).addTo(this.map);

        // Add scale control
        L.control.scale({
          imperial: false,
          position: 'bottomright'
        }).addTo(this.map);

        this.marker = null;

        this.map.on('click', (e) => {
          this.latitude = e.latlng.lat;
          this.longitude = e.latlng.lng;

          if (this.marker) {
            this.marker.setLatLng(e.latlng);
          } else {
            this.marker = L.marker(e.latlng, {
              draggable: true,
              title: 'Drag to adjust location'
            }).addTo(this.map);

            // Update coordinates when marker is dragged
            this.marker.on('dragend', (event) => {
              const position = event.target.getLatLng();
              this.latitude = position.lat;
              this.longitude = position.lng;
              this.marker.bindPopup(
                `Location selected: ${this.latitude.toFixed(6)}, ${this.longitude.toFixed(6)}`
              ).openPopup();
            });
          }
          
          this.marker.bindPopup(
            `Location selected: ${this.latitude.toFixed(6)}, ${this.longitude.toFixed(6)}`
          ).openPopup();
        });

        // Add geolocation control
        L.control.locate({
          position: 'topleft',
          strings: {
            title: 'Show my location'
          },
          locateOptions: {
            enableHighAccuracy: true
          }
        }).addTo(this.map);

        // Invalidate size after a short delay to fix rendering issues
        setTimeout(() => {
          this.map.invalidateSize();
        }, 200);

      } catch (error) {
        console.error('Error initializing map:', error);
        if (error && error.stack) {
          console.error(error.stack);
        }
        mapElement.innerHTML = '<div class="error">Failed to initialize map. Please try again later.</div>';
      }
    };

    // Use MutationObserver to detect visibility changes on map container and its parent
    const observeTargets = [mapElement, mapElement.parentElement].filter(Boolean);
    const observer = new MutationObserver((mutations, obs) => {
      const rect = mapElement.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        initialize();
        obs.disconnect();
      }
    });

    observeTargets.forEach(target => {
      observer.observe(target, { attributes: true, attributeFilter: ['style', 'class'] });
    });

    // Also try to initialize immediately in case visible
    const rect = mapElement.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      initialize();
      observer.disconnect();
    }
  }

  _setupCamera() {
    const startCameraBtn = document.getElementById('start-camera');
    const capturePhotoBtn = document.getElementById('capture-photo');
    const cameraContainer = document.getElementById('camera-container');
    const canvas = document.getElementById('canvas');
    const photoInput = document.getElementById('photo');

    // Clean up any existing stream on setup
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
          
          // Wait for video to be ready
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

          // Validate file size
          if (blob.size > 1024 * 1024) {
            throw new Error('Captured photo is too large (max 1MB)');
          }

          const file = new File([blob], 'captured-photo.png', { type: 'image/png' });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          photoInput.files = dataTransfer.files;
          
          // Show success message
          const successMsg = document.createElement('p');
          successMsg.textContent = 'Photo captured successfully!';
          successMsg.className = 'success-message';
          cameraContainer.appendChild(successMsg);

          // Stop camera stream
          this._stopCamera();
        }, 'image/png', 0.8); // Compress image to ensure smaller file size
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

      console.log('Submitting story with location:', this.latitude, this.longitude);

      // Validate inputs
      if (!description || !photoFile) {
        this._showMessage('Please provide both description and photo.', 'error');
        return;
      }

      // Validate file size and type
      if (photoFile.size > 1024 * 1024) {
        this._showMessage('Photo size must be less than 1MB.', 'error');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(photoFile.type)) {
        this._showMessage('Please upload a valid image file (JPEG, PNG, or WebP).', 'error');
        return;
      }

      try {
        this._setLoading(true, button, buttonText, buttonLoader);
        this._showMessage('', '');

        // Set timeout for the API call
        const timeoutDuration = 30000; // 30 seconds
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out')), timeoutDuration);
        });

        const uploadPromise = this.model.addStoryGuest(description, photoFile, this.latitude, this.longitude);
        await Promise.race([uploadPromise, timeoutPromise]);
        
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
        console.error('Form submission error:', error);
        this._showMessage(
          error.message === 'Request timed out' 
            ? 'Upload timed out. Please try again with a smaller photo.'
            : 'Failed to share story: ' + error.message,
          'error'
        );
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
