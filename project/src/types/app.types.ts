export interface Track {
  id: number;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  size_mb?: number;
  encoded_audio?: string;
  audioBlobUrl?: string;
  poster?: string;
}

export interface User {
  username: string;
  token: string;
}

