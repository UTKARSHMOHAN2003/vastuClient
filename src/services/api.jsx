import { useState, useEffect } from "react";

// Base API URL - uses environment variable with fallback to localhost for development
const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:4000/api";

// Image API endpoints
export const API_ENDPOINTS = {
  IMAGES: `${BASE_URL}/images`,
  IMAGE_BY_ID: (id) => `${BASE_URL}/images/${id}`,
  IMAGE_DATA: (id) => `${BASE_URL}/images/${id}/data`,
  IMAGE_FILE: (id) => `${BASE_URL}/images/${id}/file`,
  REGENERATE_TOKEN: (id) => `${BASE_URL}/images/${id}/regenerate-token`,
  REVOKE_ACCESS: (id) => `${BASE_URL}/images/${id}/revoke-access`,
};

// Generic fetch function with enhanced error handling
const fetchAPI = async (url, options = {}) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const token = localStorage.getItem("authToken");
    const headers = {
      ...options.headers,
    };

    // Only set Content-Type for JSON requests, not for FormData
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.message ||
          `HTTP error! Status: ${response.status} - ${response.statusText}`;
      } catch (e) {
        // If we can't parse the error as JSON, use a generic message
        errorMessage = `HTTP error! Status: ${response.status} - ${response.statusText}`;
      }

      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        errorMessage,
      });

      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    // Handle specific error types
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    } else if (error.message.includes("Failed to fetch")) {
      throw new Error(
        "Network error. Please check your connection and try again."
      );
    }

    console.error("API request failed:", error);
    throw error;
  }
};

// Image API service
export const imageService = {
  // Get all images
  getAllImages: (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.category) queryParams.append("category", filters.category);
    if (filters.project_id)
      queryParams.append("project_id", filters.project_id);
    if (filters.title) queryParams.append("title", filters.title);

    const url = `${API_ENDPOINTS.IMAGES}?${queryParams.toString()}`;
    return fetchAPI(url);
  },

  // Get images by title
  getImagesByTitle: (title) => {
    return imageService.getAllImages({ title });
  },

  // Get image by ID
  getImageById: (id) => fetchAPI(API_ENDPOINTS.IMAGE_BY_ID(id)),

  // Get image data URL
  getImageDataUrl: (id, accessToken) => {
    const params = new URLSearchParams();
    if (accessToken) params.append("access_token", accessToken);

    const url = API_ENDPOINTS.IMAGE_DATA(id);
    return `${url}?${params.toString()}`;
  },

  // Create new image(s)
  createImage: (formData) =>
    fetchAPI(API_ENDPOINTS.IMAGES, {
      method: "POST",
      body: formData,
      // No Content-Type header as FormData sets it automatically with boundary
    }),

  // Update image metadata
  updateImage: (id, data) =>
    fetchAPI(API_ENDPOINTS.IMAGE_BY_ID(id), {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Update image file
  updateImageFile: (id, formData) =>
    fetchAPI(API_ENDPOINTS.IMAGE_FILE(id), {
      method: "PUT",
      body: formData,
      // No Content-Type header as FormData sets it automatically with boundary
    }),

  // Delete image
  deleteImage: (id) =>
    fetchAPI(API_ENDPOINTS.IMAGE_BY_ID(id), {
      method: "DELETE",
    }),

  // Regenerate access token for a secret project
  regenerateAccessToken: (id) =>
    fetchAPI(API_ENDPOINTS.REGENERATE_TOKEN(id), {
      method: "POST",
    }),

  // Revoke access to a secret project
  revokeAccess: (id) =>
    fetchAPI(API_ENDPOINTS.REVOKE_ACCESS(id), {
      method: "POST",
    }),
};

// Custom hook for fetching images
export const useImages = (filters = {}) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const data = await imageService.getAllImages(filters);
      console.log("Fetched images:", data); // Debug log
      setImages(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching images:", err);
      setError("Failed to fetch images. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Refetch images when filters change
  useEffect(() => {
    fetchImages();
  }, [
    filters.category,
    filters.project_id,
    filters.title,
  ]);

  return { images, loading, error, fetchImages };
};

export const authAPI = {
  login: async (credentials) => {
    return fetchAPI(`${BASE_URL}/auth/login`, {
      method: "POST",
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
      }),
    });
  },
};
