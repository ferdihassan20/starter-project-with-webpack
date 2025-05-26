import { StoryModel } from '../../data/story-model.js';
import { StoryPresenter } from '../../presenter/story-presenter.js';

export default class AddStoryPage {
  constructor() {
    this.model = new StoryModel();
    this.presenter = new StoryPresenter(this.model, this);
    this.token = localStorage.getItem('token') || null;
    this.latitude = null;
    this.longitude = null;
    this.stream = null;
  }

  async render() {
    return `
      <section class="container" tabindex="0" aria-label="Add new story form">
        <h1>Add New Story</h1>
        <form id="add-story-form" aria-label="Add story form">
          <label for="description">Description</label>
          <textarea id="description" name="description" required aria-required="true"></textarea>

          <label for="photo">Photo (max 1MB)</label>
          <input type="file" id="photo" name="photo" accept="image/*" capture="environment" required aria-required="true" />

          <div id="camera-container" aria-label="Camera preview"></div>
          <button type="button" id="start-camera">Start Camera</button>
          <button type="button" id="capture-photo" disabled>Capture Photo</button>
          <canvas id="canvas" style="display:none;"></canvas>

          <label for="map">Select Location on Map</label>
          <div id="map" style="height: 400px;" aria-label="Map to select location"></div>

          <button type="submit">Submit</button>
        </form>
        <div id="message" role="alert" aria-live="assertive"></div>
      </section>
    `;
  }

  async afterRender() {
    if (!this.token) {
      document.getElementById('message').innerText = 'Please login to add a story.';
      return;
    }

    this._initMap();
    this._setupCamera();
    this._setupForm();
  }

  _initMap() {
    if (!window.L) {
      console.error('Leaflet library is not loaded.');
      return;
    }

    this.map = L.map('map').setView([0, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.marker = null;

    this.map.on('click', (e) => {
      this.latitude = e.latlng.lat;
      this.longitude = e.latlng.lng;

      if (this.marker) {
        this.marker.setLatLng(e.latlng);
      } else {
        this.marker = L.marker(e.latlng).addTo(this.map);
      }
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
          this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
          cameraContainer.innerHTML = '';
          const video = document.createElement('video');
          video.srcObject = this.stream;
          video.play();
          cameraContainer.appendChild(video);
          capturePhotoBtn.disabled = false;
        } catch (error) {
          cameraContainer.innerText = 'Cannot access camera: ' + error.message;
        }
      } else {
        cameraContainer.innerText = 'Camera API not supported.';
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
      }, 'image/png');

      // Stop camera stream
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      cameraContainer.innerHTML = '';
      capturePhotoBtn.disabled = true;
    });
  }

  _setupForm() {
    const form = document.getElementById('add-story-form');
    const message = document.getElementById('message');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const description = form.description.value;
      const photoFile = form.photo.files[0];

      if (!description || !photoFile) {
        message.innerText = 'Description and photo are required.';
        return;
      }

      try {
        await this.presenter.addNewStory(this.token, description, photoFile, this.latitude, this.longitude);
        message.innerText = 'Story added successfully!';
        form.reset();
        if (this.marker) {
          this.map.removeLayer(this.marker);
          this.marker = null;
        }
        this.latitude = null;
        this.longitude = null;
      } catch (error) {
        message.innerText = 'Failed to add story: ' + error.message;
      }
    });
  }

  showLoading() {
    const message = document.getElementById('message');
    message.innerText = 'Processing...';
  }

  renderAddStorySuccess(msg) {
    const message = document.getElementById('message');
    message.innerText = msg;
  }

  renderError(msg) {
    const message = document.getElementById('message');
    message.innerText = msg;
  }
}
