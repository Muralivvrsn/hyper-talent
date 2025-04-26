import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Activity, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { usePage } from "../../context/PageContext";

export function EmptyState() {
  const { setCurrentPath } = usePage();

  const buttonVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95 },
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="bg-white border-[#e9ecef]">
        <CardContent className="p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#1a5f7a]/10 flex items-center justify-center mb-4">
            <Activity className="h-6 w-6 text-[#1a5f7a]" />
          </div>
          <h3 className="text-lg font-medium text-[#333333] mb-2">Welcome to your dashboard!</h3>
          <p className="text-[#666666] mb-6 max-w-md">
            Your recent activities will appear here. Start by adding profiles, creating shortcuts, or connecting with your team.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
              <Button
                className="bg-[#1a5f7a] hover:bg-[#0c2e3b] text-white"
                onClick={() => setCurrentPath("/profiles")}
              >
                Add your first profile
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </motion.div>
            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
              <Button
                variant="outline"
                className="border-[#1a5f7a] text-[#1a5f7a] hover:bg-[#f8f9fa]"
                onClick={() => setCurrentPath("/teams")}
              >
                Create a team
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}