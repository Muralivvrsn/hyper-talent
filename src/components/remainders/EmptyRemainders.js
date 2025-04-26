import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Bell, Plus, Calendar, Clock, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export function EmptyReminders() {
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
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="border-[#1a5f7a] text-[#1a5f7a] hover:bg-[#f8f9fa] shadow-sm">
            All
          </Button>
          <Button variant="ghost" size="sm" className="text-[#666666] hover:bg-[#f8f9fa] shadow-sm">
            Pending
          </Button>
          <Button variant="ghost" size="sm" className="text-[#666666] hover:bg-[#f8f9fa] shadow-sm">
            Completed
          </Button>
        </div>
        <Button className="bg-[#1a5f7a] hover:bg-[#0c2e3b] text-white shadow-md">
          <Plus className="h-5 w-5 mr-2" />
          Add Reminder
        </Button>
      </motion.div>

      <Card className="border-2 border-dashed border-[#e9ecef] bg-[#f8f9fa] shadow-lg rounded-xl">
        <CardContent className="p-12 flex flex-col items-center text-center">
          <motion.div
            variants={itemVariants}
            className="w-20 h-20 rounded-full bg-[#FF6B6B]/10 flex items-center justify-center mb-6"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Bell className="h-10 w-10 text-[#FF6B6B]" />
          </motion.div>
          <motion.h3
            variants={itemVariants}
            className="text-xl font-semibold text-[#333333] mb-3"
          >
            No reminders yet
          </motion.h3>
          <motion.p
            variants={itemVariants}
            className="text-[#666666] mb-8 max-w-lg text-base"
          >
            Set reminders for important tasks, follow-ups, and meetings to stay organized.
          </motion.p>
          <motion.div variants={itemVariants}>
            <Button className="bg-[#1a5f7a] hover:bg-[#0c2e3b] text-white shadow-md px-6 py-2 text-base">
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Reminder
            </Button>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl"
          >
            {[
              { icon: Calendar, title: "Schedule Follow-ups", desc: "Never miss an important follow-up" },
              { icon: Clock, title: "Time-based Alerts", desc: "Get notified at the right time" },
              { icon: CheckCircle, title: "Track Completion", desc: "Mark tasks as complete" },
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex flex-col items-center gap-3 p-4 bg-[#e9ecef] rounded-lg shadow-md"
                whileHover={{ y: -5, boxShadow: "0 6px 20px rgba(0,0,0,0.1)" }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-3 rounded-full bg-[#FF6B6B]/10">
                  <item.icon className="h-6 w-6 text-[#FF6B6B]" />
                </div>
                <h4 className="text-base font-medium text-[#333333]">{item.title}</h4>
                <p className="text-sm text-[#666666] text-center">{item.desc}</p>
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
            <h4 className="text-base font-medium text-[#333333] mb-3">Example Reminder</h4>
            <motion.div
              className="bg-white p-4 rounded-md text-sm text-[#333333] text-left flex items-start gap-3 shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="mt-0.5">
                <div className="h-6 w-6 rounded-full border-2 border-[#1a5f7a] flex items-center justify-center"></div>
              </div>
              <div>
                <div className="font-medium">Follow up with Client XYZ</div>
                <div className="text-xs text-[#666666] mt-1">Tomorrow at 10:00 AM</div>
                <div className="text-xs mt-2">Discuss the proposal and timeline for the project</div>
              </div>
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}