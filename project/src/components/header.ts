import { el } from 'redom';
import { Store } from '../services/store';

export class Header {
  el: HTMLElement;
  private store = Store.getInstance();
  private usernameEl: HTMLElement;
  private searchInputEl: HTMLInputElement;
  private clearSearchBtn: HTMLButtonElement;

  constructor() {
    this.usernameEl = el('span.header__user-name', this.store.user?.username || 'username');

    this.searchInputEl = el('input', {
      type: 'text',
      placeholder: 'Что будем искать?',
      autocomplete: 'off',
      spellcheck: false,
      oninput: () => this.handleSearchInput()
    }) as HTMLInputElement;

    const clearIcon = el('img', {
      src: 'images/x-black.svg',
      alt: 'очистить',
      width: 16,
      height: 16
    }) as HTMLImageElement;

    this.clearSearchBtn = el('button.header__search-clear', {
      type: 'button',
      'aria-label': 'Очистить поиск',
      onclick: () => this.clearSearch()
    }) as HTMLButtonElement;

    this.clearSearchBtn.appendChild(clearIcon);

    const searchField = el('div.header__search-input-wrap', [
      this.searchInputEl,
      this.clearSearchBtn
    ]);

    this.el = el('header.header',
      el('div.page-container',
        el('div.header__content', [
          el('label.header__logo', { for: 'sidebar-toggle' }, [
            el('div.header__logo-icon', el('img', { src: 'images/arrow-right.svg', alt: 'стрелка' })),
            el('span.header__logo-text', 'VibeCast Studio')
          ]),
          el('div.header__search', [
            el('img.header__search-icon', { src: 'images/search.svg', alt: 'поиск' }),
            searchField
          ]),
          el('button.header__user', {
            type: 'button',
            style: 'background: none; border: none; padding: 0; cursor: pointer;'
          }, [
            el('img.header__user-avatar', { src: 'images/avatar.svg', alt: 'аватар' }),
            this.usernameEl,
            el('img.header__user-arrow', { src: 'images/arrow-small.svg', alt: 'стрелка' })
          ])
        ])
      )
    );

    this.store.subscribe(() => this.render());
    this.render();
  }

  private handleSearchInput() {
    this.store.setSearchQuery(this.searchInputEl.value);
    this.syncSearchUi();
  }

  private clearSearch() {
    this.searchInputEl.value = '';
    this.store.clearSearch();
    this.syncSearchUi();
    this.searchInputEl.focus();
  }

  private syncSearchUi() {
    const hasQuery = this.searchInputEl.value.trim().length > 0;
    this.clearSearchBtn.style.display = hasQuery ? 'flex' : 'none';
  }

  private render() {
    this.usernameEl.textContent = this.store.user?.username || 'username';

    const query = this.store.getSearchQuery();
    if (this.searchInputEl.value !== query) {
      this.searchInputEl.value = query;
    }

    this.syncSearchUi();
  }
}
