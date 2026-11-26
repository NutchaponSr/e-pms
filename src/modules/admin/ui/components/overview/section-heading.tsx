export function SectionHeading({
  title,
  description,
  aside,
}: {
  title: string;
  description?: string;
  aside?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3 px-1">
      <div>
        <h2 className="text-sm font-medium text-primary">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-tertiary">{description}</p>
        )}
      </div>
      {aside && <p className="shrink-0 text-xs text-secondary">{aside}</p>}
    </div>
  );
}
