import React, { useEffect, useState } from "react";
import { getScreenshots } from "../../../services/authService";

// Types
interface User {
  _id: string;
  firstName: string;
  lastName?: string;
  email?: string;
}

interface Screenshot {
  _id: string;
  userid?: User;
  image: string;
  createdAt: string;
}

const ScreenShort: React.FC = () => {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // pagination state
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(6);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchScreenshots = async () => {
    try {
      setLoading(true);
      const response:any = await getScreenshots(page, limit);
      if (response?.data) {
        setScreenshots(response.data);
        setTotalPages(response.pages);
      }
    } catch (err) {
      setError("Failed to fetch screenshots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreenshots();
  }, [page, limit]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📸 Screenshots</h2>

      {loading && (
        <p className="text-gray-600 animate-pulse">Loading screenshots...</p>
      )}
      {error && <p className="text-red-600 font-medium">{error}</p>}

      {/* Grid of screenshots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {screenshots.map((shot) => (
          <div
            key={shot._id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <img
              src={`${process.env.REACT_APP_IMAGE_URL}${shot.image}`}
              alt="Screenshot"
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <p className="font-semibold text-gray-800">
                👤 {shot.userid?.firstName || "Unknown User"}
              </p>
              <p className="text-sm text-gray-500">
                Uploaded: {new Date(shot.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {!loading && screenshots.length === 0 && (
        <div className="mt-10 text-center text-gray-500">
          No screenshots available.
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-100 transition"
        >
          ⬅ Prev
        </button>
        <span className="text-gray-700 font-medium">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-100 transition"
        >
          Next ➡
        </button>
      </div>
    </div>
  );
};

export default ScreenShort;
