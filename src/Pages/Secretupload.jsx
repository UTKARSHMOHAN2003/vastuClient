import React, { useState, useEffect, useRef } from "react";
import { imageService, useImages } from "../services/api";

import GallerySection from "../Components/GallerySection";
import EditSection from "../Components/Editsection";
import AccessControlSection from "../Components/AcessControlSection";
import UploadSecret from "../Components/UploadSecret";

const SecretUpload = () => {
  const [categoryFilter, setCategoryFilter] = useState("");
  const {
    images,
    loading,
    error: imagesError,
    fetchImages,
  } = useImages({ category: categoryFilter });

  // Form and editing states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "unbuilt",
    project_id: "",
    files: [], // FIXED: Use 'files' instead of 'images'
  });
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentImageId, setCurrentImageId] = useState(null);
  const [editingMode, setEditingMode] = useState("project"); // "project" or "individual"
  const [projectImages, setProjectImages] = useState([]);
  const [editingImageIndex, setEditingImageIndex] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // UI states
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [viewMode, setViewMode] = useState("grouped");
  const [shareLink, setShareLink] = useState("");
  const [activeSection, setActiveSection] = useState("upload");
  const [modalConfig, setModalConfig] = useState(null);

  // Other states
  const [projects, setProjects] = useState([]);
  const shareLinkRef = useRef(null);
  const isDarkMode = true; // Permanent dark mode

  // Theme classes helper - permanent dark mode
  const themeClasses = {
    bg: "bg-gray-900",
    text: "text-gray-100",
    textSecondary: "text-gray-300",
    textMuted: "text-gray-400",
    border: "border-gray-700",
    shadow: "shadow-gray-900/20",
    cardBg: "bg-gray-800",
    cardBorder: "border-gray-700",
    hoverBg: "hover:bg-gray-700",
    buttonBg: "bg-gray-700",
    buttonBorder: "border-gray-600",
    buttonText: "text-gray-200",
    buttonHover: "hover:bg-gray-600",
    sidebarBg: "bg-gray-800",
    sidebarText: "text-gray-300",
    sidebarHover: "hover:bg-gray-700",
    sidebarActive: "bg-indigo-900 text-indigo-200",
  };

  // Fetch projects (mock data for now - replace with actual API call)
  useEffect(() => {
    setProjects([
      { id: 1, name: "Project 1" },
      { id: 2, name: "Project 2" },
      { id: 3, name: "Project 3" },
      { id: 4, name: "Project 4" },
      { id: 5, name: "Project 5" },
      { id: 6, name: "Project 6" },
      { id: 7, name: "Project 7" },
      { id: 8, name: "Project 8" },
      { id: 9, name: "Project 9" },
      { id: 10, name: "Project 10" },
      { id: 11, name: "Project 11" },
      { id: 12, name: "Project 12" },
      { id: 13, name: "Project 13" },
      { id: 14, name: "Project 14" },
      { id: 15, name: "Project 15" },
      { id: 16, name: "Project 16" },
      { id: 17, name: "Project 17" },
      { id: 18, name: "Project 18" },
      { id: 19, name: "Project 19" },
      { id: 20, name: "Project 20" },
      { id: 21, name: "Project 21" },
      { id: 22, name: "Project 22" },
      { id: 23, name: "Project 23" },
      { id: 24, name: "Project 24" },
    ]);
  }, []);

  // Group images by title
  const groupedImages = images.reduce((acc, img) => {
    if (!acc[img.title]) {
      acc[img.title] = [];
    }
    acc[img.title].push(img);
    return acc;
  }, {});

  // Handle form submission

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("category", formData.category);

      if (formData.project_id) {
        formDataToSend.append("project_id", formData.project_id);
      }

      if (isEditing) {
        // Update metadata
        await imageService.updateImage(currentImageId, {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          project_id: formData.project_id || null,
        });

        // Update image file if a new file was selected
        // FIXED: Check for 'files' instead of 'images'
        if (formData.files && formData.files.length > 0) {
          const imageFormData = new FormData();
          imageFormData.append("image", formData.files[0]);
          await imageService.updateImageFile(currentImageId, imageFormData);
        }

        setSuccessMessage("Image updated successfully!");
      } else {
        // FIXED: Check for 'files' instead of 'images'
        if (!formData.files || formData.files.length === 0) {
          throw new Error("Please select at least one file to upload");
        }

        // FIXED: Use 'files' instead of 'images'
        formData.files.forEach((file) => {
          formDataToSend.append("images", file); // API expects 'images' field name
        });

        const result = await imageService.createImage(formDataToSend);
        setSuccessMessage(
          `${result.images.length} file(s) uploaded successfully!`
        );
      }

      resetForm();
      fetchImages();
    } catch (err) {
      setError("Error: " + err.message);
      console.error("Error submitting form:", err);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChangeForEdit = (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 0) {
      setError(null);

      // Check file size limit (5MB per image)
      const maxSize = 5 * 1024 * 1024;
      const oversizedFiles = files.filter((file) => file.size > maxSize);

      if (oversizedFiles.length > 0) {
        setError(
          `Some files exceed 5MB limit: ${oversizedFiles
            .map((f) => f.name)
            .join(", ")}`
        );
        return;
      }

      // For editing mode, only allow single file selection
      setFormData({
        ...formData,
        files: [files[0]], // FIXED: Use 'files' instead of 'images'
      });

      // Generate preview URL for the single file
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls([reader.result]);
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleEdit = (image) => {
    setFormData({
      title: image.title,
      description: image.description || "",
      category: image.category || "unbuilt",
      project_id: image.project_id || "",
      files: [], // FIXED: Use 'files' instead of 'images'
    });
    setCurrentImageId(image.id);
    setIsEditing(true);
    setSelectedProject(null);
    setProjectImages([]);
    setEditingMode("individual");
    setEditingImageIndex(null);
    setPreviewUrls([
      imageService.getImageDataUrl(
        image.id,
        image.category === "secret" ? image.access_token : null
      ),
    ]);
    setActiveSection("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditProject = (title) => {
    const projectImages = groupedImages[title];
    if (projectImages && projectImages.length > 0) {
      const firstImage = projectImages[0];
      setFormData({
        title: firstImage.title,
        description: firstImage.description || "",
        category: firstImage.category || "unbuilt",
        project_id: firstImage.project_id || "",
        files: [], // FIXED: Use 'files' instead of 'images'
      });
      setCurrentImageId(firstImage.id);
      setIsEditing(true);
      setSelectedProject(title);
      setProjectImages(projectImages);
      setEditingMode("project");
      setEditingImageIndex(null);
      setActiveSection("edit");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleEditProjectImage = (image, index) => {
    setFormData({
      title: image.title,
      description: image.description || "",
      category: image.category || "unbuilt",
      project_id: image.project_id || "",
      files: [], // FIXED: Use 'files' instead of 'images'
    });
    setCurrentImageId(image.id);
    setIsEditing(true);
    setEditingMode("individual");
    setEditingImageIndex(index);
    setPreviewUrls([
      imageService.getImageDataUrl(
        image.id,
        image.category === "secret" ? image.access_token : null
      ),
    ]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle edit button click for individual image

  // Handle delete button click for a project (by title)
  const handleDeleteProject = async (title) => {
    const projectImages = groupedImages[title];
    if (projectImages && projectImages.length > 0) {
      setModalConfig({
        type: "delete",
        title: "Delete Project",
        message: `Are you sure you want to delete all ${projectImages.length} images in the "${title}" project?`,
        confirmText: "Delete Project",
        confirmAction: async () => {
          try {
            for (const image of projectImages) {
              await imageService.deleteImage(image.id);
            }
            setSuccessMessage(`Project "${title}" deleted successfully!`);
            fetchImages();
            setModalConfig(null);
          } catch (err) {
            setError("Error deleting project: " + err.message);
            console.error("Error deleting project:", err);
            setModalConfig(null);
          }
        },
        cancelAction: () => setModalConfig(null),
      });
    }
  };

  // Handle delete button click for individual image
  const handleDelete = async (id) => {
    setModalConfig({
      type: "delete",
      title: "Delete Image",
      message: "Are you sure you want to delete this image?",
      confirmText: "Delete Image",
      confirmAction: async () => {
        try {
          await imageService.deleteImage(id);
          setSuccessMessage("Image deleted successfully!");
          fetchImages();
          setModalConfig(null);
        } catch (err) {
          setError("Error deleting image: " + err.message);
          console.error("Error deleting image:", err);
          setModalConfig(null);
        }
      },
      cancelAction: () => setModalConfig(null),
    });
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "unbuilt",
      project_id: "",
      files: [], // FIXED: Use 'files' instead of 'images'
    });
    setPreviewUrls([]);
    setIsEditing(false);
    setCurrentImageId(null);
    setSelectedProject(null);
    setProjectImages([]);
    setEditingMode("project");
    setEditingImageIndex(null);
    setShareLink("");

    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  // Handle cancel for editing
  const handleCancel = () => {
    if (editingMode === "individual" && selectedProject) {
      setEditingMode("project");
      setEditingImageIndex(null);
    } else {
      resetForm();
    }
  };

  // Handle image selection for bulk operations
  const handleImageSelection = (id) => {
    setSelectedImages((prev) => {
      if (prev.includes(id)) {
        return prev.filter((imageId) => imageId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedImages.length === 0) {
      setError("Please select at least one image to delete");
      return;
    }

    setModalConfig({
      type: "delete",
      title: "Delete Selected Images",
      message: `Are you sure you want to delete ${selectedImages.length} selected images?`,
      confirmText: "Delete Images",
      confirmAction: async () => {
        try {
          for (const id of selectedImages) {
            await imageService.deleteImage(id);
          }

          setSuccessMessage(
            `${selectedImages.length} images deleted successfully!`
          );
          setSelectedImages([]);
          fetchImages();
          setModalConfig(null);
        } catch (err) {
          setError("Error deleting images: " + err.message);
          console.error("Error deleting images:", err);
          setModalConfig(null);
        }
      },
      cancelAction: () => setModalConfig(null),
    });
  };

  // Handle sharing a secret project
  const handleShareProject = (image) => {
    const baseUrl = window.location.origin;
    const shareableLink = `${baseUrl}/view-project/${image.id}?access_token=${image.access_token}`;
    setShareLink(shareableLink);
    setActiveSection("access");

    setTimeout(() => {
      if (shareLinkRef.current) {
        shareLinkRef.current.focus();
        shareLinkRef.current.select();
      }
    }, 100);
  };

  // Handle regenerating an access token
  const handleRegenerateToken = async (id) => {
    setModalConfig({
      type: "warning",
      title: "Regenerate Access Token",
      message:
        "Are you sure you want to regenerate the access token? This will invalidate any existing shared links.",
      confirmText: "Regenerate Token",
      confirmAction: async () => {
        try {
          const result = await imageService.regenerateAccessToken(id);
          setSuccessMessage("Access token regenerated successfully!");
          fetchImages();

          if (shareLink.includes(`/view-project/${id}?`)) {
            const baseUrl = window.location.origin;
            setShareLink(
              `${baseUrl}/view-project/${id}?access_token=${result.access_token}`
            );
          }
          setModalConfig(null);
        } catch (err) {
          setError("Error regenerating access token: " + err.message);
          console.error("Error regenerating access token:", err);
          setModalConfig(null);
        }
      },
      cancelAction: () => setModalConfig(null),
    });
  };

  // Handle revoking access
  const handleRevokeAccess = async (id) => {
    setModalConfig({
      type: "warning",
      title: "Revoke Access",
      message:
        "Are you sure you want to revoke access? Clients will no longer be able to view this project.",
      confirmText: "Revoke Access",
      confirmAction: async () => {
        try {
          await imageService.revokeAccess(id);
          setSuccessMessage("Access revoked successfully!");
          fetchImages();

          if (shareLink.includes(`/view-project/${id}?`)) {
            setShareLink("");
          }
          setModalConfig(null);
        } catch (err) {
          setError("Error revoking access: " + err.message);
          console.error("Error revoking access:", err);
          setModalConfig(null);
        }
      },
      cancelAction: () => setModalConfig(null),
    });
  };

  // Sidebar navigation items
  const sidebarItems = [
    {
      id: "upload",
      label: "Upload Images",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      ),
    },
    {
      id: "gallery",
      label: "Image Gallery",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      id: "edit",
      label: "Edit Images",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
    },
    {
      id: "access",
      label: "Access Secret",
      icon: (
        <svg
          className="w-5 h-5"
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
      ),
    },
  ];

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case "upload":
        return (
          <UploadSecret
            formData={formData}
            setFormData={setFormData}
            previewUrls={previewUrls}
            setPreviewUrls={setPreviewUrls}
            loading={loading}
            error={error}
            setError={setError}
            onSubmit={handleSubmit}
            projects={projects}
            isDarkMode={isDarkMode}
            themeClasses={themeClasses}
          />
        );

      case "gallery":
        return (
          <GallerySection
            images={images}
            loading={loading}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            viewMode={viewMode}
            setViewMode={setViewMode}
            selectedImages={selectedImages}
            handleImageSelection={handleImageSelection}
            handleBulkDelete={handleBulkDelete}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            handleEditProject={handleEditProject}
            handleDeleteProject={handleDeleteProject}
            projects={projects}
            imageService={imageService}
            isDarkMode={isDarkMode}
            themeClasses={themeClasses}
          />
        );

      case "edit":
        return (
          <EditSection
            isEditing={isEditing}
            editingMode={editingMode}
            setEditingMode={setEditingMode}
            selectedProject={selectedProject}
            editingImageIndex={editingImageIndex}
            formData={formData}
            handleInputChange={handleInputChange}
            handleFileChange={handleFileChangeForEdit}
            previewUrls={previewUrls}
            loading={loading}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            projects={projects}
            projectImages={projectImages}
            handleEditProjectImage={handleEditProjectImage}
            imageService={imageService}
            isDarkMode={isDarkMode}
            themeClasses={themeClasses}
          />
        );

      case "access":
        return (
          <AccessControlSection
            images={images}
            shareLink={shareLink}
            setShareLink={setShareLink}
            shareLinkRef={shareLinkRef}
            handleShareProject={handleShareProject}
            handleRegenerateToken={handleRegenerateToken}
            handleRevokeAccess={handleRevokeAccess}
            successMessage={successMessage}
            setSuccessMessage={setSuccessMessage}
            imageService={imageService}
            isDarkMode={isDarkMode}
            themeClasses={themeClasses}
          />
        );

      default:
        return null;
    }
  };

  // Custom Modal Component
  const CustomModal = ({ config, onClose }) => {
    if (!config) return null;

    const getModalStyles = () => {
      switch (config.type) {
        case "delete":
          return {
            icon: (
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-900/20">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            ),
            confirmButtonClass:
              "bg-red-600 hover:bg-red-700 focus:ring-red-500",
          };
        case "warning":
          return {
            icon: (
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-900/20">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            ),
            confirmButtonClass:
              "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
          };
        default:
          return {
            icon: (
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-900/20">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            ),
            confirmButtonClass:
              "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
          };
      }
    };

    const styles = getModalStyles();

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          {/* Background overlay */}
          <div
            className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
            onClick={onClose}
          ></div>

          {/* Modal panel */}
          <div className={`inline-block align-bottom ${themeClasses.cardBg} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full`}>
            <div className={`${themeClasses.cardBg} px-4 pt-5 pb-4 sm:p-6 sm:pb-4`}>
              <div className="sm:flex sm:items-start">
                {styles.icon}
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className={`text-lg leading-6 font-medium ${themeClasses.text}`}>
                    {config.title}
                  </h3>
                  <div className="mt-2">
                    <p className={`text-sm ${themeClasses.textMuted}`}>{config.message}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={config.confirmAction}
                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${styles.confirmButtonClass} focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm`}
              >
                {config.confirmText}
              </button>
              <button
                type="button"
                onClick={config.cancelAction}
                className={`mt-3 w-full inline-flex justify-center rounded-md border ${themeClasses.buttonBorder} shadow-sm px-4 py-2 ${themeClasses.buttonBg} text-base font-medium ${themeClasses.buttonText} ${themeClasses.buttonHover} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${themeClasses.bg} mt-16`}>
      {/* Custom Modal */}
      <CustomModal config={modalConfig} onClose={() => setModalConfig(null)} />

      <div className="flex">
        {/* Sidebar */}
        <div className={`w-64 ${themeClasses.sidebarBg} ${themeClasses.shadow} min-h-screen`}>
          <div className="p-6">
            <h1 className={`text-2xl font-bold ${themeClasses.text} mb-8`}>
              Secret Dashboard
            </h1>
            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === item.id
                      ? themeClasses.sidebarActive
                      : `${themeClasses.sidebarText} ${themeClasses.sidebarHover} hover:${themeClasses.text}`
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {/* Success message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-900/20 text-green-300 border border-green-700 rounded-md">
              {successMessage}
            </div>
          )}

          {/* Error message */}
          {(error || imagesError) && (
            <div className="mb-6 p-4 bg-red-900/20 text-red-300 border border-red-700 rounded-md">
              {error || imagesError}
            </div>
          )}

          {/* Render content based on active section */}
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SecretUpload;
