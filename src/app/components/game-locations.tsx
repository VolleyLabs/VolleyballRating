"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "@context/telegram-context";
import {
  GameLocation,
  createGameLocation,
  deleteGameLocation,
  getGameLocations,
  updateGameLocation,
} from "../lib/supabase-queries";
import LocationsSkeleton from "./locations-skeleton";

export default function GameLocations() {
  const { theme, isAdmin } = useTelegram();
  const [locations, setLocations] = useState<GameLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GameLocation | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    google_link: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const data = await getGameLocations();
      setLocations(data);
    } catch (err) {
      console.error("Error fetching locations:", err);
      setError("Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setCurrentLocation(null);
    setFormData({
      name: "",
      address: "",
      google_link: "",
    });
    setIsFormOpen(true);
  };

  const openEditForm = (location: GameLocation) => {
    setCurrentLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      google_link: location.google_link,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setError("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (!formData.name || !formData.address || !formData.google_link) {
        setError("All fields are required");
        return;
      }

      if (currentLocation) {
        // Update existing location
        await updateGameLocation({
          id: currentLocation.id,
          ...formData,
        });
      } else {
        // Create new location
        await createGameLocation(formData);
      }

      // Refresh locations and close form
      await fetchLocations();
      closeForm();
    } catch (err) {
      console.error("Error saving location:", err);
      setError("Failed to save location");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;

    try {
      await deleteGameLocation(id);
      await fetchLocations();
    } catch (err) {
      console.error("Error deleting location:", err);
      setError("Failed to delete location");
    }
  };

  const openGoogleMaps = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className={`flex-1 p-4 overflow-auto ${theme.text}`}>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-2xl font-bold ${theme.text}`}>Game Locations</h1>
          {isAdmin && (
            <button
              onClick={openAddForm}
              className={`${theme.primaryButton} px-4 py-2 rounded-lg flex items-center`}
              style={theme.primaryButtonStyle}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Location
            </button>
          )}
        </div>

        {loading ? (
          <LocationsSkeleton />
        ) : locations.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">
              No locations found
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {locations.map((location) => (
              <div
                key={location.id}
                className={`rounded-lg border ${theme.border} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}
                style={theme.borderStyle}
              >
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">
                    {location.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {location.address}
                  </p>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => openGoogleMaps(location.google_link)}
                      className={`text-blue-500 hover:text-blue-700 text-sm flex items-center`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                      Open in Maps
                    </button>
                    {isAdmin && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditForm(location)}
                          className="text-gray-500 hover:text-green-600 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(location.id)}
                          className="text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6 ${theme.bg}`}
            >
              <h2 className="text-xl font-bold mb-4">
                {currentLocation ? "Edit Location" : "Add New Location"}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg ${theme.border} ${theme.bg} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Location name"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg ${theme.border} ${theme.bg} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Full address"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Google Maps Link
                  </label>
                  <input
                    type="text"
                    name="google_link"
                    value={formData.google_link}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg ${theme.border} ${theme.bg} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="https://maps.app.goo.gl/..."
                  />
                </div>

                {error && (
                  <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeForm}
                    className={`px-4 py-2 border ${theme.border} rounded-lg`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`${theme.primaryButton} px-4 py-2 rounded-lg`}
                    style={theme.primaryButtonStyle}
                  >
                    {currentLocation ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
