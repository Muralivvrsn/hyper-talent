import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Users, Plus, Tag, Search } from "lucide-react";
import { motion } from "framer-motion";

export function EmptyProfiles() {
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

      <Card className="border-2 border-dashed border-[#e9ecef] bg-[#f8f9fa] shadow-lg rounded-xl">
        <CardContent className="p-12 flex flex-col items-center text-center">
          <motion.div
            variants={itemVariants}
            className="w-20 h-20 rounded-full bg-[#1a5f7a]/10 flex items-center justify-center mb-6"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Users className="h-10 w-10 text-[#1a5f7a]" />
          </motion.div>
          <motion.h3
            variants={itemVariants}
            className="text-xl font-semibold text-[#333333] mb-3"
          >
            No profiles yet
          </motion.h3>
          <motion.p
            variants={itemVariants}
            className="text-[#666666] mb-8 max-w-lg text-base"
          >
            Profiles help you organize your contacts and keep track of important information.
          </motion.p>
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap gap-4 justify-center"
          >
            <Button className="bg-[#1a5f7a] hover:bg-[#0c2e3b] text-white shadow-md px-6 py-2 text-base">
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Profile
            </Button>
            <Button
              variant="outline"
              className="border-[#1a5f7a] text-[#1a5f7a] hover:bg-[#f8f9fa] shadow-md px-6 py-2 text-base"
            >
              <Tag className="h-5 w-5 mr-2" />
              Create Labels
            </Button>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl"
          >
            {[
              { icon: Users, title: "Organize Contacts", desc: "Keep all your contacts in one place" },
              { icon: Tag, title: "Custom Labels", desc: "Categorize with custom labels" },
              { icon: Search, title: "Quick Search", desc: "Find contacts instantly" },
              { icon: Users, title: "Team Sharing", desc: "Share profiles with your team" },
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex items-start gap-3 text-left bg-[#e9ecef] p-4 rounded-lg shadow-md"
                whileHover={{ y: -5, boxShadow: "0 6px 20px rgba(0,0,0,0.1)" }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-3 rounded-md bg-[#1a5f7a]/10">
                  <item.icon className="h-6 w-6 text-[#1a5f7a]" />
                </div>
                <div>
                  <h4 className="text-base font-medium text-[#333333]">{item.title}</h4>
                  <p className="text-sm text-[#666666]">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}