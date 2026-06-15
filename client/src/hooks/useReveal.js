import { useAnimation } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export function useReveal(options = { threshold: 0.15, rootMargin: '0px' }) {
  const controls = useAnimation();
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        controls.start('visible');
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [controls, options.threshold, options.rootMargin]);

  return { ref, controls, inView };
}
