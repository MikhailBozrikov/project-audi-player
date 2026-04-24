import { el } from 'redom';
import { Store } from '../services/store';
import { formatTime } from '../utils/helpers';

export class Footer {
  el: HTMLElement;
  private store = Store.getInstance();

  private posterEl: HTMLImageElement;
  private titleEl: HTMLElement;
  private artistEl: HTMLElement;
  private heartEl: HTMLImageElement;
  private timeCurrentEl: HTMLElement;
  private timeTotalEl: HTMLElement;

  constructor() {
    this.posterEl = el('img.footer__track-poster', { src: 'images/poster-1.svg', alt: 'постер' }) as HTMLImageElement;

    this.titleEl = el('span.footer__track-title', 'Трек не выбран');
    this.heartEl = el('img', {
      src: 'images/heart.svg',
      alt: 'избранное',
      width: 24,
      height: 24,
      style: 'filter: grayscale(1) brightness(0.45); cursor: pointer;'
    }) as HTMLImageElement;

    this.artistEl = el('div.footer__track-artist', 'Выберите композицию');

    this.timeCurrentEl = el('span.player__time-current', '0:00');
    this.timeTotalEl = el('span.player__time-total', '0:00');

    this.heartEl.addEventListener('click', () => {
      const track = this.store.currentTrack;
      if (track) {
        if (!this.store.hasToken()) {
          const modalToggle = document.getElementById('modal-toggle') as HTMLInputElement | null;
          if (modalToggle) modalToggle.checked = true;
          return;
        }

        void this.store.toggleFavorite(track.id);
      }
    });

    this.el = el('footer.footer',
      el('div.page-container',
        el('div.footer__content', [
          el('div.footer__track-card', [
            this.posterEl,
            el('div.footer__track-info', [
              el('div.footer__title-row', [
                this.titleEl,
                this.heartEl
              ]),
              this.artistEl
            ])
          ]),
          el('div.player__play-mobile',
            el('img', { src: 'images/play.svg', alt: 'play', width: 40, height: 40 })
          ),
          el('div.player', [
            el('div.player__buttons', [
              el('img', { src: 'images/together.svg', alt: 'перемешать', width: 16, height: 16 }),
              el('img', { src: 'images/previous.svg', alt: 'предыдущий', width: 16, height: 16 }),
              el('img', { src: 'images/play.svg', alt: 'play', width: 30, height: 30 }),
              el('img', { src: 'images/next.svg', alt: 'следующий', width: 16, height: 16 }),
              el('img', { src: 'images/fixate.svg', alt: 'зациклить', width: 16, height: 16 })
            ]),
            el('div.player__progress-bar', [
              this.timeCurrentEl,
              el('div.player__progress-track',
                el('div.player__progress-fill')
              ),
              this.timeTotalEl
            ])
          ]),
          el('div.player__volume', [
            el('img', { src: 'images/sound.svg', alt: 'громкость', width: 16, height: 16 }),
            el('div.player__volume-bar', [
              el('div.player__volume-fill'),
              el('div.player__volume-thumb')
            ])
          ])
        ])
      )
    );

    this.store.subscribe(() => this.render());
    this.render();
  }

  private getTrackPoster(track: { poster?: string }) {
    return track.poster || 'images/poster-1.svg';
  }

  private render() {
    const track = this.store.currentTrack;

    if (!track) {
      this.posterEl.src = 'images/poster-1.svg';
      this.titleEl.textContent = 'Трек не выбран';
      this.artistEl.textContent = 'Выберите композицию';
      this.heartEl.src = 'images/heart.svg';
      this.heartEl.style.filter = 'grayscale(1) brightness(0.45)';
      this.timeCurrentEl.textContent = '0:00';
      this.timeTotalEl.textContent = '0:00';
      return;
    }

    this.posterEl.src = this.getTrackPoster(track);
    this.titleEl.textContent = track.title;
    this.artistEl.textContent = track.artist;

    const isFav = this.store.favorites.has(track.id);
    this.heartEl.src = 'images/heart.svg';
    this.heartEl.style.filter = isFav ? 'none' : 'grayscale(1) brightness(0.45)';

    this.timeCurrentEl.textContent = formatTime(this.store.currentTime);
    this.timeTotalEl.textContent = formatTime(this.store.duration || Math.round(track.duration * 60));
  }
}
