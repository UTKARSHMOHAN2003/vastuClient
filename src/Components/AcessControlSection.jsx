import React, { useRef, useEffect, useState } from "react";

// Get the base URL for image data
const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:4000/api";

const AccessControlSection = ({
  images,
  shareLink,
  setShareLink,
  shareLinkRef,
  handleRegenerateToken,
  handleRevokeAccess,
  successMessage,
  setSuccessMessage,
  imageService,
  isDarkMode,
  themeClasses,
}) => {
  // Add error boundary for image loading
  const [imageLoadErrors, setImageLoadErrors] = useState({});

  // Filter secret images and add error handling
  const secretImages = images.filter((img) => img.category === "secret");

  const handleImageError = (imageId) => {
    setImageLoadErrors((prev) => ({
      ...prev,
      [imageId]: true,
    }));
  };

  // Group secret images by project_id
  const groupedSecretImages = secretImages.reduce((acc, img) => {
    const projectId = img.project_id || "no-project"; // Handle cases where project_id is null/undefined
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(img);
    return acc;
  }, {});

  // Convert to array for rendering
  const projectsById = Object.entries(groupedSecretImages);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setSuccessMessage("Link copied to clipboard!");
  };

  // Add this function within AccessControlSection component
  const handleShareProject = async (representativeImage) => {
    try {
      // First, regenerate access token if needed
      const tokenResponse = await fetch(
        `${BASE_URL}/images/${representativeImage.id}/regenerate-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!tokenResponse.ok) {
        throw new Error("Failed to generate access token");
      }

      const { access_token } = await tokenResponse.json();

      // Create shareable link with the new token
      const shareableLink = `${window.location.origin}/view-project/${representativeImage.id}?access_token=${access_token}`;
      setShareLink(shareableLink);
      setSuccessMessage("Share link generated successfully!");

      console.log("Generated share link:", shareableLink);
    } catch (error) {
      console.error("Error generating share link:", error);
      setSuccessMessage("Error generating share link. Please try again.");
    }
  };

  return (
    <div className={`${themeClasses.cardBg} shadow rounded-lg p-6`}>
      <h2 className={`text-xl font-medium ${themeClasses.text} mb-4`}>
        Access Secret & Sharing
      </h2>

      {shareLink ? (
        <div className={`p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-md`}>
          <h3 className={`text-sm font-medium ${themeClasses.text} mb-2`}>
            Shareable Link:
          </h3>
          <div className="flex">
            <input
              ref={shareLinkRef}
              type="text"
              value={shareLink}
              readOnly
              className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm ${themeClasses.border} rounded-l-md ${themeClasses.cardBg} ${themeClasses.text}`}
            />
            <button
              type="button"
              onClick={copyToClipboard}
              className={`inline-flex items-center px-4 py-2 border border-l-0 ${themeClasses.border} text-sm font-medium rounded-r-md ${themeClasses.buttonText} ${themeClasses.buttonBg} ${themeClasses.buttonHover} focus:outline-none`}
            >
              Copy
            </button>
          </div>
          <p className={`mt-1 text-xs ${themeClasses.textMuted}`}>
            Share this link with your client. They will be able to view the
            project without needing to log in.
          </p>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className={`${themeClasses.textMuted}`}>
            No active share link. Use the "Share Link" button on any secret
            project to generate a shareable link.
          </p>
        </div>
      )}

      <div className="mt-8">
        <h3 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>
          Secret Projects
        </h3>

        {projectsById.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectsById.map(([projectId, groupImages]) => {
              const representativeImage = groupImages[0]; // Use the first image as the representative
              return (
                <div
                  key={projectId}
                  className={`group relative ${themeClasses.cardBg} rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border ${themeClasses.border}`}
                >
                  {/* Card Header with Image */}
                  <div className={`relative h-48 ${isDarkMode ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-indigo-50 to-purple-50'}`}>
                    {!imageLoadErrors[representativeImage.id] ? (
                      <img
                        src={imageService.getImageDataUrl(
                          representativeImage.id,
                          representativeImage.access_token
                        )}
                        alt={representativeImage.title}
                        onError={() => handleImageError(representativeImage.id)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className={`${themeClasses.textMuted}`}>
                          Image not available
                        </span>
                      </div>
                    )}
                    {/* Overlay with project info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                      <div className="absolute bottom-4 left-4 right-4">
                        <h4 className="text-lg font-bold text-white mb-1 truncate">
                          {representativeImage.title}
                        </h4>
                        <p className="text-sm text-gray-200">
                          Project #
                          {projectId === "no-project" ? "N/A" : projectId}
                        </p>
                      </div>
                    </div>
                    {/* Secret Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${isDarkMode ? 'bg-purple-900/50 text-purple-200 border border-purple-700' : 'bg-purple-100 text-purple-800 border border-purple-200'}`}>
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Secret
                      </span>
                    </div>
                    {/* Image Count Badge */}
                    {groupImages.length > 1 && (
                      <div className={`absolute top-4 left-4 ${isDarkMode ? 'bg-gray-800 bg-opacity-75' : 'bg-white bg-opacity-75'} rounded-full w-8 h-8 flex items-center justify-center`}>
                        <span className={`text-xs font-medium ${themeClasses.text}`}>
                          +{groupImages.length - 1}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    {/* Project Details */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${themeClasses.textSecondary}`}>
                          Status
                        </span>
                        <span className={`text-xs px-2 py-1 ${isDarkMode ? 'bg-green-900/50 text-green-200' : 'bg-green-100 text-green-800'} rounded-full font-medium`}>
                          Active
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${themeClasses.textSecondary}`}>
                          Access Type
                        </span>
                        <span className={`text-xs px-2 py-1 ${isDarkMode ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-800'} rounded-full font-medium`}>
                          Token-based
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <button
                        onClick={() => handleShareProject(representativeImage)}
                        className="w-full flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                          />
                        </svg>
                        Share Link
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() =>
                            handleRegenerateToken(representativeImage.id)
                          }
                          className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-semibold rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                        >
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          New Token
                        </button>
                        <button
                          onClick={() =>
                            handleRevokeAccess(representativeImage.id)
                          }
                          className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-semibold rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                        >
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636"
                            />
                          </svg>
                          Revoke
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/0 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <div className={`mx-auto w-24 h-24 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-full flex items-center justify-center mb-4`}>
              <svg
                className={`w-12 h-12 ${themeClasses.textMuted}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className={`text-lg font-medium ${themeClasses.text} mb-2`}>
              No Secret Projects
            </h3>
            <p className={`${themeClasses.textMuted}`}>
              Create secret projects to enable secure sharing with clients.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessControlSection;
