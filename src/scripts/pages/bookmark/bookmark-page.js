import { addBookmark, removeBookmark, getAllBookmarks } from '../../utils/indexeddb.js';
import '../../../styles/home.css';

export default class BookmarkPage {
  constructor() {
    this.bookmarkedStories = [];
  }

  async render() {
    return `
      <main id="main-content" tabindex="-1">
        <div class="bookmark-container">
          <section class="bookmark-section" aria-labelledby="bookmark-heading">
            <h2 id="bookmark-heading"><i class="fas fa-bookmark"></i> Bookmarked Stories</h2>
            <p>Here are the stories you have bookmarked from the community.</p>
            <div id="bookmark-list" class="stories-grid" role="list"></div>
          </section>
        </div>
      </main>
    `;
  }

  async afterRender() {
    await this.loadBookmarkedStories();
  }

  async loadBookmarkedStories() {
    this.bookmarkedStories = await getAllBookmarks();
    this.renderBookmarkedStories();
  }

  renderBookmarkedStories() {
    const bookmarkList = document.getElementById('bookmark-list');
    bookmarkList.innerHTML = '';

    if (this.bookmarkedStories.length === 0) {
      bookmarkList.innerHTML = '<p>You have no bookmarked stories.</p>';
      return;
    }

      this.bookmarkedStories.forEach((story) => {
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
          <button class="remove-bookmark-btn" aria-label="Remove bookmark" data-id="${story.id}">
            <i class="fas fa-trash-alt"></i> Remove
          </button>
        </div>
      `;

      bookmarkList.appendChild(item);

      const removeBtn = item.querySelector('.remove-bookmark-btn');
      removeBtn.addEventListener('click', async () => {
        await removeBookmark(story.id);
        await this.loadBookmarkedStories();
      });
    });
  }
}
