import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Link2, Plus, Slack, FileSpreadsheet, Mail, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export function EmptyIntegrations() {
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
          Add Integration
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
            <Link2 className="h-10 w-10 text-[#1a5f7a]" />
          </motion.div>
          <motion.h3
            variants={itemVariants}
            className="text-xl font-semibold text-[#333333] mb-3"
          >
            No integrations yet
          </motion.h3>
          <motion.p
            variants={itemVariants}
            className="text-[#666666] mb-8 max-w-lg text-base"
          >
            Connect your favorite tools and services to streamline your workflow.
          </motion.p>
          <motion.div variants={itemVariants}>
            <Button className="bg-[#1a5f7a] hover:bg-[#0c2e3b] text-white shadow-md px-6 py-2 text-base">
              <Plus className="h-5 w-5 mr-2" />
              Connect Your First Integration
            </Button>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-3xl"
          >
            {[
              { icon: Slack, title: "Slack" },
              { icon: FileSpreadsheet, title: "Google Sheets" },
              { icon: Mail, title: "Gmail" },
              { icon: Calendar, title: "Calendar" },
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.05, boxShadow: "0 6px 20px rgba(0,0,0,0.1)" }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border border-[#e9ecef] bg-[#f8f9fa] hover:border-[#1a5f7a]/50 shadow-md rounded-lg">
                  <CardContent className="p-5 flex flex-col items-center gap-3">
                    <div className="p-3 rounded-md bg-[#e9ecef]">
                      <item.icon className="h-8 w-8 text-[#1a5f7a]" />
                    </div>
                    <span className="text-base font-medium text-[#333333]">{item.title}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-8 text-sm text-[#666666]"
          >
            <p>
              Don't see what you're looking for?{" "}
              <a href="#" className="text-[#1a5f7a] underline">
                Request an integration
              </a>
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}