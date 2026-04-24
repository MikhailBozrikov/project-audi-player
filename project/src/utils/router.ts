type RouteHandler = () => void;

export class Router {
  private routes = new Map<string, RouteHandler>();
  private currentPath: string = '';

  constructor() {
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  init() {
    this.handleRoute();
  }

  register(path: string, handler: RouteHandler) {
    this.routes.set(path, handler);
  }

  navigate(path: string) {
    window.location.hash = path;
  }

  private handleRoute() {
    let hash = window.location.hash.slice(1);
    if (!hash) hash = 'tracks';

    if (this.currentPath === hash) return;

    const handler = this.routes.get(hash);
    if (handler) {
      this.currentPath = hash;
      handler();
    } else {
      this.navigate('tracks');
    }
  }
}
