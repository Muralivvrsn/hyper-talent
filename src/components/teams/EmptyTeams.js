import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Users, Plus, MessageSquare, Activity, UserPlus, Share2 } from "lucide-react";
import { motion } from "framer-motion";

export function EmptyTeams() {
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
      <motion.div variants={itemVariants} className="flex justify-end">
        <Button className="bg-[#1a5f7a] hover:bg-[#0c2e3b] text-white shadow-md">
          <Plus className="h-5 w-5 mr-2" />
          New Team
        </Button>
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
            No teams yet
          </motion.h3>
          <motion.p
            variants={itemVariants}
            className="text-[#666666] mb-8 max-w-lg text-base"
          >
            Create teams to collaborate with your colleagues and share profiles, activities, and messages.
          </motion.p>
          <motion.div variants={itemVariants}>
            <Button className="bg-[#1a5f7a] hover:bg-[#0c2e3b] text-white shadow-md px-6 py-2 text-base">
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Team
            </Button>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl"
          >
            {[
              { icon: UserPlus, title: "Add Team Members", desc: "Invite colleagues to collaborate" },
              { icon: MessageSquare, title: "Team Chat", desc: "Communicate in real-time" },
              { icon: Share2, title: "Share Profiles", desc: "Collaborate on client profiles" },
              { icon: Activity, title: "Track Activity", desc: "Monitor team performance" },
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

          <motion.div
            variants={itemVariants}
            className="mt-10 p-6 border border-[#e9ecef] rounded-lg bg-[#f8f9fa] shadow-md max-w-lg w-full"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <h4 className="text-base font-medium text-[#333333] mb-3">Team Benefits</h4>
            <ul className="text-sm text-[#666666] space-y-3">
              {[
                "Centralized communication and collaboration",
                "Shared access to important profiles and information",
                "Improved coordination and productivity",
                "Activity tracking and performance insights",
              ].map((benefit, index) => (
                <motion.li
                  key={index}
                  className="flex items-start gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <span className="text-[#1a5f7a]">•</span>
                  <span>{benefit}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}