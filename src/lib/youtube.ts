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
  const parsed = parseUrl(url);
  if (!parsed) return null;

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

/**
 * Frame shape the video should be shown in.
 *
 * A Shorts link is vertical by definition, so putting it in the 16:9 box the
 * rest of the site uses would letterbox it down to a thin strip with black
 * bars either side. Anything else — watch, youtu.be, embed, live — gets the
 * standard landscape frame.
 *
 * Limitation: a vertical video reached through a youtu.be or /watch URL looks
 * identical to a landscape one, so it stays 16:9. Only the /shorts/ path
 * carries the signal.
 */
export type VideoAspect = "16:9" | "9:16";

export function toAspect(url: string): VideoAspect {
  const parsed = parseUrl(url);
  if (!parsed) return "16:9";

  const host = parsed.hostname.toLowerCase();
  const isYouTube = /(^|\.)youtube\.com$/.test(host) || /(^|\.)youtube-nocookie\.com$/.test(host);

  return isYouTube && parsed.pathname.startsWith("/shorts/") ? "9:16" : "16:9";
}

/** Tolerate scheme-less pastes like "youtu.be/abc". */
function parseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    try {
      return new URL(`https://${url}`);
    } catch {
      return null;
    }
  }
}

/**
 * Thumbnail served by YouTube for a video id (works without an API key).
 *
 * The normalised `hqdefault` is always 480×360, which pillars a vertical
 * video inside black bars — so Shorts ask for `oardefault`, the video's true
 * aspect ratio. That file is not generated for every upload; callers must
 * fall back to `hqdefault` on error.
 */
export function toThumbnailUrl(videoId: string, aspect: VideoAspect = "16:9"): string {
  return aspect === "9:16"
    ? `https://i.ytimg.com/vi/${videoId}/oardefault.jpg`
    : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
