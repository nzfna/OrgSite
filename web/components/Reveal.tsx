'use client';
import { motion, useReducedMotion } from 'framer-motion';
import type { MotionCfg } from '../lib/types';
const FROM = { 'fade-up': { y: 24 }, 'slide-left': { x: -40 }, zoom: { scale: 0.92 }, none: {} } as const;

// Satu pembungkus untuk semua animasi masuk. Preset dipilih user, tanpa menyentuh kode.
export function Reveal({ cfg, delay = 0, children }: { cfg: MotionCfg; delay?: number; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce || cfg.preset === 'none') return <div>{children}</div>;
  return (
    <motion.div initial={{ opacity: 0, ...FROM[cfg.preset] }} whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }} transition={{ duration: cfg.duration ?? 0.6, delay, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}
