import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const Button = React.forwardRef(({
  children,
  to,
  href,
  variant = 'primary',
  className = '',
  onClick,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-sans font-bold tracking-wide transition-all duration-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c9a96e] focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-[#0f172a] text-[#ffffff] hover:bg-[#c9a96e] hover:text-[#0f172a] px-6 py-3.5 text-[14px] shadow-sm',
    secondary: 'bg-[#f8fafc] text-[#0f172a] hover:bg-[#e2e8f0] px-6 py-3.5 text-[14px] border border-[#e2e8f0]',
    accent: 'bg-[#c9a96e] text-[#0f172a] hover:bg-[#0f172a] hover:text-[#ffffff] px-6 py-3.5 text-[14px] shadow-sm',
    ghost: 'text-[#64748b] hover:text-[#0f172a] text-[13px] font-bold py-2 px-4',
    icon: 'w-10 h-10 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-[#0f172a] hover:bg-[#0f172a] hover:text-[#ffffff] hover:border-[#0f172a]'
  };

  const combinedClass = `${baseStyles} ${variants[variant]} ${className}`;

  const motionProps = {
    whileHover: { y: -2, scale: 1.01 },
    whileTap: { y: 0, scale: 0.98 },
    transition: { type: 'spring', stiffness: 500, damping: 25 }
  };

  if (to) {
    return (
      <motion.div {...motionProps} className="inline-block">
        <Link to={to} className={combinedClass} {...props}>
          {children}
        </Link>
      </motion.div>
    );
  }

  if (href) {
    return (
      <motion.div {...motionProps} className="inline-block">
        <a href={href} className={combinedClass} {...props}>
          {children}
        </a>
      </motion.div>
    );
  }

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      className={combinedClass}
      {...motionProps}
      {...props}
    >
      {children}
    </motion.button>
  );
});

Button.displayName = 'Button';
