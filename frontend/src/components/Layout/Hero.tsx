import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import heroImg from "../../assets/rabbit-hero.webp";

const Hero = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
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

  const imageVariants = {
    hidden: { 
      scale: 1.1,
      opacity: 0
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: "easeOut"
      }
    }
  };

  const buttonVariants = {
    idle: { 
      scale: 1,
      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)"
    },
    hover: { 
      scale: 1.05,
      boxShadow: "0 8px 25px rgba(0, 0, 0, 0.2)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15
      }
    },
    tap: { 
      scale: 0.98,
      transition: {
        duration: 0.1
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 1,
        delay: 0.2
      }
    }
  };

  return (
    <section className="relative overflow-hidden">
      <motion.img
        src={heroImg}
        alt="E-commerce"
        className="w-full h-[400px] md:h-[600px] lg:h-[750px] object-cover"
        variants={imageVariants}
        initial="hidden"
        animate="visible"
      />
      
      <motion.div 
        className="absolute inset-0 bg-black bg-opacity-30"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center justify-center h-full">
          <motion.div 
            className="text-center text-white p-6 max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 
              className="text-4xl md:text-7xl font-bold tracking-tighter mb-4"
              variants={itemVariants}
            >
              <motion.span 
                className="inline-block"
                whileHover={{ 
                  scale: 1.02,
                  transition: { type: "spring", stiffness: 300 }
                }}
              >
                Vacation
              </motion.span>
              <br />
              <motion.span 
                className="inline-block"
                whileHover={{ 
                  scale: 1.02,
                  transition: { type: "spring", stiffness: 300 }
                }}
              >
                Ready
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className="text-sm md:text-lg mb-6 tracking-tighter opacity-90"
              variants={itemVariants}
            >
              Discover our vacation-ready outfits with fast worldwide shipping.
            </motion.p>
            
            <motion.div variants={itemVariants}>
              <Link to="/collections/all" className="inline-block">
                <motion.button 
                  className="bg-white text-black text-lg px-8 py-4 rounded-full font-semibold transition-colors duration-300 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-30"
                  variants={buttonVariants}
                  initial="idle"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <motion.span
                    className="inline-block"
                    whileHover={{
                      x: 2,
                      transition: { type: "spring", stiffness: 400 }
                    }}
                  >
                    Shop Now
                  </motion.span>
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Floating elements for extra visual interest */}
      <motion.div
        className="absolute top-1/4 left-10 w-2 h-2 bg-white rounded-full opacity-60"
        animate={{
          y: [-10, 10, -10],
          opacity: [0.6, 0.3, 0.6]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute bottom-1/4 right-16 w-3 h-3 bg-white rounded-full opacity-40"
        animate={{
          y: [10, -15, 10],
          opacity: [0.4, 0.2, 0.4]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
    </section>
  );
};

export default Hero;