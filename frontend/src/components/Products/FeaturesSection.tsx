import { motion } from "framer-motion";
import { HiOutlineCreditCard, HiShoppingBag } from "react-icons/hi";
import { HiArrowPathRoundedSquare } from "react-icons/hi2";

const FeaturesSection = () => {
  // Animation variants for the container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  // Animation variants for each feature card
  const featureVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
    hover: {
      y: -10,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  // Animation variants for icons
  const iconVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        delay: 0.2,
        type: "spring",
        stiffness: 200,
      },
    },
    hover: {
      rotate: [0, 10, -10, 0],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatType: "loop",
      },
    },
  };

  // Animation variants for text
  const textVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        delay: 0.3,
      },
    },
  };

  return (
    <motion.section 
      className="py-16 px-4 bg-white"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      <motion.div 
        className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
        variants={containerVariants}
      >
        {/* Feature 1 */}
        <motion.div 
          className="flex flex-col items-center p-6 rounded-xl hover:shadow-lg transition-shadow duration-300"
          variants={featureVariants}
          whileHover="hover"
        >
          <motion.div 
            className="p-4 rounded-full mb-4 bg-blue-50 text-blue-600"
            variants={iconVariants}
            whileHover="hover"
          >
            <HiShoppingBag className="text-3xl" />
          </motion.div>
          <motion.h4 
            className="tracking-tighter mb-2 font-bold"
            variants={textVariants}
          >
            FREE INTERNATIONAL SHIPPING
          </motion.h4>
          <motion.p 
            className="text-gray-600 text-sm tracking-tighter"
            variants={textVariants}
          >
            On all orders over $100.00
          </motion.p>
        </motion.div>

        {/* Feature 2 */}
        <motion.div 
          className="flex flex-col items-center p-6 rounded-xl hover:shadow-lg transition-shadow duration-300"
          variants={featureVariants}
          whileHover="hover"
        >
          <motion.div 
            className="p-4 rounded-full mb-4 bg-green-50 text-green-600"
            variants={iconVariants}
            whileHover="hover"
          >
            <HiArrowPathRoundedSquare className="text-3xl" />
          </motion.div>
          <motion.h4 
            className="tracking-tighter mb-2 font-bold"
            variants={textVariants}
          >
            45 DAYS RETURN
          </motion.h4>
          <motion.p 
            className="text-gray-600 text-sm tracking-tighter"
            variants={textVariants}
          >
            Money back guarantee
          </motion.p>
        </motion.div>

        {/* Feature 3 */}
        <motion.div 
          className="flex flex-col items-center p-6 rounded-xl hover:shadow-lg transition-shadow duration-300"
          variants={featureVariants}
          whileHover="hover"
        >
          <motion.div 
            className="p-4 rounded-full mb-4 bg-purple-50 text-purple-600"
            variants={iconVariants}
            whileHover="hover"
          >
            <HiOutlineCreditCard className="text-3xl" />
          </motion.div>
          <motion.h4 
            className="tracking-tighter mb-2 font-bold"
            variants={textVariants}
          >
            SECURE CHECKOUT
          </motion.h4>
          <motion.p 
            className="text-gray-600 text-sm tracking-tighter"
            variants={textVariants}
          >
            100% secured checkout process
          </motion.p>
        </motion.div>
      </motion.div>
    </motion.section>
  );
};

export default FeaturesSection;