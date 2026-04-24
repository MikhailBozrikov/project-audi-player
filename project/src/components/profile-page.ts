import { el } from 'redom';
import { Store } from '../services/store';

export class ProfilePage {
  private store = Store.getInstance();
  el: HTMLElement;

  constructor() {
    this.el = el('div.profile', { style: 'padding: 20px; text-align: center;' });
    this.store.subscribe(() => this.render());
    this.render();
  }

  private render() {
    const user = this.store.user;
    const favCount = this.store.favorites.size;

    const content = el('div', [
      el('h1.main-section__title', 'Страница пользователя'),
      el('img.profile__avatar', {
        src: 'images/avatar.svg',
        style: 'width: 100px; height: 100px; border-radius: 50%; margin-bottom: 16px;'
      }),
      el('p', `Имя пользователя: ${user?.username || 'не авторизован'}`),
      el('p', `Избранных треков: ${favCount}`),
      user
        ? el('button.profile__logout-btn', {
            style: 'margin-top: 20px; padding: 8px 16px; background: #FC6D3E; color: white; border: none; border-radius: 30px; cursor: pointer;',
            onclick: () => this.logout()
          }, 'Выйти из аккаунта')
        : el('button.profile__login-btn', {
            style: 'margin-top: 20px; padding: 8px 16px; background: #67A5EB; color: white; border: none; border-radius: 30px; cursor: pointer;',
            onclick: () => this.openAuthModal()
          }, 'Войти')
    ]);

    while (this.el.firstChild) this.el.removeChild(this.el.firstChild);
    this.el.appendChild(content);
  }

  private openAuthModal() {
    const modalToggle = document.getElementById('modal-toggle') as HTMLInputElement | null;
    if (modalToggle) modalToggle.checked = true;
  }

  private logout() {
    this.store.logout();
    window.location.hash = 'tracks';
  }
}
