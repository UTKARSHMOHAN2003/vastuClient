import React, { useState } from "react";
import { useImages } from "../services/api";
import Lightbox from "yet-another-react-lightbox";
import { Link } from "react-router-dom";
import "yet-another-react-lightbox/styles.css";

// Get the base URL for image data
const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:4000/api";

const ImageGallery = () => {
  const { images, loading, error } = useImages();
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxSlides, setLightboxSlides] = useState([]);

  // Filter out 'secret' category images completely
  const publicImages = images.filter((img) => img.category !== "secret");

  // Extract unique categories from public images only
  const categories = [
    "All",
    ...new Set(publicImages.map((img) => img.category).filter(Boolean)),
  ];

  // Filter images by active category
  const filteredImages =
    activeCategory === "All"
      ? publicImages
      : publicImages.filter((img) => img.category === activeCategory);

  // Group images by title (only using filtered public images)
  const groupedImages = filteredImages.reduce((acc, img) => {
    if (!acc[img.title]) {
      acc[img.title] = [];
    }
    acc[img.title].push(img);
    return acc;
  }, {});

  // Filter out any empty groups (in case all images in a title were secret)
  const validGroupedImages = Object.fromEntries(
    Object.entries(groupedImages).filter(
      ([title, groupImages]) => groupImages.length > 0
    )
  );

  // Open lightbox with all images from a group (all will be public images)
  const openLightbox = (groupTitle, index) => {
    const groupImages = validGroupedImages[groupTitle];
    const slides = groupImages.map((img) => ({
      src: `${BASE_URL}/images/${img.id}/data`,
      alt: img.description || img.title,
    }));

    setLightboxSlides(slides);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (loading)
    return <div className="text-center py-16">Loading images...</div>;
  if (error)
    return <div className="text-center py-16 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-white px-2 sm:px-4 md:px-8 pt-8">
      {/* Category Tabs */}
      <div className="flex justify-center space-x-4 sm:space-x-6 mb-6 sm:mb-8 text-sm sm:text-base bg-white py-2 sm:py-4 border-b border-gray-200 sticky top-0 z-10 mt-8 sm:mt-12 overflow-x-auto">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`uppercase tracking-widest font-semibold px-2 sm:px-4 py-1 sm:py-2 transition-colors duration-200 ${
              activeCategory === category
                ? "text-gray-700 border-b-2 border-muted-700"
                : "text-gray-400 hover:text-muted-700"
            }`}
          >
            {category || "Uncategorized"}
          </button>
        ))}
      </div>

      {/* Images Grid */}
      <div className="flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 md:gap-10 mb-10 sm:mb-16 w-full max-w-6xl">
          {Object.entries(validGroupedImages).map(([title, groupImages]) => (
            <Link
              to={`/gallery/${encodeURIComponent(title)}`}
              key={title}
              className="flex flex-col"
            >
              <div className="w-full aspect-square mb-3 sm:mb-4 overflow-hidden rounded-sm bg-gray-100 relative">
                <img
                  src={`${BASE_URL}/images/${groupImages[0].id}/data`}
                  alt={title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                {groupImages.length > 1 && (
                  <div className="absolute top-2 right-2 bg-white bg-opacity-75 rounded-full w-8 h-8 flex items-center justify-center">
                    <span className="text-xs font-medium">
                      +{groupImages.length - 1}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-left">
                <h3 className="text-sm font-medium text-gray-900 tracking-wide uppercase mb-1">
                  {title}
                </h3>
                <span className="text-xs text-gray-400 tracking-wide uppercase">
                  {groupImages[0].category || "Uncategorized"}
                </span>
                {groupImages[0].description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {groupImages[0].description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Lightbox for viewing images */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxSlides}
      />
    </div>
  );
};

export default ImageGallery;
