import { el, setChildren } from 'redom';
import { Store } from '../services/store';
import { AudioPlayer } from '../services/audio-player';
import type { Track } from '../types/app.types';
import { formatTime } from '../utils/helpers';

type TrackItem = Track & { date?: string };

export class FavoritesPage {
  private store = Store.getInstance();
  private player = AudioPlayer.getInstance();
  private tableWrapper: HTMLElement;
  private mobileCards: HTMLElement;
  el: HTMLElement;

  constructor() {
    const title = el('h1.main-section__title', 'Избранное');
    const mobileNav = el('nav.main-section__mobile-nav', [
      el('button.main-section__mobile-nav-btn.main-section__mobile-nav-btn--audio', [
        el('img', { src: 'images/play-button.svg', width: 24, height: 24 }),
        el('span', 'Аудиокомпозиции')
      ]),
      el('button.main-section__mobile-nav-btn.main-section__mobile-nav-btn--favorite', [
        el('span', 'Избранное')
      ])
    ]);

    const table = el('table.tracks-table',
      el('thead', el('tr', [
        el('th.tracks-table__col.tracks-table__col--number', '№'),
        el('th.tracks-table__col.tracks-table__col--title', 'Название'),
        el('th.tracks-table__col.tracks-table__col--album', 'АЛЬБОМ'),
        el('th.tracks-table__col.tracks-table__col--date', el('img', { src: 'images/calendar.svg', width: 16, height: 16 })),
        el('th.tracks-table__col.tracks-table__col--favorite'),
        el('th.tracks-table__col.tracks-table__col--duration', el('img', { src: 'images/clock.svg', width: 16, height: 16 })),
        el('th.tracks-table__col.tracks-table__col--more')
      ])),
      el('tbody')
    );

    this.tableWrapper = el('div.tracks-table__wrapper', table);
    this.mobileCards = el('div.main-section__mobile-cards');
    this.el = el('div', { style: 'display: contents' }, [
      title,
      mobileNav,
      this.tableWrapper,
      this.mobileCards
    ]);

    this.store.subscribe(() => this.render());
    this.render();
  }

  private render() {
    const favoriteTracks = (this.store.allTracks as TrackItem[]).filter(t => this.store.favorites.has(t.id));
    const filteredFavorites = this.store.filterTracks(favoriteTracks);

    const tbody = this.tableWrapper.querySelector('tbody')!;
    setChildren(tbody, filteredFavorites.map(t => this.createRow(t)));
    setChildren(this.mobileCards, filteredFavorites.map(t => this.createCard(t)));
  }

  private createFavoriteButton(trackId: number) {
    return el('button', {
      type: 'button',
      style: 'border: none; background: transparent; padding: 0; cursor: pointer;',
      onclick: (e: Event) => {
        e.stopPropagation();

        if (!this.store.hasToken()) {
          const modalToggle = document.getElementById('modal-toggle') as HTMLInputElement | null;
          if (modalToggle) modalToggle.checked = true;
          return;
        }

        void this.store.toggleFavorite(trackId);
      }
    }, [
      el('img', {
        src: 'images/heart.svg',
        width: 24,
        height: 24,
        style: 'filter: none;'
      })
    ]);
  }

  private getTrackPoster(track: TrackItem) {
    return track.poster || 'images/poster-1.svg';
  }

  private createRow(track: TrackItem) {
    const durationSec = Math.round(track.duration * 60);
    const poster = this.getTrackPoster(track);

    const row = el('tr', [
      el('td.tracks-table__col.tracks-table__col--number', track.id),
      el('td.tracks-table__col.tracks-table__col--title',
        el('div.track-info', [
          el('img.track-info__poster', { src: poster, alt: 'постер' }),
          el('div.track-info__text', [
            el('div.track-info__name', track.title),
            el('div.track-info__artist', track.artist)
          ])
        ])
      ),
      el('td.tracks-table__col.tracks-table__col--album', track.album || '—'),
      el('td.tracks-table__col.tracks-table__col--date', track.date || '—'),
      el('td.tracks-table__col.tracks-table__col--favorite', this.createFavoriteButton(track.id)),
      el('td.tracks-table__col.tracks-table__col--duration', formatTime(durationSec)),
      el('td.tracks-table__col.tracks-table__col--more', el('img', { src: 'images/dots.svg', width: 23, height: 4 }))
    ]);

    row.addEventListener('click', () => {
      this.player.loadTrack({ ...track, poster }).then(() => this.player.play());
    });

    return row;
  }

  private createCard(track: TrackItem) {
    const poster = this.getTrackPoster(track);

    const card = el('div.track-card', [
      el('div.track-card__info', [
        el('img.track-info__poster', { src: poster, alt: 'постер' }),
        el('div.track-info__text', [
          el('div.track-info__name', track.title),
          el('div.track-info__artist', track.artist)
        ])
      ]),
      el('div.track-card__actions', [
        this.createFavoriteButton(track.id),
        el('div.track-card__dots', [el('span'), el('span'), el('span')])
      ])
    ]);

    card.addEventListener('click', () => {
      this.player.loadTrack({ ...track, poster }).then(() => this.player.play());
    });

    return card;
  }
}
