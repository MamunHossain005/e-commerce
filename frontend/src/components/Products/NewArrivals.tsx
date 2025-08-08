import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import axios from "axios";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { Variants } from "framer-motion";

interface NewArrivalImage {
  url: string;
  alt: string;
}

interface NewArrival {
  _id: string;
  name: string;
  price: number;
  images: NewArrivalImage[];
}

const NewArrivals = () => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [newArrivals, setNewArrivals] = useState<NewArrival[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Animation variants
  const containerVariants : Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1
      }
    }
  };

  const titleVariants : Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const buttonVariants : Variants = {
    idle: { scale: 1, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
    hover: { 
      scale: 1.05,
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      transition: { type: "spring", stiffness: 300, damping: 15 }
    },
    tap: { scale: 0.95 },
    disabled: { 
      scale: 1,
      opacity: 0.5,
      boxShadow: "none"
    }
  };

  const cardVariants : Variants = {
    hidden: { opacity: 0, x: 50, scale: 0.9 },
    visible: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    },
    hover: {
      y: -10,
      scale: 1.02,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }
    }
  };

  const imageVariants : Variants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.1,
      transition: { duration: 0.4, ease: "easeInOut" }
    }
  };

  const overlayVariants : Variants = {
    initial: { 
      opacity: 0.5,
      backdropFilter: "blur(8px)",
      y: 20
    },
    hover: { 
      opacity: 1,
      backdropFilter: "blur(12px)",
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  const loadingVariants : Variants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/products/new-arrivals`
        );
        setNewArrivals(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNewArrivals();
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = x - startX;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const scroll = (direction: "left" | "right") => {
    const scrollAmount = direction === "left" ? -300 : 300;
    scrollRef.current?.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    });
  };

  const updateScrollButtons = () => {
    const container = scrollRef.current;
    if (container) {
      const leftScroll = container.scrollLeft;
      const rightScrollable =
        container.scrollWidth > container.clientWidth + leftScroll;

      setCanScrollLeft(leftScroll > 0);
      setCanScrollRight(rightScrollable);
    }
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.addEventListener("scroll", updateScrollButtons);
      updateScrollButtons();
      return () => container.removeEventListener("scroll", updateScrollButtons);
    }
  }, [newArrivals]);

  if (isLoading) {
    return (
      <section className="container mx-auto text-center mb-10 relative py-8 px-4 md:px-0">
        <motion.div
          className="flex flex-col items-center justify-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full"
            variants={loadingVariants}
            animate="animate"
          />
          <motion.p 
            className="mt-4 text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Loading new arrivals...
          </motion.p>
        </motion.div>
      </section>
    );
  }

  return (
    <motion.section 
      className="container mx-auto text-center mb-10 relative py-8 px-4 md:px-0"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <motion.h2 
        className="text-3xl font-bold mb-4"
        variants={titleVariants}
      >
        Explore New Arrivals
      </motion.h2>
      
      <motion.p 
        className="text-lg text-gray-600 mb-8"
        variants={titleVariants}
        transition={{ delay: 0.2 }}
      >
        Discover the latest styles straight off the runway, freshly added to
        keep your wardrobe on the cutting edge of fashion
      </motion.p>

      {/* Scroll Buttons */}
      <motion.div 
        className="absolute right-0 flex space-x-2 z-40"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <motion.button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className={`p-2 rounded border ${
            canScrollLeft
              ? "bg-white text-black"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          variants={buttonVariants}
          initial="idle"
          whileHover={canScrollLeft ? "hover" : "disabled"}
          whileTap={canScrollLeft ? "tap" : "disabled"}
        >
          <FiChevronLeft className="text-xl" />
        </motion.button>
        
        <motion.button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className={`p-2 rounded border ${
            canScrollRight
              ? "bg-white text-black"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          variants={buttonVariants}
          initial="idle"
          whileHover={canScrollRight ? "hover" : "disabled"}
          whileTap={canScrollRight ? "tap" : "disabled"}
        >
          <FiChevronRight className="text-xl" />
        </motion.button>
      </motion.div>

      {/* Scrollable Content */}
      <motion.div
        ref={scrollRef}
        className={`container mx-auto overflow-x-scroll mt-12 p-6 flex space-x-6 relative pt-8 ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <AnimatePresence>
          {newArrivals.map((item: NewArrival, index: number) => (
            <motion.div
              key={item._id}
              className="min-w-[100%] sm:min-w-[50%] lg:min-w-[30%] relative group"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              transition={{ delay: index * 0.1 }}
              layout
            >
              <div className="relative overflow-hidden rounded-lg">
                <motion.img
                  src={item.images[0].url}
                  alt={item.images[0].alt}
                  className="w-full h-[500px] object-cover"
                  draggable="false"
                  variants={imageVariants}
                  initial="initial"
                  whileHover="hover"
                />
                
                {/* Gradient overlay that appears on hover */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </div>

              <motion.div 
                className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 backdrop-blur-md text-white p-4 rounded-b-lg"
                variants={overlayVariants}
                initial="initial"
                whileHover="hover"
              >
                <Link
                  to={`/product/${item._id}`}
                  className="text-lg font-semibold hover:text-blue-400 transition-colors duration-200"
                >
                  <motion.h3 
                    className="font-medium"
                    initial={{ y: 5, opacity: 0.8 }}
                    whileHover={{ 
                      y: 0, 
                      opacity: 1,
                      transition: { duration: 0.2 }
                    }}
                  >
                    {item.name}
                  </motion.h3>
                  
                  <motion.p 
                    className="mt-1 font-semibold"
                    initial={{ y: 5, opacity: 0.8 }}
                    whileHover={{ 
                      y: 0, 
                      opacity: 1,
                      scale: 1.05,
                      transition: { duration: 0.2, delay: 0.05 }
                    }}
                  >
                    ${item.price}
                  </motion.p>
                </Link>
              </motion.div>

              {/* Floating badge */}
              <motion.div
                className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100"
                initial={{ scale: 0, rotate: -10 }}
                whileHover={{ 
                  scale: 1, 
                  rotate: 0,
                  transition: { 
                    type: "spring", 
                    stiffness: 500, 
                    damping: 15 
                  }
                }}
              >
                New
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Decorative elements */}
      <motion.div
        className="absolute top-8 left-4 w-2 h-2 bg-blue-400 rounded-full opacity-30"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute bottom-8 right-1/4 w-1 h-1 bg-pink-400 rounded-full opacity-40"
        animate={{
          y: [-5, 5, -5],
          opacity: [0.4, 0.7, 0.4]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
    </motion.section>
  );
};

export default NewArrivals;