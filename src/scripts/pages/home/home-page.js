import { StoryModel } from '../../data/story-model.js';
import { StoryPresenter } from '../../presenter/story-presenter.js';
import { addBookmark } from '../../utils/indexeddb.js';
import { subscribeUserToPush } from '../../utils/push-helper.js';
import '../../../styles/home.css';

export default class HomePage {
  constructor() {
    this.model = new StoryModel();
    this.presenter = new StoryPresenter(this.model, this);
    this.storiesPerPage = 20;
    this.stream = null;
    this.map = null;
    this.markers = [];
    this.token = this._getToken(); // Set token immediately in constructor
    
    // Add Font Awesome
    if (!document.getElementById('font-awesome')) {
      const link = document.createElement('link');
      link.id = 'font-awesome';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
      document.head.appendChild(link);
  }
}

  _getToken() {
    return localStorage.getItem('token');
  }

  async render() {
    // Check token status immediately
    if (!this.token) {
      window.location.hash = '#/landing';
      return '';
    }

    // Return full content since we know user is authenticated
    return `
      <header>
        <a href="#main-content" class="skip-to-content">Lompat ke konten utama</a>
      </header>

      <main id="main-content" tabindex="-1">
        <div class="home-container">
          <section class="app-intro" role="banner">
            <h1><i class="fas fa-code"></i> Welcome to Story Share</h1>
            <p><i class="fas fa-users"></i> A platform where developers share their coding journey stories, experiences, and moments of growth. Join our community to share your story or explore others' journeys.</p>
          </section>

          <section class="map-section" aria-labelledby="map-heading">
            <h2 id="map-heading"><i class="fas fa-map-marked-alt"></i> Story Locations</h2>
            <p><i class="fas fa-globe"></i> Explore coding stories from developers around the world. Each marker represents a unique story from our global community.</p>
            <div id="map" role="region" aria-label="Interactive map showing story locations"></div>
          </section>

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

              <div class="form-group location-picker">
                <label><i class="fas fa-map-marker-alt"></i> Add Location</label>
                <div class="location-controls">
                  <button type="button" id="get-current-location" class="secondary-button">
                    <i class="fas fa-crosshairs"></i> Use Current Location
                  </button>
                  <button type="button" id="pick-on-map" class="secondary-button">
                    <i class="fas fa-map-pin"></i> Pick on Map
                  </button>
                </div>
                <div id="location-status" class="location-status"></div>
                <div id="location-picker-map" class="location-picker-map" style="display: none;"></div>
                <input type="hidden" id="selected-lat" name="latitude">
                <input type="hidden" id="selected-lon" name="longitude">
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

          <section class="stories-section" aria-labelledby="stories-heading">
            <h2 id="stories-heading"><i class="fas fa-stories"></i> Community Stories</h2>
            <p><i class="fas fa-book-reader"></i> Discover inspiring coding journeys shared by our community members. Each story represents a unique perspective and learning experience.</p>
            <div id="loading" role="status" aria-live="polite"></div>
            <div id="story-list" class="stories-grid" role="list"></div>
          </section>
        </div>
      </main>
    `;
  }

  async afterRender() {
    // Since we already checked token in render(), just load content
    await this.loadStories();
    this._setupAddStoryForm();

    // Subscribe user to push notifications after render if supported and token available
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      if (this.token) {
        subscribeUserToPush(this.token).catch(console.error);
      }
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
    
    // Only set up form if elements exist (user is logged in)
    if (!toggle || !form) {
      console.log('Add story form elements not found - user might not be logged in');
      return;
    }

    toggle.addEventListener('click', () => {
      form.classList.toggle('visible');
      toggle.textContent = form.classList.contains('visible') ? 'Hide Form' : 'Share Your Story';
    });

    this._setupCamera();
    this._setupLocationPicker();
    this._setupFormSubmission();
  }

  _setupLocationPicker() {
    const getCurrentLocationBtn = document.getElementById('get-current-location');
    const pickOnMapBtn = document.getElementById('pick-on-map');
    const locationStatus = document.getElementById('location-status');
    const mapContainer = document.getElementById('location-picker-map');
    const latInput = document.getElementById('selected-lat');
    const lonInput = document.getElementById('selected-lon');
    let locationMap = null;
    let locationMarker = null;

    // Function to update the location status
    const updateLocationStatus = (lat, lon) => {
      locationStatus.innerHTML = `<i class="fas fa-check-circle"></i> Location selected: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
      latInput.value = lat;
      lonInput.value = lon;
    };

    // Function to initialize the map
    const initializeLocationMap = () => {
      if (!window.L) return;

      mapContainer.style.display = 'block';
      mapContainer.classList.add('active');

      if (!locationMap) {
        locationMap = L.map(mapContainer).setView([0, 0], 2);
        
        // Add base layers
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
        osm.addTo(locationMap);

        // Add layer control
        const baseLayers = {
          "OpenStreetMap": osm,
          "Satellite": satellite,
          "Dark Mode": dark
        };
        L.control.layers(baseLayers).addTo(locationMap);

        // Add click handler
        locationMap.on('click', (e) => {
          const { lat, lng } = e.latlng;
          
          if (locationMarker) {
            locationMarker.setLatLng([lat, lng]);
          } else {
            locationMarker = L.marker([lat, lng]).addTo(locationMap);
          }
          
          updateLocationStatus(lat, lng);
        });
      }

      // Invalidate size to handle any display issues
      locationMap.invalidateSize();
    };

    // Get current location button
    getCurrentLocationBtn.addEventListener('click', async () => {
      try {
        locationStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting your location...';
        
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        
        const { latitude: lat, longitude: lon } = position.coords;
        
        // Initialize map if not already
        initializeLocationMap();
        
        // Update map view and marker
        locationMap.setView([lat, lon], 13);
        if (locationMarker) {
          locationMarker.setLatLng([lat, lon]);
        } else {
          locationMarker = L.marker([lat, lon]).addTo(locationMap);
        }
        
        updateLocationStatus(lat, lon);
      } catch (error) {
        locationStatus.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
      }
    });

    // Pick on map button
    pickOnMapBtn.addEventListener('click', () => {
      initializeLocationMap();
      if (!locationStatus.textContent) {
        locationStatus.innerHTML = '<i class="fas fa-info-circle"></i> Click on the map to select a location';
      }
    });
  }

  _setupFormSubmission() {
    const form = document.getElementById('add-story-form');
    const message = document.getElementById('message');
    const button = form.querySelector('button[type="submit"]');
    const buttonText = button.querySelector('.button-text');
    const buttonLoader = button.querySelector('.button-loader');
    const descriptionInput = form.querySelector('#description');
    const photoInput = form.querySelector('#photo');
    const latInput = document.getElementById('selected-lat');
    const lonInput = document.getElementById('selected-lon');

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

    // Push notification subscription setup
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const token = this.token;
      if (token) {
        subscribeUserToPush(token).catch(console.error);
      }
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const description = descriptionInput.value.trim();
      const photoFile = photoInput.files[0];
      const lat = latInput.value ? parseFloat(latInput.value) : null;
      const lon = lonInput.value ? parseFloat(lonInput.value) : null;

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

        // Add the new story with location if available
        const result = await this.model.addStory(this.token, description, photoFile, lat, lon);
        
        if (result.error) {
          throw new Error(result.message);
        }

        // Show success message
        this._showMessage('Story shared successfully!', 'success');
        
        // Trigger push notification after successful story creation
        this._sendPushNotification({
          title: 'Story Published',
          body: 'Your story has been successfully published!',
          url: '/'
        });

        // Reset form and validation states
        form.reset();
        descriptionInput.classList.remove('invalid');
        photoInput.classList.remove('invalid');
        document.getElementById('description-help').textContent = 'Share your coding experience, challenges overcome, or lessons learned';
        document.getElementById('photo-help').textContent = 'Maximum file size: 1MB';
        document.getElementById('description-help').classList.remove('error-message');
        document.getElementById('photo-help').classList.remove('error-message');
        
        // Reset location picker
        document.getElementById('location-status').textContent = '';
        document.getElementById('location-picker-map').style.display = 'none';
        document.getElementById('selected-lat').value = '';
        document.getElementById('selected-lon').value = '';
        
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

  async _subscribeUserToPush() {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this._urlBase64ToUint8Array('BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk')
      });
      console.log('User is subscribed to push notifications:', subscription);

      // Send subscription to server to save for push messages
      const response = await fetch('https://story-api.dicoding.dev/v1/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe to push notifications on server');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.message || 'Server error during push subscription');
      }

      console.log('Push subscription saved on server:', data);
    } catch (error) {
      console.error('Failed to subscribe user to push notifications:', error);
    }
  }

  _urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  _sendPushNotification(payload) {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported in this browser.');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted, cannot show notification.');
      return;
    }

    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(payload.title, {
        body: payload.body,
        icon: 'images/logo.png',
        badge: 'images/logo.png',
        data: {
          url: payload.url
        }
      });
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
      if (startCameraBtn.textContent === 'Start Camera') {
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
      } else {
        this._stopCamera();
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
      this.stream.getTracks().forEach(track => {
        if (track.readyState === 'live') {
          track.stop();
        }
      });
      this.stream = null;
    }
    const cameraContainer = document.getElementById('camera-container');
    if (cameraContainer) {
      cameraContainer.innerHTML = '';
    }
    const capturePhotoBtn = document.getElementById('capture-photo');
    if (capturePhotoBtn) {
      capturePhotoBtn.disabled = true;
    }
    const startCameraBtn = document.getElementById('start-camera');
    if (startCameraBtn) {
      startCameraBtn.textContent = 'Start Camera';
    }
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
      item.className = 'story-item custom-story-card';
      item.innerHTML = `
        <img src="${story.photoUrl}" alt="Photo from ${story.name}'s coding journey" loading="lazy" class="story-image" />
        <div class="story-content">
          <h2 class="story-name">${story.name}</h2>
          <p class="story-description">${story.description}</p>
          <div class="story-meta">
            Posted on <span class="story-date">${new Date(story.createdAt).toLocaleDateString()}</span>
          </div>
          <button class="bookmark-btn" aria-label="Add bookmark" data-id="${story.id}">
            <i class="fas fa-bookmark"></i> Bookmark
          </button>
        </div>
      `;
      storyList.appendChild(item);

      const bookmarkBtn = item.querySelector('.bookmark-btn');
      bookmarkBtn.addEventListener('click', async () => {
        await addBookmark(story);
        bookmarkBtn.textContent = 'Bookmarked';
        bookmarkBtn.disabled = true;
      });
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
    if (loading) {
      loading.textContent = 'Loading stories...';
    }
  }

  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.textContent = '';
    }
  }
}

