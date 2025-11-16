export interface TwitchAccessToken {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: TwitchAccessToken | null = null;

const getEnvOrThrow = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

export async function getTwitchAccessToken(): Promise<TwitchAccessToken> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken;
  }

  const clientId = getEnvOrThrow("TWITCH_CLIENT_ID");
  const clientSecret = getEnvOrThrow("TWITCH_CLIENT_SECRET");

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to retrieve Twitch token (${response.status})`);
  }

  const data = (await response.json()) as { access_token?: string; expires_in?: number };

  if (!data.access_token || typeof data.expires_in !== "number") {
    throw new Error("Invalid Twitch token response");
  }

  const expiresAt = now + Math.max(data.expires_in - 60, 60) * 1000;
  cachedToken = { accessToken: data.access_token, expiresAt };
  return cachedToken;
}
