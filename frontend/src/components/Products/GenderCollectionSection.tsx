import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import mensCollectionImg from "../../assets/mens-collection.webp";
import womenCollectionImg from "../../assets/womens-collection.webp";

const GenderCollectionSection = () => {
  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  // Individual collection card variants
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 60,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  // Image hover variants
  const imageVariants = {
    initial: { 
      scale: 1 
    },
    hover: { 
      scale: 1.05,
      transition: {
        duration: 0.4,
        ease: "easeInOut"
      }
    }
  };

  // Content overlay variants
  const overlayVariants = {
    initial: { 
      opacity: 0.8,
      y: 0
    },
    hover: { 
      opacity: 1,
      y: -5,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  // Link variants
  const linkVariants = {
    initial: { 
      x: 0 
    },
    hover: { 
      x: 5,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15
      }
    }
  };

  // Collection data
  const collections = [
    {
      id: "women",
      title: "Women's Collection",
      image: womenCollectionImg,
      alt: "Women's Collection",
      link: "/collections/all?gender=Women"
    },
    {
      id: "men", 
      title: "Men's Collection",
      image: mensCollectionImg,
      alt: "Men's Collection",
      link: "/collections/all?gender=Men"
    }
  ];

  return (
    <section className="py-16 px-4 lg:px-0 overflow-hidden">
      <motion.div 
        className="container mx-auto flex flex-col lg:flex-row gap-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {collections.map((collection, index) => (
          <motion.div
            key={collection.id}
            className="relative flex-1 group cursor-pointer"
            variants={cardVariants}
            whileHover="hover"
            initial="initial"
          >
            <div className="relative overflow-hidden rounded-md">
              <motion.img
                src={collection.image}
                alt={collection.alt}
                className="w-full h-[700px] object-cover"
                variants={imageVariants}
              />
              
              {/* Gradient overlay that appears on hover */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
            </div>

            <motion.div 
              className="absolute bottom-8 left-8 bg-white bg-opacity-80 backdrop-blur-sm p-6 rounded-lg shadow-lg"
              variants={overlayVariants}
            >
              <motion.h2 
                className="text-2xl font-bold text-gray-900 mb-3"
                initial={{ opacity: 0.8 }}
                whileHover={{ 
                  opacity: 1,
                  transition: { duration: 0.2 }
                }}
              >
                {collection.title}
              </motion.h2>
              
              <Link
                to={collection.link}
                className="text-gray-900 underline hover:text-gray-700 inline-flex items-center gap-1 font-medium"
              >
                <motion.div variants={linkVariants}>
                  <span>Shop Now</span>
                  <motion.svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    initial={{ x: 0 }}
                    whileHover={{ x: 2 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 5l7 7-7 7" 
                    />
                  </motion.svg>
                </motion.div>
              </Link>
            </motion.div>

            {/* Decorative floating elements */}
            <motion.div
              className="absolute top-8 right-8 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-60"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.6, 0.3, 0.6]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.5
              }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Background decoration */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 2 }}
      >
        <motion.div
          className="absolute top-1/4 left-4 w-1 h-1 bg-gray-300 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.1, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/3 right-8 w-2 h-2 bg-gray-200 rounded-full"
          animate={{
            y: [-5, 5, -5],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </motion.div>
    </section>
  );
};

export default GenderCollectionSection;