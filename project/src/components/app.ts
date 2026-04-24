import { el } from 'redom';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Footer } from './footer';
import { ModalAuth } from './modal-auth';
import { TracksPage } from './tracks-page';
import { FavoritesPage } from './favorites-page';
import { ProfilePage } from './profile-page';
import { Router } from '../utils/router';
import { Store } from '../services/store';

export class App {
  el: HTMLElement;
  private router = new Router();
  private store = Store.getInstance();
  private contentContainer: HTMLElement;
  private tracksPage = new TracksPage();
  private favoritesPage = new FavoritesPage();
  private profilePage = new ProfilePage();

  constructor() {
    const sidebarToggle = el('input.sidebar__toggle', {
      type: 'checkbox',
      id: 'sidebar-toggle'
    });

    const modalToggle = el('input.modal-auth__toggle', {
      type: 'checkbox',
      id: 'modal-toggle'
    });

    const sidebar = new Sidebar();
    const header = new Header();
    const footer = new Footer();
    const modalAuth = new ModalAuth();

    this.contentContainer = el('div.main-section__content');

    const mainArea = el(
      'div.app__main-area',
      header.el,
      el(
        'main',
        el(
          'section.main-section',
          el('div.page-container', this.contentContainer)
        )
      )
    );

    const layout = el('div.app__layout', [sidebar.el, mainArea]);

    this.el = el('div.app', [sidebarToggle, modalToggle, layout, footer.el, modalAuth.el]);

    this.router.register('tracks', () => this.showTracks());
    this.router.register('favorites', () => this.showFavorites());
    this.router.register('profile', () => this.showProfile());
  }

  init() {
    this.attachNavListeners();
    this.router.init();
  }

  private openAuthModal() {
    const modalToggle = document.getElementById('modal-toggle') as HTMLInputElement | null;
    if (modalToggle) modalToggle.checked = true;
  }

  private attachNavListeners() {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      const audioBtn = target.closest('.main-section__mobile-nav-btn--audio');
      const favoriteBtn = target.closest('.main-section__mobile-nav-btn--favorite');
      const sidebarLink = target.closest('.sidebar__link');
      const userBtn = target.closest('.header__user');

      if (audioBtn) {
        e.preventDefault();
        this.router.navigate('tracks');
        return;
      }

      if (favoriteBtn) {
        e.preventDefault();
        this.router.navigate('favorites');
        return;
      }

      if (sidebarLink && window.innerWidth > 768) {
        e.preventDefault();
        const text = sidebarLink.querySelector('.sidebar__link-text')?.textContent;
        if (text === 'Избранное') this.router.navigate('favorites');
        else if (text === 'Аудиокомпозиции') this.router.navigate('tracks');
        return;
      }

      if (userBtn) {
        if (this.store.hasToken()) {
          this.router.navigate('profile');
        } else {
          this.openAuthModal();
        }
      }
    });
  }

  private clearContent() {
    while (this.contentContainer.firstChild) {
      this.contentContainer.removeChild(this.contentContainer.firstChild);
    }
  }

  private showTracks() {
    this.clearContent();
    this.contentContainer.appendChild(this.tracksPage.el);
  }

  private showFavorites() {
    this.clearContent();
    this.contentContainer.appendChild(this.favoritesPage.el);
  }

  private showProfile() {
    this.clearContent();
    this.contentContainer.appendChild(this.profilePage.el);
  }
}
