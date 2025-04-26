import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "../components/PageHeader";
// import { ActivityFeed } from "../components";
import { EmptyState } from "../components/home/EmptyState";
import { FeatureHighlights } from "../components/home/FeatureHighlights";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const hasActivities = user?.recentActivity > 0; // Assuming recentActivity is a number/count

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-4 max-w-7xl mx-auto"
    >
      <PageHeader title="Home" description="Your dashboard and recent activity" className="text-[#333333]" />

      {hasActivities ? (
        // <ActivityFeed />
        <></>
      ) : (
        <div className="space-y-8">
          <EmptyState />
          <FeatureHighlights />
        </div>
      )}
    </motion.div>
  );
}