import { motion } from "framer-motion";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
} from "react-icons/fa";
import { FiPhoneCall } from "react-icons/fi";
import { RiTwitterXLine } from "react-icons/ri";
import { Link } from "react-router-dom";

const Footer = () => {
  // Animation variants for the footer container
  const footerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1,
      },
    },
  };

  // Animation variants for each section
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  // Animation variants for links
  const linkVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    hover: {
      x: 5,
      color: "#000",
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  };

  // Animation variants for social icons
  const socialIconVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        type: "spring",
        stiffness: 200,
      },
    },
    hover: {
      scale: 1.2,
      rotate: [0, 10, -10, 0],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatType: "loop",
      },
    },
  };

  // Animation variants for form elements
  const formVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        delay: 0.3,
      },
    },
  };

  // Animation variants for copyright section
  const copyrightVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        delay: 0.5,
      },
    },
  };

  return (
    <motion.footer 
      className="border-t py-12 bg-gray-50"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={footerVariants}
    >
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:px-0">
        {/* Newsletter Section */}
        <motion.div variants={sectionVariants} className="lg:col-span-4">
          <h3 className="text-lg text-gray-800 mb-4 font-semibold">Newsletter</h3>
          <p className="text-gray-500 mb-4 text-sm sm:text-base">
            Be the first to hear about new products, exclusive events, and
            online offers
          </p>
          <p className="font-medium text-sm text-gray-600 mb-6">
            Sign up and get 10% off your first order.
          </p>
          {/* Newsletter subscription form */}
          <motion.form 
            className="flex flex-col sm:flex-row gap-2"
            variants={formVariants}
          >
            <motion.input
              type="email"
              placeholder="Enter your email"
              className="flex-grow lg:flex-none w-1/2  p-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black transition-all"
              whileFocus={{ scale: 1.02, borderColor: "#000" }}
            />
            <motion.button
              type="submit"
              className="bg-black text-white px-6 py-3 text-sm rounded-md hover:bg-gray-800 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Subscribe
            </motion.button>
          </motion.form>
        </motion.div>

        {/* Shop Links */}
        <motion.div variants={sectionVariants}>
          <h3 className="text-lg text-gray-800 mb-4 font-semibold">Shop</h3>
          <ul className="space-y-2 text-gray-600">
            {["Men", "Women", "Top Wear", "Bottom Wear"].map((item, index) => (
              <motion.li key={index} variants={linkVariants}>
                <Link 
                  to={item.includes("Wear") ? `collections/all?category=${item}` : `collections/all?gender=${item}`} 
                  className="block py-1 hover:text-black transition-colors"
                >
                  {item}
                </Link>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Customer Service Links */}
        <motion.div variants={sectionVariants}>
          <h3 className="text-lg text-gray-800 mb-4 font-semibold">Customer Service</h3>
          <ul className="space-y-2 text-gray-600">
            {["Contact Us", "About Us", "FAQs", "Privacy Policy", "Features"].map((item, index) => (
              <motion.li key={index} variants={linkVariants}>
                <Link 
                  to="#" 
                  className="block py-1 hover:text-black transition-colors"
                >
                  {item}
                </Link>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Follow Us Section */}
        <motion.div variants={sectionVariants} className="lg:col-span-2 md:col-span-1">
          <h3 className="text-lg text-gray-800 mb-4 font-semibold">Follow Us</h3>
          <p className="text-gray-500 mb-4 text-sm sm:text-base">
            Stay connected with us on social media
          </p>
          <div className="flex flex-wrap gap-4 mb-6">
            {[
              { icon: <FaFacebook />, href: "https://www.facebook.com" },
              { icon: <FaLinkedin />, href: "https://www.linkedin.com" },
              { icon: <FaInstagram />, href: "https://www.instagram.com" },
              { icon: <RiTwitterXLine />, href: "https://www.twitter.com" },
            ].map((social, index) => (
              <motion.a
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-800 hover:text-gray-500 transition-colors"
                variants={socialIconVariants}
                whileHover="hover"
              >
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white shadow-md">
                  {social.icon}
                </div>
              </motion.a>
            ))}
          </div>
          <div className="mt-6">
            <h4 className="text-gray-800 font-medium mb-2">Call Us</h4>
            <motion.p 
              className="flex items-center text-gray-800"
              whileHover={{ scale: 1.05 }}
            >
              <FiPhoneCall className="inline-block mr-2 text-xl" />
              <span className="text-lg">+1 234 567 890</span>
            </motion.p>
          </div>
        </motion.div>
      </div>

      {/* Copyright Section */}
      <motion.div 
        className="container mx-auto border-t border-gray-200 lg:px-0 mt-12 px-4 pt-6 text-center text-gray-500"
        variants={copyrightVariants}
      >
        <p className="text-sm tracking-tighter">
          &copy; {new Date().getFullYear()} E-Shop. All rights reserved.
        </p>
        <p className="text-xs mt-2">
          Designed by{" "}
          <motion.a
            href="https://bengolee.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-800 hover:text-black transition-colors inline-flex items-center"
            whileHover={{ scale: 1.1 }}
          >
            ❤️ Bengolee
          </motion.a>
        </p>
      </motion.div>
    </motion.footer>
  );
};

export default Footer;