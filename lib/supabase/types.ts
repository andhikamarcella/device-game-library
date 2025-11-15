export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      user_games: {
        Row: {
          id: string;
          user_id: string | null;
          rawg_id: number;
          slug: string;
          title: string;
          platforms: string[] | null;
          cover_image: string | null;
          released: string | null;
          rawg_rating: number | string | null;
          rawg_ratings_count: number | null;
          rawg_playtime: number | null;
          ownership:
            | "none"
            | "wishlist"
            | "owned_digital"
            | "owned_physical"
            | "emulator_only";
          status: "not_started" | "playing" | "beaten" | "completed" | "dropped";
          personal_rating: number | null;
          playtime_hours: number | null;
          last_played_at: string | null;
          notes: string | null;
          genres: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          rawg_id: number;
          slug: string;
          title: string;
          platforms?: string[] | null;
          cover_image?: string | null;
          released?: string | null;
          rawg_rating?: number | string | null;
          rawg_ratings_count?: number | null;
          rawg_playtime?: number | null;
          ownership?:
            | "none"
            | "wishlist"
            | "owned_digital"
            | "owned_physical"
            | "emulator_only";
          status?: "not_started" | "playing" | "beaten" | "completed" | "dropped";
          personal_rating?: number | null;
          playtime_hours?: number | null;
          last_played_at?: string | null;
          notes?: string | null;
          genres?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          rawg_id?: number;
          slug?: string;
          title?: string;
          platforms?: string[] | null;
          cover_image?: string | null;
          released?: string | null;
          rawg_rating?: number | string | null;
          rawg_ratings_count?: number | null;
          rawg_playtime?: number | null;
          ownership?:
            | "none"
            | "wishlist"
            | "owned_digital"
            | "owned_physical"
            | "emulator_only";
          status?: "not_started" | "playing" | "beaten" | "completed" | "dropped";
          personal_rating?: number | null;
          playtime_hours?: number | null;
          last_played_at?: string | null;
          notes?: string | null;
          genres?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      set_user_games_updated_at: {
        Args: Record<string, never>;
        Returns: unknown;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
};
