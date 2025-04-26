import { motion } from "framer-motion";

export function PageHeader({ title, description, className }) {
  // Animation variants for the container
  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        staggerChildren: 0.2, // Stagger title and description
      },
    },
  };

  // Animation variants for individual children (title and description)
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`space-y-1 ${className || ""}`}
    >
      <motion.h1
        variants={itemVariants}
        className="text-2xl font-bold tracking-tight text-[#333333]"
      >
        {title}
      </motion.h1>
      {description && (
        <motion.p
          variants={itemVariants}
          className="text-sm text-[#666666]"
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}