import CONFIG from '../config';

const API_BASE_URL = CONFIG.BASE_URL;

export class StoryModel {
  async register(name, email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Register failed');
      }
      return data;
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Gagal terhubung ke server, cek koneksi internet anda');
      }
      throw error;
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      return data.loginResult;
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Gagal terhubung ke server, cek koneksi internet anda');
      }
      throw error;
    }
  }

  async getStories(token, page = 1, size = 10, location = 0) {
    const url = new URL(`${API_BASE_URL}/stories`);
    url.searchParams.append('page', page);
    url.searchParams.append('size', size);
    url.searchParams.append('location', location);
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(url.toString(), {
      headers,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch stories');
    }
    return data.listStory;
  }

  async getStoryDetail(token, id) {
    const response = await fetch(`${API_BASE_URL}/stories/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch story detail');
    }
    return data.story;
  }

  async addStory(token, description, photoFile, lat = null, lon = null) {
    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', photoFile);
    if (lat !== null) formData.append('lat', lat);
    if (lon !== null) formData.append('lon', lon);

    const response = await fetch(`${API_BASE_URL}/stories`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to add story');
    }
    return data;
  }

  async addStoryGuest(description, photoFile, lat = null, lon = null) {
    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', photoFile);
    if (lat !== null) formData.append('lat', lat);
    if (lon !== null) formData.append('lon', lon);

    const response = await fetch(`${API_BASE_URL}/stories/guest`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to add guest story');
    }
    return data;
  }
}
