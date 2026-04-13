export default function Loading() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="h-32 bg-gray-800" />
      <div className="flex flex-col lg:flex-row flex-1">
        <div className="h-56 lg:flex-1 bg-gray-200" />
        <div className="lg:w-96 p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
