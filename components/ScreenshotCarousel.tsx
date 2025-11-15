export function ScreenshotCarousel({ images }: { images: string[] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-widest text-slate-500">Screenshots</p>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {images.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className="relative h-40 w-64 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-800"
          >
            <img src={src} alt="Screenshot" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
