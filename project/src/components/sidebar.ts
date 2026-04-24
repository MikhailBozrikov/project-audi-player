import { el } from 'redom';

export class Sidebar {
  el: HTMLElement;

  constructor() {
    this.el = el('aside.sidebar',
      el('div.sidebar__content', [
        el('label.sidebar__logo', { for: 'sidebar-toggle' }, [
          el('div.sidebar__logo-icon', el('img', { src: 'images/arrow-right.svg', alt: 'стрелка' })),
          el('span.sidebar__logo-text', 'VibeCast Studio')
        ]),
        el('nav.sidebar__nav', { 'aria-label': 'Навигация по сайдбару' }, [
          el('a.sidebar__link', { href: '#' }, [
            el('img.sidebar__link-icon', { src: 'images/music.svg', alt: '' }),
            el('span.sidebar__link-text', 'Избранное')
          ]),
          el('a.sidebar__link', { href: '#' }, [
            el('img.sidebar__link-icon', { src: 'images/music.svg', alt: '' }),
            el('span.sidebar__link-text', 'Аудиокомпозиции')
          ])
        ])
      ])
    );
  }
}
