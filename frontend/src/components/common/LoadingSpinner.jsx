export default function LoadingSpinner({ size = "md", label }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-4">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-surface-700 border-t-primary-500 animate-spin`}
      />
      {label && <p className="text-sm text-surface-400 font-medium animate-pulse">{label}</p>}
    </div>
  );
}
