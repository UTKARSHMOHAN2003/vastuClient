import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { imageService } from '../services/api';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

// Get the base URL for image data
const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:4000/api";

const ImageDetail = () => {
  const { title } = useParams();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        const allImages = await imageService.getAllImages();
        // Filter images by the title from URL parameter AND exclude 'secret' category
        const filteredImages = allImages.filter(img => 
          img.title.toLowerCase() === decodeURIComponent(title).toLowerCase() && 
          img.category !== 'secret'
        );
        
        if (filteredImages.length === 0) {
          setError('No images found with this title');
        } else {
          setImages(filteredImages);
        }
      } catch (err) {
        setError('Error loading images: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [title]);

  if (loading) return <div className="text-center py-16">Loading...</div>;
  if (error) return <div className="text-center py-16 text-red-500">{error}</div>;
  if (images.length === 0) return <div className="text-center py-16">No images found</div>;

  const mainImage = images[0];
  const lightboxSlides = images.map(img => ({
    src: `${BASE_URL}/images/${img.id}/data`,
    alt: img.description || img.title
  }));

  return (
    <div className="bg-white min-h-screen">
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <Link to="/gallery" className="inline-flex items-center text-xs text-gray-500 hover:text-gray-900 mb-4">
          <span className="mr-2">&#8592;</span> Back to Gallery
        </Link>
      </div>
      
      {/* Main Image */}
      <div className="w-full aspect-[3/1] bg-gray-100 overflow-hidden">
       
        <img
          src={`${BASE_URL}/images/${mainImage.id}/data`}
          alt={mainImage.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Title and Subtitle */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-light mb-2 tracking-wide">
          {mainImage.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <span className="text-xs text-gray-500 uppercase tracking-widest">
            {mainImage.category || 'Uncategorized'}
          </span>
          <span className="text-xs text-gray-400 uppercase tracking-widest">
            {new Date(mainImage.uploadDate).toLocaleDateString()}
          </span>
          {mainImage.project_id && (
            <span className="text-xs text-indigo-500 uppercase tracking-widest">
              Project ID: {mainImage.project_id}
            </span>
          )}
          <span className="text-xs text-gray-500 uppercase tracking-widest">
            {images.length} {images.length === 1 ? 'Image' : 'Images'}
          </span>
        </div>
        <div className="w-16 h-px bg-gray-300 mb-8"></div>
        <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-8">
          {mainImage.description || 'No description available.'}
        </p>
      </div>

      {/* Image Grid */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
       
          {images.map((img, idx) => (
            <button
              key={img.id}
              className="aspect-square bg-gray-100 overflow-hidden focus:outline-none"
              onClick={() => {
                setLightboxIndex(idx);
                setLightboxOpen(true);
              }}
              type="button"
            >
              <img
                src={`${BASE_URL}/images/${img.id}/data`}
                alt={img.description || img.title}
                className="w-full h-full object-cover cursor-zoom-in"
              />
            </button>
          ))}
        </div>
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxSlides}
      />
    </div>
  );
};

export default ImageDetail;
