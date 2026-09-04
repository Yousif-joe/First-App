// ---------------------------------------------------------------------------
// Category + keyword -> SharePoint tutorial video mapping.
//
// EDIT ME: this is the only place you need to touch to add real per-topic
// video links as you record them. Nothing else in the app needs to change.
//
// How matching works (see `getVideoForQuestion` below):
//   1. Look up the category id in CATEGORY_VIDEOS. If entries[] has a match
//      whose `keywords` appear in the admin's question (case-insensitive),
//      that specific video is shown.
//   2. Otherwise, fall back to that category's `default` video.
//   3. If the category itself has no entry yet, fall back to
///     FALLBACK_VIDEO (the whole training folder).
//
// For now every category just points at the shared training folder as its
// `default` — swap in the real per-video link whenever you have it, and
// start adding `entries` for specific workflows (e.g. "how do I mark a
// student excused" inside attendance).
// ---------------------------------------------------------------------------

export type VideoLink = {
  url: string;
  label: string;
};

export type CategoryVideoConfig = {
  /** Shown when no more specific keyword entry matches. */
  default: VideoLink;
  /** Optional, more specific videos matched by keyword within this category. */
  entries?: {
    keywords: string[];
    video: VideoLink;
  }[];
};

// The whole PowerSchool training folder in SharePoint — used as the
// fallback for every category until specific video links are filled in.
export const FALLBACK_VIDEO: VideoLink = {
  url: "https://alsamango.sharepoint.com/:f:/r/sites/systems/PowerSchool/Training/Power%20School%20Videos?d=wf2e148a472d1450fa992281b86fb8aea&csf=1&web=1&e=N1Z1Ra",
  label: "PowerSchool training video library",
};

export const CATEGORY_VIDEOS: Record<string, CategoryVideoConfig> = {
  admissions: {
    default: FALLBACK_VIDEO,
    entries: [
      // Example — replace with a real link when ready:
      // {
      //   keywords: ["application", "apply"],
      //   video: { url: "https://.../new-application.mp4", label: "Processing a new application" },
      // },
    ],
  },
  dropouts: { default: FALLBACK_VIDEO },
  behavior: { default: FALLBACK_VIDEO },
  attendance: {
    default: FALLBACK_VIDEO,
    entries: [
      // {
      //   keywords: ["excuse", "excused"],
      //   video: { url: "https://.../excused-absence.mp4", label: "Marking an excused absence" },
      // },
    ],
  },
  grades: { default: FALLBACK_VIDEO },
  enrollment: { default: FALLBACK_VIDEO },
  scheduling: { default: FALLBACK_VIDEO },
  reports: { default: FALLBACK_VIDEO },
  other: { default: FALLBACK_VIDEO },
};

/**
 * Picks the best-matching tutorial video for a category + free-text question.
 * Always returns something (falls back to the training folder) so the UI
 * can unconditionally show a "related video" card.
 */
export function getVideoForQuestion(
  category: string,
  question: string
): VideoLink {
  const config = CATEGORY_VIDEOS[category];
  if (!config) return FALLBACK_VIDEO;

  const lowerQuestion = question.toLowerCase();
  const match = config.entries?.find((entry) =>
    entry.keywords.some((kw) => lowerQuestion.includes(kw.toLowerCase()))
  );

  return match?.video ?? config.default;
}
