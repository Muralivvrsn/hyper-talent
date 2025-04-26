// ProfileList.jsx (New Component)
import { Card, CardContent } from "../ui/card"; // Adjust path as needed
import { Button } from "../ui/button"; // Adjust path as needed
import { User, Link as LinkIcon, Search } from "lucide-react";
import { motion } from "framer-motion";

export function ProfileList({ profileData }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Search Bar */}
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#888888]" />
          <input
            type="search"
            placeholder="Search profiles..."
            className="pl-10 h-12 w-full rounded-md border border-[#e9ecef] bg-white text-[#333333] px-4 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a5f7a]"
          />
        </div>
      </motion.div>

      {/* Profile Card */}
      <motion.div variants={itemVariants}>
        <Card className="border-[#e9ecef] bg-[#f8f9fa] shadow-lg rounded-xl">
          <CardContent className="p-6 flex flex-col md:flex-row items-start gap-6">
            {/* Profile Icon */}
            <motion.div
              className="w-16 h-16 rounded-full bg-[#1a5f7a]/10 flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <User className="h-8 w-8 text-[#1a5f7a]" />
            </motion.div>

            {/* Profile Details */}
            <div className="flex-1">
              <motion.h3
                className="text-xl font-semibold text-[#333333] mb-2"
                variants={itemVariants}
              >
                {profileData.name || "Unnamed Profile"}
              </motion.h3>
              <motion.a
                href={profileData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1a5f7a] hover:underline flex items-center gap-2 text-base"
                variants={itemVariants}
              >
                <LinkIcon className="h-5 w-5" />
                {profileData.url || "No URL provided"}
              </motion.a>
            </div>

            {/* Action Buttons */}
            <motion.div
              className="flex flex-wrap gap-4"
              variants={itemVariants}
            >
              <Button
                className="bg-[#1a5f7a] hover:bg-[#0c2e3b] text-white shadow-md px-6 py-2 text-base"
              >
                View Details
              </Button>
              <Button
                variant="outline"
                className="border-[#1a5f7a] text-[#1a5f7a] hover:bg-[#f8f9fa] shadow-md px-6 py-2 text-base"
              >
                Edit Profile
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}