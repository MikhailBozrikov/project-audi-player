import './css/style.css';
import { mount } from 'redom';
import { App } from './components/app';
import { Store } from './services/store';
import { AudioPlayer } from './services/audio-player';

const store = Store.getInstance();
const player = AudioPlayer.getInstance();

const app = new App();
mount(document.getElementById('app')!, app);
app.init();

async function bootstrap() {
  try {
    await store.loadTracks();

    if (store.hasToken()) {
      try {
        await store.loadFavorites();
      } catch {
        console.warn('Не удалось загрузить избранное');
      }
    }
  } catch (error) {
    console.error('Не удалось загрузить треки:', error);
  }
}

void bootstrap();
