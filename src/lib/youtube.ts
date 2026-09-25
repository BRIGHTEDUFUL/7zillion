/**
 * YouTube URL helpers shared by the video facade in
 * `src/components/youtube-embed.tsx`.
 *
 * Kept outside the component so the conversions can be unit-tested — these
 * are the values a bad paste in the admin form would otherwise break:
 * watch URLs, short youtu.be URLs and embed URLs must all resolve to an
 * embed URL and a thumbnail that exists.
 */

/** Watch / short / embed URL → canonical `youtube.com/embed/ID`, or null. */
export function toEmbedUrl(url: string): string | null {
  const id = extractVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

/** Watch / short / embed URL → video id, or null when the URL is not YouTube. */
export function extractVideoId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // Tolerate scheme-less pastes like "youtu.be/abc" (the admin form's zod
    // validation rejects those, but rendering old rows should not break).
    try {
      parsed = new URL(`https://${url}`);
    } catch {
      return null;
    }
  }

  const host = parsed.hostname.toLowerCase();

  // https://youtu.be/VIDEO_ID (optionally with /extra/path or ?query)
  if (host === "youtu.be") {
    const id = parsed.pathname.split("/").filter(Boolean)[0];
    return id ?? null;
  }

  const isYouTube = /(^|\.)youtube\.com$/.test(host) || /(^|\.)youtube-nocookie\.com$/.test(host);
  if (!isYouTube) return null;

  // https://www.youtube.com/watch?v=VIDEO_ID (m./music. subdomains too)
  if (parsed.pathname === "/watch") {
    return parsed.searchParams.get("v") || null;
  }

  // /embed/ID, /shorts/ID, /live/ID, /v/ID — first path segment after the key
  const match = /^\/(embed|shorts|live|v)\/([^/?#]+)/.exec(parsed.pathname);
  return match?.[2] ?? null;
}

/** Thumbnail served by YouTube for a video id (works without an API key). */
export function toThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
