import { EmptyShortcuts } from "../components/shortcuts/EmptyShortcuts"; // Adjust path as needed
import { motion } from "framer-motion";

export function ShortcutsPage() {
  const pageVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      className="min-h-screen p-6 bg-background"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-4xl mx-auto">
        <motion.h1
          className="text-2xl font-bold mb-6 text-foreground"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Shortcuts
        </motion.h1>
        <EmptyShortcuts />
      </div>
    </motion.div>
  );
}