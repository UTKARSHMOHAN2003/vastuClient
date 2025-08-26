import React, { useState, useEffect } from "react";

const UploadSecret = ({
  formData,
  setFormData,
  previewUrls,
  setPreviewUrls,
  loading,
  error,
  setError,
  onSubmit,
  projects,
  isDarkMode,
  themeClasses,
}) => {
  const [dragActive, setDragActive] = useState(false);

  // Set category to "secret" when component mounts
  useEffect(() => {
    if (formData.category !== "secret") {
      setFormData((prev) => ({
        ...prev,
        category: "secret",
      }));
    }
  }, []); // Run only on mount

  // Allowed file types (matching your backend)
  const allowedFileTypes = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg", // Added for compatibility
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "image/bmp": ".bmp", // Added
    "image/tiff": ".tiff", // Added
    "application/pdf": ".pdf",
    "text/csv": ".csv",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      ".xlsx",
    "application/octet-stream": "", // fallback
  };

  // Check if file is an image
  const isImageFile = (file) => {
    return file.type.startsWith("image/");
  };

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) {
      return "🖼️";
    } else if (fileType === "application/pdf") {
      return "📄";
    } else if (fileType === "text/csv") {
      return "📊";
    } else if (fileType.includes("excel") || fileType.includes("spreadsheet")) {
      return "📈";
    }
    return "📎";
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Prevent category from being changed from "secret"
    if (name === "category") {
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Validate files
  const validateFiles = (files) => {
    const errors = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 5;

    // Check total file count
    if (files.length > maxFiles) {
      errors.push(
        `Maximum ${maxFiles} files allowed. You selected ${files.length} files.`
      );
      return errors;
    }

    // Check existing files + new files
    const currentFileCount = formData.files?.length || 0;
    if (currentFileCount + files.length > maxFiles) {
      errors.push(
        `Adding ${files.length} files would exceed the ${maxFiles} file limit. You currently have ${currentFileCount} files selected.`
      );
      return errors;
    }

    // Check each file
    files.forEach((file, index) => {
      // Check file size
      if (file.size > maxSize) {
        errors.push(
          `File "${file.name}" exceeds 10MB limit (${(
            file.size /
            1024 /
            1024
          ).toFixed(2)}MB)`
        );
      }

      // Check file type
      const isValidMimeType = Object.keys(allowedFileTypes).includes(file.type);
      const hasValidExtension =
        /\.(jpe?g|png|gif|webp|svg|bmp|tiff?|pdf|csv|xlsx?|xls)$/i.test(
          file.name
        );

      if (!isValidMimeType && !hasValidExtension) {
        errors.push(`File "${file.name}" has unsupported type: ${file.type}`);
      }

      // Check for empty files
      if (file.size === 0) {
        errors.push(`File "${file.name}" is empty`);
      }
    });

    return errors;
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    // Clear any previous errors
    setError(null);

    // Validate files
    const validationErrors = validateFiles(files);
    if (validationErrors.length > 0) {
      setError(validationErrors.join(". "));
      return;
    }

    // Update form data with new files
    const existingFiles = formData.files || [];
    const allFiles = [...existingFiles, ...files];

    setFormData({
      ...formData,
      files: allFiles,
    });

    // Generate preview URLs
    generatePreviews(files);
  };

  // Generate preview URLs for files
  const generatePreviews = (files) => {
    const newPreviews = [];
    let processedCount = 0;

    files.forEach((file, index) => {
      if (isImageFile(file)) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews[index] = {
            url: reader.result,
            type: "image",
            name: file.name,
            size: file.size,
            fileType: file.type,
          };
          processedCount++;

          if (processedCount === files.length) {
            setPreviewUrls([...previewUrls, ...newPreviews.filter(Boolean)]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        // For non-image files
        newPreviews[index] = {
          url: null,
          type: "file",
          name: file.name,
          size: file.size,
          fileType: file.type,
        };
        processedCount++;

        if (processedCount === files.length) {
          setPreviewUrls([...previewUrls, ...newPreviews.filter(Boolean)]);
        }
      }
    });
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileChange({ target: { files } });
    }
  };

  // Remove single file from selection
  const removeFile = (index) => {
    const newFiles = [...(formData.files || [])];
    const newPreviewUrls = [...previewUrls];

    newFiles.splice(index, 1);
    newPreviewUrls.splice(index, 1);

    setFormData({
      ...formData,
      files: newFiles,
    });
    setPreviewUrls(newPreviewUrls);

    // Clear error if removing files resolves the issue
    if (newFiles.length <= 5) {
      setError(null);
    }
  };

  // Clear all files
  const clearAllFiles = () => {
    setFormData({
      ...formData,
      files: [],
    });
    setPreviewUrls([]);
    setError(null);

    // Reset file input
    const fileInput = document.getElementById("files");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    return (
      formData.title?.trim() &&
      formData.files?.length > 0 &&
      formData.files.length <= 5 &&
      !loading
    );
  };

  return (
    <div className={`${themeClasses.cardBg} shadow rounded-lg p-6`}>
      <h2 className={`text-xl font-medium ${themeClasses.text} mb-4`}>
        Upload Secret Files
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label
              htmlFor="title"
              className={`block text-sm font-medium ${themeClasses.text}`}
            >
              Title *
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="title"
                id="title"
                required
                value={formData.title || ""}
                onChange={handleInputChange}
                className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm ${themeClasses.border} rounded-md ${themeClasses.cardBg} ${themeClasses.text} placeholder-gray-400`}
                placeholder="Enter a title for your upload"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label
              htmlFor="category"
              className={`block text-sm font-medium ${themeClasses.text}`}
            >
              Category
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="category"
                value="secret"
                readOnly
                className={`shadow-sm block w-full sm:text-sm ${themeClasses.border} rounded-md bg-gray-700 cursor-not-allowed text-gray-400`}
              />
            </div>
            <p className={`mt-1 text-xs ${themeClasses.textMuted}`}>
              Secret files require access tokens to view
            </p>
          </div>

          <div className="sm:col-span-3">
            <label
              htmlFor="project_id"
              className={`block text-sm font-medium ${themeClasses.text}`}
            >
              Project ID
            </label>
            <div className="mt-1">
              <input
                type="number"
                id="project_id"
                name="project_id"
                value={formData.project_id || ""}
                onChange={handleInputChange}
                placeholder="Optional project ID"
                min="1"
                className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm ${themeClasses.border} rounded-md ${themeClasses.cardBg} ${themeClasses.text} placeholder-gray-400`}
              />
            </div>
            <p className={`mt-1 text-xs ${themeClasses.textMuted}`}>
              Leave empty if not associated with a project
            </p>
          </div>

          <div className="sm:col-span-6">
            <label
              htmlFor="description"
              className={`block text-sm font-medium ${themeClasses.text}`}
            >
              Description
            </label>
            <div className="mt-1">
              <textarea
                id="description"
                name="description"
                rows="3"
                value={formData.description || ""}
                onChange={handleInputChange}
                className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm ${themeClasses.border} rounded-md ${themeClasses.cardBg} ${themeClasses.text} placeholder-gray-400`}
                placeholder="Optional description for your files"
              />
            </div>
          </div>

          <div className="sm:col-span-6">
            <label
              htmlFor="files"
              className={`block text-sm font-medium ${themeClasses.text}`}
            >
              Files * (Maximum 5 files)
            </label>
            <div className="mt-1">
              <input
                type="file"
                id="files"
                name="files"
                accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.tiff,.pdf,.csv,.xls,.xlsx"
                onChange={handleFileChange}
                className="sr-only"
                multiple
              />

              {/* Drag and Drop Area */}
              <div
                className={`mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  dragActive
                    ? "border-indigo-400 bg-indigo-900/20"
                    : `${themeClasses.border} hover:border-indigo-400`
                }`}
                onClick={() => document.getElementById("files").click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-400">
                    <span className="relative cursor-pointer bg-gray-700 rounded-md font-medium text-indigo-400 hover:text-indigo-300">
                      Upload files
                    </span>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Images, PDF, CSV, Excel files up to 10MB each (Max: 5 files)
                  </p>
                </div>
              </div>

              {/* File Previews */}
              {previewUrls.length > 0 && (
                <div className="mt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className={`text-sm font-medium ${themeClasses.text}`}>
                      Selected Files ({previewUrls.length}/5)
                    </h4>
                    <button
                      type="button"
                      onClick={clearAllFiles}
                      className="text-xs text-red-400 hover:text-red-300 font-medium"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {previewUrls.map((item, index) => (
                      <div
                        key={index}
                        className={`relative border ${themeClasses.border} rounded-lg p-2 group hover:shadow-md transition-shadow`}
                      >
                        {item.type === "image" ? (
                          <div className="aspect-square overflow-hidden rounded-lg mb-2">
                            <img
                              src={item.url}
                              alt={`Preview ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="aspect-square flex items-center justify-center bg-gray-700 rounded-lg mb-2">
                            <div className="text-center">
                              <div className="text-2xl mb-1">
                                {getFileIcon(item.fileType)}
                              </div>
                              <div className="text-xs text-gray-400 uppercase font-medium">
                                {item.fileType?.split("/")[1]?.slice(0, 4) ||
                                  "FILE"}
                              </div>
                            </div>
                          </div>
                        )}

                        <div
                          className={`text-xs ${themeClasses.text} truncate font-medium mb-1`}
                          title={item.name}
                        >
                          {item.name}
                        </div>
                        <div className={`text-xs ${themeClasses.textMuted}`}>
                          {formatFileSize(item.size)}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove file"
                        >
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  {previewUrls.length > 5 && (
                    <div className="mt-3 p-3 bg-red-900/20 border border-red-700 rounded-lg">
                      <p className="text-xs text-red-300 font-medium">
                        Warning: You have selected {previewUrls.length} files,
                        but only 5 are allowed. Please remove{" "}
                        {previewUrls.length - 5} file(s).
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end">
          <button
            type="submit"
            disabled={!isFormValid()}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Uploading...
              </>
            ) : (
              `Upload ${formData.files?.length || 0} File${
                formData.files?.length !== 1 ? "s" : ""
              }`
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadSecret;
