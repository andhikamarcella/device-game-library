export interface IgdbGenre {
  id: number;
  name?: string | null;
  slug?: string | null;
}

export interface IgdbTheme {
  id: number;
  name?: string | null;
  slug?: string | null;
}

export interface IgdbGameMode {
  id: number;
  name?: string | null;
  slug?: string | null;
}

export interface IgdbPlayerPerspective {
  id: number;
  name?: string | null;
  slug?: string | null;
}

export interface IgdbAgeRating {
  id: number;
  category?: number | null;
  rating?: number | null;
  synopsis?: string | null;
  rating_cover_url?: string | null;
}
