const SkeletonCard = () => (
  <div className="card-skin p-4 flex items-center gap-6 animate-pulse">
    <div className="w-20 h-20 rounded-2xl bg-muted" />
    <div className="flex-1 space-y-3">
      <div className="h-3 w-24 bg-muted rounded-full" />
      <div className="h-5 w-48 bg-muted rounded-full" />
    </div>
    <div className="flex gap-3">
      <div className="h-6 w-14 bg-muted rounded-full" />
      <div className="h-6 w-14 bg-muted rounded-full" />
    </div>
  </div>
);

export default SkeletonCard;
