import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useImages } from "../services/api";
import founder_sunny from '../Assets/founder_sunny.jpeg';

// Get the base URL for image data
const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:4000/api";

const BLOG_FEED_URL = "https://vastudesignslimited.blogspot.com/feeds/posts/default?alt=json";

const LatestBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fallback static blog content
  const fallbackBlogs = [
    {
      title: "Designing the Future: A Minimalist Villa in White",
      snippet: "Architecture is not just about space, it's about emotions. In our latest project, we explored how light, space, and silence could come together to define luxury.",
      link: "https://vastudesignslimited.blogspot.com/2025/07/this-is-dummy-vlog.html",
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop"
    },
    {
      title: "Sustainable Design Principles in Modern Architecture",
      snippet: "Creating eco-friendly spaces for tomorrow. Our approach emphasizes sustainable design principles and cost-effective solutions.",
      link: "https://vastudesignslimited.blogspot.com/",
      image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop"
    },
    {
      title: "Traditional Vastu Meets Modern Architecture",
      snippet: "Balancing heritage with innovation. We believe in creating designs that honor our cultural heritage while embracing modern functionality.",
      link: "https://vastudesignslimited.blogspot.com/",
      image: "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=400&h=300&fit=crop"
    },
    {
      title: "Cost-Effective Design Solutions",
      snippet: "Maximizing value without compromising quality. Our business philosophy is simple: deliver excellence through collaboration and integrity.",
      link: "https://vastudesignslimited.blogspot.com/",
      image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=400&h=300&fit=crop"
    }
  ];

  useEffect(() => {
    // Try to fetch from Blogger with CORS proxy
    const fetchBlogs = async () => {
      try {
        // Use a CORS proxy to bypass the CORS issue
        const corsProxy = "https://api.allorigins.win/raw?url=";
        const blogUrl = encodeURIComponent("https://vastudesignslimited.blogspot.com/feeds/posts/default?alt=json");
        
        const response = await fetch(corsProxy + blogUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.feed && data.feed.entry && Array.isArray(data.feed.entry)) {
          const posts = data.feed.entry.map((post, index) => {
            const title = post.title?.$t || 'Untitled';
            const content = post.content?.$t || post.summary?.$t || '';
            const link = post.link?.find(l => l.rel === "alternate")?.href || '';
            
            // Extract image from content if available
            const imgMatch = content.match(/<img[^>]+src=["']([^"'>]+)["']/);
            const image = imgMatch ? imgMatch[1] : null;
            
            // Create snippet from content (remove HTML tags)
            const snippet = content.replace(/<[^>]+>/g, '').substring(0, 150) + '...';
            
            const processedPost = {
              title,
              content,
              link,
              image,
              snippet
            };
            
            return processedPost;
          });
          
          setBlogs(posts.slice(0, 4));
        } else {
          setBlogs(fallbackBlogs);
        }
      } catch (err) {
        setBlogs(fallbackBlogs);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  if (loading) return <div className="py-8 text-center text-gray-400">Loading latest blogs...</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {blogs.map((blog, idx) => (
        <a
          key={idx}
          href={blog.link}
          target="_blank"
          rel="noopener noreferrer"
          className="group cursor-pointer"
        >
          <div className="aspect-[4/3] bg-gray-100 mb-4 overflow-hidden">
            {blog.image ? (
              <img
                src={blog.image}
                alt={blog.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <span className="text-xs text-gray-400">No image</span>
              </div>
            )}
          </div>
          <h4 className="text-xs font-semibold text-gray-900 mb-1 line-clamp-2">{blog.title}</h4>
          <p className="text-xs text-gray-600 leading-relaxed mb-2 line-clamp-3">{blog.snippet}</p>
          <p className="text-xs text-gray-400">Read more →</p>
        </a>
      ))}
    </div>
  );
};

const ArchitecturePortfolio = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { images, loading, error } = useImages();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Filter images to only include 'built' or 'unbuilt' categories
  const filteredImages = images.filter(img => 
    img.category === 'built' || img.category === 'unbuilt'
  );

  // Group filtered images by title
  const groupedImages = filteredImages.reduce((acc, img) => {
    if (!acc[img.title]) {
      acc[img.title] = [];
    }
    acc[img.title].push(img);
    return acc;
  }, {});

  // Convert to array for rendering
  const allProjects = Object.entries(groupedImages);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-screen">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&h=1080&fit=crop"
            alt="Modern beach house architecture"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white">
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-light tracking-wide">
              ARCHITECTURE
            </h1>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-12 lg:mb-16">
            <h2 className="text-xs font-light text-gray-500 tracking-[0.2em] uppercase mb-2">
              Featured Projects
            </h2>
            <div className="w-12 h-px bg-gray-300"></div>
          </div>

          {/* Loading and Error States */}
          {loading && (
            <div className="text-center py-16">
              <p className="text-gray-500">Loading projects...</p>
            </div>
          )}
          
          {error && (
            <div className="text-center py-16">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {/* Projects Grid - ONLY BUILT OR UNBUILT PROJECTS */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {allProjects.map(([title, groupImages]) => (
                <Link 
                  key={title} 
                  to={`/gallery/${encodeURIComponent(title)}`}
                  className="group cursor-pointer"
                >
                  <div className="aspect-[4/3] bg-gray-100 mb-6 overflow-hidden relative">
                    <img
                      src={`${BASE_URL}/images/${groupImages[0].id}/data`}
                      alt={title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {groupImages.length > 1 && (
                      <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-full w-10 h-10 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">+{groupImages.length - 1}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-light text-gray-900 tracking-wide">
                      {title}
                    </h3>
                    <p className="text-xs font-light text-gray-500 tracking-[0.15em] uppercase">
                      {groupImages[0].category || 'Uncategorized'}
                    </p>
                    {groupImages[0].description && (
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                        {groupImages[0].description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* About Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-16 lg:mb-24">
          {/* Left side - Ar. Sunny Gupta image */}
          <div className="aspect-[3/4] bg-gray-100">
            <img
              src={founder_sunny}
              alt="Ar. Sunny Gupta - Founding Principal"
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Right side - Text content */}
          <div className="flex flex-col justify-center">
            <div className="mb-8">
              <h3 className="text-xs font-light text-gray-500 tracking-[0.2em] uppercase mb-6">
                About the Practice
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Founded in 2011 by <span className="font-medium">Ar. Sunny Gupta</span> and <span className="font-medium">Ar. Rahul Lokhande</span>, VASTU DESIGN CONSULTANTS has established itself as a leading architectural practice in Nagpur, Maharashtra. Our firm specializes in creating contextually responsive designs that blend traditional wisdom with modern innovation.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                With over a decade of experience, we have completed numerous projects spanning residential, commercial, institutional, and interior design. Our approach emphasizes sustainable design principles, cost-effective solutions, and seamless coordination with all stakeholders.
              </p>
              <blockquote className="text-sm text-gray-700 italic leading-relaxed border-l-2 border-gray-300 pl-4 mb-4">
                "Architecture is not just about creating spaces, it's about crafting experiences that resonate with human emotions. Every line we draw, every material we choose, speaks to the soul of the place and its people. Our goal is to build not just structures, but sustainable legacies that inspire future generations."
              </blockquote>
              <p className="text-xs text-gray-500 tracking-[0.1em] uppercase">
                — Ar. Sunny Gupta, Founding Principal
              </p>
            </div>
          </div>
        </div>

        {/* Latest Blogs Section */}
        <div className="mb-16 lg:mb-24">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xs font-light text-gray-500 tracking-[0.2em] uppercase">
              Latest Blogs
            </h3>
            <a
              href="https://vastudesignslimited.blogspot.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-light text-gray-400 hover:text-gray-700 tracking-[0.15em] uppercase transition-colors duration-300"
            >
              View All
            </a>
          </div>
          <LatestBlogs />
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-4 sm:mb-0">
              <span className="text-xs font-light text-gray-400 tracking-[0.2em] uppercase">
                VASTU DESIGN CONSULTANTS
              </span>
            </div>
            <div className="flex space-x-6 text-xs text-gray-400">
              <a
                href="#"
                className="hover:text-gray-700 transition-colors duration-300"
              >
                Contact
              </a>
              <a
                href="#"
                className="hover:text-gray-700 transition-colors duration-300"
              >
                Copyright 2025
              </a>
              <a
                href="#"
                className="hover:text-gray-700 transition-colors duration-300"
              >
                Site by VASTU DESIGN CONSULTANTS
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* WhatsApp Support Button */}
      <WhatsAppSupport />
    </div>
  );
};

export default ArchitecturePortfolio;

// WhatsApp Support Button Component
const WhatsAppSupport = () => {
  const handleWhatsAppClick = () => {
    const phoneNumber = "919372637087"; // Ar. Sunny Gupta's number
    const message = "Hello! I'm interested in your architectural services. Can you help me?";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={handleWhatsAppClick}
        className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
        aria-label="Contact us on WhatsApp"
      >
        <svg 
          className="w-6 h-6" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
      </button>
    </div>
  );
};
