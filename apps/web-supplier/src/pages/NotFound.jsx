import { Link } from 'react-router-dom';
import { CompassIcon } from 'lucide-react';

export const NotFound = () => (
  <div className="flex flex-col gap-4 items-center justify-center min-h-[60vh] text-center text-dark">
    <div className="flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl text-primary">
      <CompassIcon size={28} />
    </div>
    <div>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-1 text-sm text-gray-500">The page you're looking for doesn't exist.</p>
    </div>
    <Link
      to="/"
      className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg shadow-sm bg-primary hover:bg-blue-800"
    >
      Back to Dashboard
    </Link>
  </div>
);
