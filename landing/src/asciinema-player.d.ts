declare module 'asciinema-player' {
  export interface PlayerOptions {
    cols?: number;
    rows?: number;
    autoPlay?: boolean;
    preload?: boolean;
    loop?: boolean | number;
    startAt?: number | string;
    speed?: number;
    idleTimeLimit?: number;
    theme?: string | {
      background?: string;
      foreground?: string;
    };
    poster?: string;
    fit?: 'width' | 'height' | 'both' | false;
    terminalFontSize?: 'small' | 'medium' | 'big' | string;
    terminalFontFamily?: string;
    terminalLineHeight?: number;
  }

  export interface Player {
    play(): Promise<void>;
    pause(): void;
    seek(time: number): void;
    getCurrentTime(): number;
    getDuration(): number;
    dispose(): void;
    addEventListener(event: string, handler: Function): void;
  }

  export function create(
    src: string,
    element: HTMLElement,
    options?: PlayerOptions
  ): Player;
}
