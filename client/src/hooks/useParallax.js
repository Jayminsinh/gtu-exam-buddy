import { useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export function useParallax(range = [0, 100], offset = ["start end", "end start"]) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset
  });

  const y = useTransform(scrollYProgress, [0, 1], range);

  return { ref, y };
}
