import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Users, MessageSquare, Bell, UserPlus, Link2, ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";
import { usePage } from "../../context/PageContext";

const features = [
  {
    title: "Profile Management",
    description: "Create and organize profiles with custom labels and notes.",
    icon: Users,
    href: "/profiles",
    color: "text-[#4ECDC4]",
    bgColor: "bg-[#4ECDC4]/10",
  },
  {
    title: "Message Shortcuts",
    description: "Save time with reusable message templates.",
    icon: MessageSquare,
    href: "/shortcuts",
    color: "text-[#1A85FF]",
    bgColor: "bg-[#1A85FF]/10",
  },
  {
    title: "Smart Reminders",
    description: "Never miss a follow-up with scheduled reminders.",
    icon: Bell,
    href: "/reminders",
    color: "text-[#FF6B6B]",
    bgColor: "bg-[#FF6B6B]/10",
  },
  {
    title: "Team Collaboration",
    description: "Work together with your team members.",
    icon: UserPlus,
    href: "/teams",
    color: "text-[#06D6A0]",
    bgColor: "bg-[#06D6A0]/10",
  },
  {
    title: "Powerful Integrations",
    description: "Connect with your favorite tools and services.",
    icon: Link2,
    href: "/integrations",
    color: "text-[#9381FF]",
    bgColor: "bg-[#9381FF]/10",
  },
];

export function FeatureHighlights() {
  const { setCurrentPath } = usePage();

  const cardVariants = {
    hover: { scale: 1.02, transition: { duration: 0.2 } },
    tap: { scale: 0.98 },
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-[#333333]">Explore Features</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              whileHover="hover"
              whileTap="tap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setCurrentPath(feature.href)}
            >
              <Card className="h-full bg-white border-[#e9ecef] transition-all hover:shadow-md hover:border-[#1a5f7a] cursor-pointer group">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-2 rounded-md transition-colors", feature.bgColor, "group-hover:bg-opacity-70")}>
                      <feature.icon className={cn("h-5 w-5", feature.color)} />
                    </div>
                    <CardTitle className="text-base text-[#333333] group-hover:text-[#1a5f7a] transition-colors">
                      {feature.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-[#666666]">{feature.description}</CardDescription>
                  <div className="flex justify-end mt-2">
                    <span className="text-xs text-[#1a5f7a] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                      Explore
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}