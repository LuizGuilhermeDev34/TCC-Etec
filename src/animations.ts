import type { Variants } from "framer-motion";

export const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

export const slideInLeft: Variants = {
  hidden: { x: -28, opacity: 0 },
  show: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const fadeUp: Variants = {
  hidden: { y: 18, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const cardHover = {
  scale: 1.025,
  y: -4,
  boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
  transition: { type: "spring" as const, stiffness: 320, damping: 22 },
};
