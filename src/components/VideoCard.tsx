import type { VideoLink } from "@/config/videoMapping";

export default function VideoCard({ video }: { video: VideoLink }) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4 transition hover:bg-brand-100"
    >
      <span className="text-2xl">📹</span>
      <span>
        <span className="block text-sm font-medium text-brand-900">
          Related tutorial video
        </span>
        <span className="block text-sm text-brand-700 underline">
          {video.label}
        </span>
      </span>
    </a>
  );
}
