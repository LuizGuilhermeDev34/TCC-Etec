import { ReactNode } from "react";
import { motion } from "framer-motion";

interface PageTransitionProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right";
}

/**
 * Wrapper de transição premium com Framer Motion
 * Aplica animações de fade-in + movimento suave
 */
export function PageTransition({
  children,
  direction = "up",
}: PageTransitionProps) {
  const getInitialState = () => {
    const offsetDistance = 30;
    switch (direction) {
      case "up":
        return { y: offsetDistance, opacity: 0 };
      case "down":
        return { y: -offsetDistance, opacity: 0 };
      case "left":
        return { x: offsetDistance, opacity: 0 };
      case "right":
        return { x: -offsetDistance, opacity: 0 };
      default:
        return { y: offsetDistance, opacity: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitialState()}
      animate={{ x: 0, y: 0, opacity: 1, transition: { duration: 0.35, ease: "easeOut" } }}
      exit={{ opacity: 0, transition: { duration: 0.12, ease: "easeIn" } }}
    >
      {children}
    </motion.div>
  );
}
