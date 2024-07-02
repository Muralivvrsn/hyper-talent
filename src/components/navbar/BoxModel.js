import React from "react";
import { motion } from "framer-motion";
const BoxModel = ({ highlightStyle }) => {
  return (
    <motion.div
      className="absolute bg-white z-0 bg-[#FCF9F9] border-b-[#CCCCCC] border-b-[1.5px]"
      initial={false}
      animate={{
        right: highlightStyle.right,
        width: highlightStyle.width,
        left: highlightStyle.left,
        height: highlightStyle.height,
        bottom: highlightStyle.bottom,
        top: highlightStyle.top,
        transition: { type: "spring", stiffness: 300, damping: 25 },
      }}
      style={{position:'absolute'}}
    />
  );
};

export default BoxModel;