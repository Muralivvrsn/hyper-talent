import { Button } from "../ui/button";
import { MessageSquarePlus, Send, ThumbsUp, MessageCircle, Lightbulb } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { motion } from "framer-motion";

export function EmptyFeedback() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <motion.div
      className="flex flex-col h-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="p-3 border-b">
        <h3 className="font-semibold text-[#FF6B6B]">Feedback</h3>
      </motion.div>

      <Tabs defaultValue="new" className="flex-1 flex flex-col">
        <motion.div variants={itemVariants}>
          <TabsList className="grid grid-cols-2 mx-3 mt-2">
            <TabsTrigger value="new" className="text-sm">
              New Feedback
            </TabsTrigger>
            <TabsTrigger value="history" className="text-sm">
              History
            </TabsTrigger>
          </TabsList>
        </motion.div>

        <TabsContent value="new" className="flex-1 flex flex-col mt-0 p-0">
          <motion.div
            className="flex-1 overflow-y-auto p-4 space-y-4"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="space-y-2">
              <label htmlFor="feedback-type" className="text-sm font-medium">
                Feedback Type
              </label>
              <select
                id="feedback-type"
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="" disabled selected>
                  Select feedback type
                </option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="improvement">Improvement Suggestion</option>
                <option value="other">Other</option>
              </select>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <label htmlFor="feedback-content" className="text-sm font-medium">
                Your Feedback
              </label>
              <textarea
                id="feedback-content"
                placeholder="Please describe your feedback in detail..."
                rows={5}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[120px] resize-none"
              ></textarea>
            </motion.div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="p-3 border-t mt-auto"
          >
            <Button disabled className="w-full bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white opacity-70">
              <Send className="mr-2 h-4 w-4" />
              Submit Feedback
            </Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="history" className="flex-1 flex flex-col mt-0 p-0">
          <motion.div
            className="flex-1 overflow-y-auto p-4"
            variants={containerVariants}
          >
            <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-4">
              <motion.div
                variants={itemVariants}
                className="w-16 h-16 rounded-full bg-[#FF6B6B]/10 flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <MessageSquarePlus className="h-8 w-8 text-[#FF6B6B]" />
              </motion.div>
              <motion.h3 variants={itemVariants} className="text-lg font-medium">
                No feedback submitted yet
              </motion.h3>
              <motion.p
                variants={itemVariants}
                className="text-muted-foreground max-w-md"
              >
                Your feedback history will appear here once you've submitted feedback.
              </motion.p>

              <motion.div
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-lg mt-4"
              >
                {[
                  { icon: ThumbsUp, desc: "Share your experience" },
                  { icon: MessageCircle, desc: "Report issues" },
                  { icon: Lightbulb, desc: "Suggest improvements" },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="flex flex-col items-center gap-2 p-3 border rounded-md"
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <item.icon className="h-5 w-5 text-[#FF6B6B]" />
                    <span className="text-xs text-center">{item.desc}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}