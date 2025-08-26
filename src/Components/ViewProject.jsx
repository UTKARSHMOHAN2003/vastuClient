import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";

const ViewProject = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const accessToken = searchParams.get("access_token");
  const navigate = useNavigate();

  const [currentFile, setCurrentFile] = useState(null);
  const [projectFiles, setProjectFiles] = useState([]);
  const [projectInfo, setProjectInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!id || !accessToken) {
        setError("Invalid link or access token");
        setLoading(false);
        return;
      }

      try {
        // First verify if this is a valid shared project
        const verifyResponse = await fetch(
          `http://localhost:4000/api/images/${id}?access_token=${accessToken}`
        );

        if (!verifyResponse.ok) {
          throw new Error("Invalid access token");
        }

        const projectData = await verifyResponse.json();

        // Only allow access if the project is shared (has access_token)
        if (!projectData.access_token) {
          throw new Error("This project is not currently shared");
        }

        // Now fetch all related files in the project
        const projectFiles = await fetch(
          `http://localhost:4000/api/images?project_id=${projectData.project_id}&access_token=${accessToken}`
        ).then((res) => res.json());

        setProjectFiles(projectFiles);
        setCurrentFile(projectData);
        setProjectInfo({
          project_id: projectData.project_id,
          title: projectData.title,
          description: projectData.description,
          category: projectData.category,
          totalFiles: projectFiles.length,
        });

        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        setError(
          error.message ||
            "Access denied. This link may have expired or been revoked."
        );
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [id, accessToken]);

  // Enhanced file type detection
  const getFileType = (filename, contentType) => {
    console.log("Detecting file type for:", filename, contentType);

    // First try MIME type
    if (contentType) {
      if (contentType.startsWith("image/")) return "image";
      if (contentType === "application/pdf") return "pdf";
      if (contentType === "text/csv" || contentType === "application/csv")
        return "csv";
      if (
        contentType.includes("spreadsheet") ||
        contentType.includes("excel") ||
        contentType ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        contentType === "application/vnd.ms-excel"
      )
        return "excel";
    }

    // Fallback to filename extension
    if (!filename) return "unknown";
    const extension = filename.toLowerCase().split(".").pop();

    if (
      ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff"].includes(
        extension
      )
    ) {
      return "image";
    } else if (extension === "pdf") {
      return "pdf";
    } else if (["csv"].includes(extension)) {
      return "csv";
    } else if (["xls", "xlsx", "xlsm"].includes(extension)) {
      return "excel";
    }

    return "unknown";
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case "image":
        return "🖼️";
      case "pdf":
        return "📄";
      case "csv":
        return "📊";
      case "excel":
        return "📈";
      default:
        return "📎";
    }
  };

  const getFileTypeName = (fileType) => {
    switch (fileType) {
      case "pdf":
        return "PDF Document";
      case "csv":
        return "CSV File";
      case "excel":
        return "Excel Spreadsheet";
      case "image":
        return "Image";
      default:
        return "File";
    }
  };

  // Enhanced FileViewer component
  const FileViewer = ({ file, accessToken, isMain = false }) => {
    const [imageError, setImageError] = useState(false);
    const fileType = getFileType(
      file.filename || file.title,
      file.content_type
    );
    const fileUrl = `http://localhost:4000/api/images/${file.id}/data?access_token=${accessToken}`;

    const containerClasses = isMain
      ? "border-t border-gray-200 p-6"
      : "w-full h-48 flex items-center justify-center bg-gray-50 rounded-t-lg";

    const handleImageError = () => {
      console.log("Image error for file:", file.title);
      setImageError(true);
    };

    switch (fileType) {
      case "image":
        if (imageError) {
          return (
            <div className={containerClasses}>
              <div className="text-center">
                <div className="text-4xl mb-2">🖼️</div>
                <div className="text-sm font-medium text-gray-500">
                  Image unavailable
                </div>
                <a
                  href={fileUrl}
                  download={file.filename || file.title}
                  className="mt-2 inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                >
                  Download instead
                </a>
              </div>
            </div>
          );
        }

        return (
          <div className={isMain ? "border-t border-gray-200" : ""}>
            <img
              src={fileUrl}
              alt={file.title}
              onError={handleImageError}
              className={
                isMain
                  ? "w-full h-auto object-contain max-h-[80vh]"
                  : "w-full h-48 object-cover rounded-t-lg"
              }
            />
          </div>
        );

      case "pdf":
        return (
          <div className={containerClasses}>
            {isMain ? (
              <div className="text-center">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  PDF Document
                </h3>
                <div className="space-y-3">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                  >
                    View PDF
                  </a>
                  <a
                    href={fileUrl}
                    download={file.filename || file.title}
                    className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    Download
                  </a>
                </div>
                <div className="mt-4">
                  <iframe
                    src={fileUrl}
                    className="w-full h-[500px] border border-gray-300 rounded"
                    title={file.title}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-2">📄</div>
                <div className="text-sm font-medium text-gray-700">PDF</div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className={containerClasses}>
            {isMain ? (
              <div className="text-center">
                <div className="text-6xl mb-4">{getFileIcon(fileType)}</div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {getFileTypeName(fileType)}
                </h3>
                <a
                  href={fileUrl}
                  download={file.filename || file.title}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none"
                >
                  Download {getFileTypeName(fileType)}
                </a>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-2">{getFileIcon(fileType)}</div>
                <div className="text-sm font-medium text-gray-700">
                  {getFileTypeName(fileType)}
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="mt-3 text-lg font-medium text-red-800">{error}</h3>
          <div className="mt-4">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentFile || !projectInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-gray-500">No project found</p>
        </div>
      </div>
    );
  }

  const currentFileType = getFileType(
    currentFile.filename || currentFile.title,
    currentFile.content_type
  );

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-6xl mx-auto">
        {/* Project Header */}
        <div className="mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-gray-900">
                  {projectInfo.project_id
                    ? `Project ${projectInfo.project_id}`
                    : projectInfo.title}
                </h1>
                <div className="mt-2 flex items-center space-x-4 flex-wrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {projectInfo.category}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {projectInfo.totalFiles} file
                    {projectInfo.totalFiles !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
            {projectInfo.description && (
              <p className="mt-4 text-gray-600">{projectInfo.description}</p>
            )}
          </div>
        </div>

        {/* Current File Display */}
        <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-gray-900 truncate">
                  {currentFile.title}
                </h2>
                <div className="mt-1 flex items-center space-x-2 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Currently Viewing
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {getFileTypeName(currentFileType)}
                  </span>
                  {currentFile.filename && (
                    <span className="text-sm text-gray-500 truncate">
                      {currentFile.filename}
                    </span>
                  )}
                  {currentFile.content_type && (
                    <span className="text-xs text-gray-400">
                      {currentFile.content_type}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-4xl ml-4 flex-shrink-0">
                {getFileIcon(currentFileType)}
              </div>
            </div>
          </div>

          <FileViewer
            file={currentFile}
            accessToken={accessToken}
            isMain={true}
          />
        </div>

        {/* All Project Files */}
        {projectFiles.length > 1 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                All Files in This Project ({projectFiles.length})
              </h2>
              <span className="text-sm text-gray-500">
                Click on any file to view it in detail
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projectFiles.map((file) => {
                const fileType = getFileType(
                  file.filename || file.title,
                  file.content_type
                );
                const isCurrentFile = file.id === parseInt(id);

                return (
                  <div
                    key={file.id}
                    className={`bg-white rounded-lg shadow overflow-hidden transition-all hover:shadow-lg ${
                      isCurrentFile
                        ? "ring-2 ring-blue-500 ring-opacity-50"
                        : ""
                    }`}
                  >
                    <FileViewer
                      file={file}
                      accessToken={accessToken}
                      isMain={false}
                    />

                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-900 truncate flex-1 mr-2">
                          {file.title}
                          {isCurrentFile && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Current
                            </span>
                          )}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {getFileTypeName(fileType)}
                        </span>
                        <span className="text-xs text-gray-500">
                          ID: {file.id}
                        </span>
                      </div>

                      {file.filename && (
                        <p
                          className="text-xs text-gray-400 truncate mb-2"
                          title={file.filename}
                        >
                          {file.filename}
                        </p>
                      )}

                      {file.content_type && (
                        <p className="text-xs text-gray-400 mb-3">
                          {file.content_type}
                        </p>
                      )}

                      <div className="flex items-center justify-center">
                        <a
                          href={`http://localhost:4000/api/images/${file.id}/data?access_token=${accessToken}`}
                          download={file.filename || file.title}
                          className="w-full inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
                          title="Download file"
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
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default ViewProject;
