import React, { useState, useEffect, useRef } from "react";
import { imageService, useImages } from "../services/api";
import { useNavigate } from "react-router-dom";
import UploadSection from "../Components/Uploadsection";
import GallerySection from "../Components/GallerySection";
import EditSection from "../Components/Editsection";
import AccessControlSection from "../Components/AcessControlSection";

const AdminPage = () => {
  const navigate = useNavigate();
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
    images: [],
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
        if (formData.images && formData.images.length > 0) {
          const imageFormData = new FormData();
          imageFormData.append("image", formData.images[0]);
          await imageService.updateImageFile(currentImageId, imageFormData);
        }

        setSuccessMessage("Image updated successfully!");
      } else {
        if (!formData.images || formData.images.length === 0) {
          throw new Error("Please select at least one image to upload");
        }

        formData.images.forEach((image) => {
          formDataToSend.append("images", image);
        });

        const result = await imageService.createImage(formDataToSend);
        setSuccessMessage(
          `${result.images.length} image(s) uploaded successfully!`
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

  // Handle image file selection for editing
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
        images: [files[0]], // Only take the first file for editing
      });

      // Generate preview URL for the single file
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls([reader.result]);
      };
      reader.readAsDataURL(files[0]);
    }
  };

  // Handle edit button click for a project (by title)
  const handleEditProject = (title) => {
    const projectImages = groupedImages[title];
    if (projectImages && projectImages.length > 0) {
      const firstImage = projectImages[0];
      setFormData({
        title: firstImage.title,
        description: firstImage.description || "",
        category: firstImage.category || "unbuilt",
        project_id: firstImage.project_id || "",
        images: [],
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

  // Handle edit button click for individual image
  const handleEdit = (image) => {
    setFormData({
      title: image.title,
      description: image.description || "",
      category: image.category || "unbuilt",
      project_id: image.project_id || "",
      images: [],
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

  // Handle edit individual image within a project
  const handleEditProjectImage = (image, index) => {
    setFormData({
      title: image.title,
      description: image.description || "",
      category: image.category || "unbuilt",
      project_id: image.project_id || "",
      images: [],
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
      images: [],
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
      label: "Secret control",
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
          <UploadSection
            formData={formData}
            setFormData={setFormData}
            previewUrls={previewUrls}
            setPreviewUrls={setPreviewUrls}
            loading={loading}
            error={error}
            setError={setError}
            onSubmit={handleSubmit}
            projects={projects}
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
          />
        );

                           case "access":
          return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
              {/* Header Section */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-6">
                  <svg
                    className="w-10 h-10 text-indigo-600"
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
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Secret Control Dashboard
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Manage your secret projects and control access to sensitive content. 
                  Navigate to the dedicated secret dashboard for advanced security features.
                </p>
              </div>

              

              {/* Bottom Section */}
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Ready to Manage Your Secret Projects?
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Access the full secret dashboard to manage access tokens, share secure links, 
                    and control who can view your confidential projects.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => navigate("/secret")}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      Launch Secret Dashboard
                    </button>
                    <button
                      onClick={() => setActiveSection("gallery")}
                      className="bg-gray-100 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200 border border-gray-300 flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      View Image Gallery
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
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
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
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
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
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
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={onClose}
          ></div>

          {/* Modal panel */}
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                {styles.icon}
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {config.title}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">{config.message}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
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
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
    <div className="min-h-screen bg-gray-50 mt-16">
      {/* Custom Modal */}
      <CustomModal config={modalConfig} onClose={() => setModalConfig(null)} />

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">
              Admin Dashboard
            </h1>
            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === item.id
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
            <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md">
              {successMessage}
            </div>
          )}

          {/* Error message */}
          {(error || imagesError) && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
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

export default AdminPage;
