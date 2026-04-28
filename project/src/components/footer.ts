import { el } from 'redom';
import { Store } from '../services/store';
import { AudioPlayer } from '../services/audio-player';
import { formatTime } from '../utils/helpers';

export class Footer {
  el: HTMLElement;
  private store = Store.getInstance();
  private player = AudioPlayer.getInstance();

  private posterEl: HTMLImageElement;
  private titleEl: HTMLElement;
  private artistEl: HTMLElement;
  private heartEl: HTMLImageElement;
  private timeCurrentEl: HTMLElement;
  private timeTotalEl: HTMLElement;

  private progressFillEl: HTMLElement;
  private volumeFillEl: HTMLElement;
  private volumeThumbEl: HTMLElement;

  private playBtnDesktop: HTMLImageElement;
  private playBtnMobile: HTMLImageElement;
  private repeatBtn: HTMLImageElement;
  private shuffleBtn: HTMLImageElement;
  private prevBtn: HTMLImageElement;
  private nextBtn: HTMLImageElement;
  private progressTrack: HTMLElement;
  private volumeBar: HTMLElement;

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

    this.progressFillEl = el('div.player__progress-fill');
    this.progressTrack = el('div.player__progress-track', this.progressFillEl);

    this.volumeFillEl = el('div.player__volume-fill');
    this.volumeThumbEl = el('div.player__volume-thumb');
    this.volumeBar = el('div.player__volume-bar', [this.volumeFillEl, this.volumeThumbEl]);

    this.shuffleBtn = el('img', { src: 'images/together.svg', alt: 'перемешать', width: 16, height: 16 }) as HTMLImageElement;
    this.prevBtn = el('img', { src: 'images/previous.svg', alt: 'предыдущий', width: 16, height: 16 }) as HTMLImageElement;
    this.playBtnDesktop = el('img', { src: 'images/play.svg', alt: 'play', width: 30, height: 30 }) as HTMLImageElement;
    this.nextBtn = el('img', { src: 'images/next.svg', alt: 'следующий', width: 16, height: 16 }) as HTMLImageElement;
    this.repeatBtn = el('img', { src: 'images/fixate.svg', alt: 'зациклить', width: 16, height: 16 }) as HTMLImageElement;
    this.playBtnMobile = el('img', { src: 'images/play.svg', alt: 'play', width: 40, height: 40 }) as HTMLImageElement;

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
          el('div.player__play-mobile', this.playBtnMobile),
          el('div.player', [
            el('div.player__buttons', [
              this.shuffleBtn,
              this.prevBtn,
              this.playBtnDesktop,
              this.nextBtn,
              this.repeatBtn
            ]),
            el('div.player__progress-bar', [
              this.timeCurrentEl,
              this.progressTrack,
              this.timeTotalEl
            ])
          ]),
          el('div.player__volume', [
            el('img', { src: 'images/sound.svg', alt: 'громкость', width: 16, height: 16 }),
            this.volumeBar
          ])
        ])
      )
    );

    this.repeatBtn.style.filter = this.player.repeatEnabled ? 'none' : 'grayscale(1) brightness(0.55)';
    this.repeatBtn.style.opacity = this.player.repeatEnabled ? '1' : '0.7';

    this.volumeFillEl.style.width = '100%';
    this.volumeThumbEl.style.left = 'calc(100% - 6px)';

    this.player.addEventListener('timeupdate', (e: Event) => {
      const { currentTime, duration } = (e as CustomEvent).detail;
      this.timeCurrentEl.textContent = formatTime(currentTime);
      this.timeTotalEl.textContent = formatTime(duration);
      const percent = duration > 0 ? Math.min(1, currentTime / duration) : 0;
      this.progressFillEl.style.width = `${percent * 100}%`;
    });

    this.player.addEventListener('playbackchange', (e: Event) => {
      const { playing } = (e as CustomEvent).detail;
      const iconSrc = playing ? 'images/pause.svg' : 'images/play.svg';
      this.playBtnDesktop.src = iconSrc;
      this.playBtnMobile.src = iconSrc;
    });

    this.player.addEventListener('volumechange', (e: Event) => {
      const { volume } = (e as CustomEvent).detail;
      const percent = volume * 100;
      this.volumeFillEl.style.width = `${percent}%`;
      this.volumeThumbEl.style.left = `calc(${percent}% - 6px)`;
    });

    this.player.addEventListener('repeatchange', (e: Event) => {
      const { repeatEnabled } = (e as CustomEvent).detail;
      this.repeatBtn.style.filter = repeatEnabled ? 'none' : 'grayscale(1) brightness(0.55)';
      this.repeatBtn.style.opacity = repeatEnabled ? '1' : '0.7';
    });

    this.shuffleBtn.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      void this.player.playRandom();
    });

    this.prevBtn.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      this.player.skip(-10);
    });

    this.playBtnDesktop.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      this.player.togglePlay();
    });

    this.playBtnMobile.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      this.player.togglePlay();
    });

    this.nextBtn.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      this.player.skip(10);
    });

    this.repeatBtn.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      this.player.toggleRepeat();
    });

    this.progressTrack.addEventListener('click', (e: MouseEvent) => {
      if (!isFinite(this.store.duration) || this.store.duration <= 0) return;
      const rect = this.progressTrack.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const time = percent * this.store.duration;
      this.player.seekTo(time);
    });

    this.volumeBar.addEventListener('click', (e: MouseEvent) => {
      const rect = this.volumeBar.getBoundingClientRect();
      let percent = (e.clientX - rect.left) / rect.width;
      percent = Math.min(1, Math.max(0, percent));
      this.player.setVolume(percent);
    });

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

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') this.player.skip(-10);
      if (e.key === 'ArrowRight') this.player.skip(10);
    });

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
      this.progressFillEl.style.width = '0%';
      return;
    }

    this.posterEl.src = this.getTrackPoster(track);
    this.titleEl.textContent = track.title;
    this.artistEl.textContent = track.artist;

    const isFav = this.store.favorites.has(track.id);
    this.heartEl.src = 'images/heart.svg';
    this.heartEl.style.filter = isFav ? 'none' : 'grayscale(1) brightness(0.45)';
  }
}