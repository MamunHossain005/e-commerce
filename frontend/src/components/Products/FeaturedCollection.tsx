import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import featured from "../../assets/featured.webp";
import type { Variants } from "framer-motion";

const FeaturedCollection = () => {
  // Animation variants
  const containerVariants : Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const leftContentVariants : Variants = {
    hidden: { x: -50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const rightContentVariants : Variants = {
    hidden: { x: 50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const textVariants : Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const buttonVariants : Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        delay: 0.3,
        ease: "easeOut",
      },
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.3,
        repeat: Infinity,
        repeatType: "reverse",
      },
    },
    tap: {
      scale: 0.95,
    },
  };

  const imageVariants : Variants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
    hover: {
      scale: 1.03,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <motion.section 
      className="py-16 px-4 lg:px-0"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      <motion.div 
        className="container mx-auto flex flex-col-reverse lg:flex-row items-center bg-green-50 rounded-3xl overflow-hidden"
        variants={containerVariants}
      >
        {/* Left Content */}
        <motion.div 
          className="lg:w-1/2 p-8 text-center lg:text-left"
          variants={leftContentVariants}
        >
          <motion.h2 
            className="text-lg font-semibold text-gray-700 mb-2"
            variants={textVariants}
          >
            Comfort and Style
          </motion.h2>
          <motion.h2 
            className="text-4xl lg:text-5xl font-bold mb-6"
            variants={textVariants}
          >
            Apparel made for your everyday life
          </motion.h2>
          <motion.p 
            className="text-gray-600 text-lg mb-6"
            variants={textVariants}
          >
            Discover high-quality, comfortable clothing that effortlessly blends style and functionality. Our collection is designed to elevate your everyday wardrobe with pieces that are as versatile as they are chic.
          </motion.p>
          <motion.div variants={buttonVariants}>
            <Link 
              className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition duration-300 inline-block"
              to="/collections/all"
            >
              Shop Now
            </Link>
          </motion.div>
        </motion.div>
        
        {/* Right Content */}
        <motion.div 
          className="lg:w-1/2"
          variants={rightContentVariants}
        >
          <motion.img 
            src={featured} 
            alt="Featured Collection" 
            className="w-full h-full object-cover rounded-t-3xl lg:rounded-t-none lg:rounded-tr-3xl lg:rounded-br-3xl"
            variants={imageVariants}
            whileHover="hover"
          />
        </motion.div>
      </motion.div>
    </motion.section>
  );
};

export default FeaturedCollection;