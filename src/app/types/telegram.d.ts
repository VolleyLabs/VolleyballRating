interface TelegramWebApp {
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  onEvent: (eventName: string, callback: () => void) => void;
  offEvent: (eventName: string, callback: () => void) => void;
}

interface Telegram {
  WebApp: TelegramWebApp;
}

interface Window {
  Telegram?: Telegram;
} 