export interface SimpleIcon {
  title: string;
  slug: string;
  path: string;
}

const createIcon = (title: string, path: string, slug?: string): SimpleIcon => ({
  title,
  slug: slug ?? title.toLowerCase().replace(/\s+/g, ""),
  path,
});

export const siPlaystation = createIcon(
  "PlayStation",
  "M4 6.3 11.5 4v15.2c0 .5-.4.9-.9.8-.2 0-.4 0-.6-.1L4 18.2V6.3zm9 0 6.7 2v10.5c0 .4-.3.7-.6.8l-6.1 1.5c-.4.1-.8-.2-.8-.6z",
  "playstation"
);

export const siPlaystation4 = createIcon(
  "PlayStation 4",
  "M3 14.5c0-2.5 1.8-4.5 4.3-4.5H9V7H5V5h6v5.2H7.3C5.8 10.2 5 11.3 5 12.8s.8 2.6 2.3 2.6H11V17H7.3C4.8 17 3 16 3 14.5zm9.5 2.5V5h2v10.3l4-2.3V5h2v12h-2v-3.8l-4 2.3V17z",
  "playstation4"
);

export const siPlaystation5 = createIcon(
  "PlayStation 5",
  "M2.5 14.7c0-2.7 2.3-4.7 5.5-4.7H12V7H4V5h10v5.2H8c-2.1 0-3.5 1.1-3.5 2.6S5.9 15.4 8 15.4H14V17H8c-3 0-5.5-1.5-5.5-2.3zm13.5 2.3V5h5.5v2h-3.5v3h3v2h-3v3h3.5v2H16z",
  "playstation5"
);

export const siXbox = createIcon(
  "Xbox",
  "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm3.7 14.4-3.7-4.1-3.7 4.1c-1.4-1-2.6-2.6-3-4.4l4.4-3.5-3.6-2.4A8 8 0 0 1 12 4c1.8 0 3.5.6 4.9 1.6l-3.6 2.4 4.4 3.5c-.4 1.8-1.6 3.4-3 4.4Z",
  "xbox"
);

export const siXboxseriesx = createIcon(
  "Xbox Series",
  "M6 5h12a2 2 0 0 1 2 2v10.5A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5V7a2 2 0 0 1 2-2Zm0 2v4l6-2.8L18 11V7zm12 10.5v-5L12 11l-6 3.5v3a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5Z",
  "xboxseriesx"
);

export const siNintendoswitch = createIcon(
  "Nintendo Switch",
  "M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 2v14h3.5A3.5 3.5 0 0 0 14 15.5V8.5A3.5 3.5 0 0 0 10.5 5zm10 0h-3.5A3.5 3.5 0 0 0 10 8.5v7a3.5 3.5 0 0 0 3.5 3.5H17z",
  "nintendoswitch"
);

export const siWindows = createIcon(
  "Windows",
  "M4 5h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5v2h3v2H6v-2h3v-2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 2v8h16V7Z",
  "windows"
);

export const siApple = createIcon(
  "Apple",
  "M15.5 3c-.9 0-1.9.6-2.4 1.3-.5.6-.9 1.5-.8 2.3 1 .1 2-.5 2.6-1.2.5-.6.9-1.5.6-2.4Zm2.4 5.4c-1-.1-1.9.4-2.5.4-.7 0-1.7-.4-2.8-.4-2 0-4.2 1.2-5.2 3.3-1.8 3.3-.5 8.4 1.3 11 .9 1.3 2.1 2.8 3.6 2.7 1.4 0 1.9-.9 3.6-.9 1.7 0 2.1.9 3.6.9 1.5 0 2.5-1.3 3.4-2.6 1.1-1.5 1.5-3 1.5-3.1-.1 0-2.9-1.1-3-4.2-.1-2.6 2.1-3.8 2.2-3.9-1.2-1.7-3.1-1.9-3.7-2.1Z",
  "apple"
);

export const siLinux = createIcon(
  "Linux",
  "M12 2c2.3 0 3.5 1.9 3.5 4.1 0 1.1-.4 2.2-.4 3.2 0 1.6.7 2.7 1.5 4.1 1 1.8 1.9 4 .9 6-1 2-2.6 2.6-3.9 2.6-.8 0-1.4-.2-1.6-.2s-.8.2-1.6.2c-1.3 0-2.9-.6-3.9-2.6-1-2-.1-4.2.9-6 .8-1.4 1.5-2.5 1.5-4.1 0-1-.4-2-.4-3.2C8.5 3.9 9.7 2 12 2Zm-1.2 3.5a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Zm2.4 0a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z",
  "linux"
);

export const siSteamdeck = createIcon(
  "Steam Deck",
  "M5 7h14a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-2.5a3 3 0 0 1-2.7 2H10.2a3 3 0 0 1-2.7-2H5a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3Zm7-5a3 3 0 1 0 3 3 3 3 0 0 0-3-3Zm-5.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z",
  "steamdeck"
);
