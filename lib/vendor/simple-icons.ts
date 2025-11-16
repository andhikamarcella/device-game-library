export interface SimpleIcon {
  title: string;
  slug: string;
  hex: string;
  path: string;
}

function createIcon(title: string, slug: string, hex: string, path: string): SimpleIcon {
  return { title, slug, hex, path };
}

export const siPlaystation = createIcon(
  "PlayStation",
  "playstation",
  "003791",
  "M4 6.3 11.5 4v15.2c0 .5-.4.9-.9.8-.2 0-.4 0-.6-.1L4 18.2V6.3zm9 0 6.7 2v10.5c0 .4-.3.7-.6.8l-6.1 1.5c-.4.1-.8-.2-.8-.6z"
);

export const siXbox = createIcon(
  "Xbox",
  "xbox",
  "107C10",
  "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm3.7 14.4-3.7-4.1-3.7 4.1c-1.4-1-2.6-2.6-3-4.4l4.4-3.5-3.6-2.4A8 8 0 0 1 12 4c1.8 0 3.5.6 4.9 1.6l-3.6 2.4 4.4 3.5c-.4 1.8-1.6 3.4-3 4.4Z"
);

export const siWindows = createIcon(
  "Windows",
  "windows",
  "0078D6",
  "M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"
);

export const siSteam = createIcon(
  "Steam",
  "steam",
  "00ADEE",
  "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm-5 11 2.6.9a3.5 3.5 0 1 0 3.6-4.2l-.9-2.6A4.5 4.5 0 1 1 7 13Z"
);

export const siSteamdeck = createIcon(
  "Steam Deck",
  "steamdeck",
  "8B5CF6",
  "M5 7h14a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-2.5a3 3 0 0 1-2.7 2H10.2a3 3 0 0 1-2.7-2H5a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3Zm7-2a3 3 0 1 0 3 3 3 3 0 0 0-3-3Zm-5.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"
);

export const siLinux = createIcon(
  "Linux",
  "linux",
  "FCC624",
  "M12 2c2.3 0 3.5 1.9 3.5 4.1 0 1.1-.4 2.2-.4 3.2 0 1.6.7 2.7 1.5 4.1 1 1.8 1.9 4 .9 6-1 2-2.6 2.6-3.9 2.6-.8 0-1.4-.2-1.6-.2s-.8.2-1.6.2c-1.3 0-2.9-.6-3.9-2.6-1-2-.1-4.2.9-6 .8-1.4 1.5-2.5 1.5-4.1 0-1-.4-2-.4-3.2C8.5 3.9 9.7 2 12 2Zm-1.2 3.5a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Zm2.4 0a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z"
);

export const siApple = createIcon(
  "Apple",
  "apple",
  "A3AAAE",
  "M15.5 3c-.9 0-1.9.6-2.4 1.3-.5.6-.9 1.5-.8 2.3 1 .1 2-.5 2.6-1.2.5-.6.9-1.5.6-2.4Zm2.4 5.4c-1-.1-1.9.4-2.5.4-.7 0-1.7-.4-2.8-.4-2 0-4.2 1.2-5.2 3.3-1.8 3.3-.5 8.4 1.3 11 .9 1.3 2.1 2.8 3.6 2.7 1.4 0 1.9-.9 3.6-.9 1.7 0 2.1.9 3.6.9 1.5 0 2.5-1.3 3.4-2.6 1.1-1.5 1.5-3 1.5-3.1-.1 0-2.9-1.1-3-4.2-.1-2.6 2.1-3.8 2.2-3.9-1.2-1.7-3.1-1.9-3.7-2.1Z"
);
