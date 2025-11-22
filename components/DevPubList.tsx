"use client";

interface DevPubListProps {
  title: string;
  items?: string[] | null;
}

export default function DevPubList({ title, items }: DevPubListProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-200">{title}</h3>

      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <span
            key={idx}
            className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
