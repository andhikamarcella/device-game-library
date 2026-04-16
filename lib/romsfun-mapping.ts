export const romsfunPlatformMap: Record<string, string> = {
  // Nintendo – full platform names
  "Nintendo Entertainment System": "nintendo-entertainment-system",
  "Super Nintendo Entertainment System": "super-nintendo",
  "Nintendo 64": "nintendo-64",
  "Nintendo GameCube": "nintendo-gamecube",

  "Game Boy": "game-boy",
  "Game Boy Color": "game-boy-color",
  "Game Boy Advance": "game-boy-advance",

  "Nintendo DS": "nintendo-ds",
  "Nintendo 3DS": "nintendo-3ds",

  // Sega
  "Sega Genesis": "sega-genesis",
  "Sega Mega Drive": "sega-mega-drive",
  "Sega Master System": "sega-master-system",
  "Sega Game Gear": "sega-game-gear",
  "Sega Saturn": "sega-saturn",
  "Sega Dreamcast": "sega-dreamcast",

  // PlayStation – full ROMsFun format
  "PlayStation": "playstation", // PS1
  "Sony PlayStation": "playstation", // alias PS1
  "PlayStation 2": "playstation-2",
  "PlayStation 3": "playstation-3",
  "PlayStation Portable": "playstation-portable",
  "PSP": "playstation-portable",

  // Atari
  "Atari 2600": "atari-2600",
  "Atari 5200": "atari-5200",
  "Atari 7800": "atari-7800",
  "Atari Jaguar": "atari-jaguar",
  "Atari Lynx": "atari-lynx",

  // Misc
  "3DO Interactive Multiplayer": "3do",
  "Neo Geo": "neo-geo",
  "TurboGrafx-16": "turbografx-16",
  "PC Engine": "pc-engine",

  // → fallback if platform unsupported
  default: "",
};
