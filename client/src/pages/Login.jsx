/**
 * @file Login Page
 * @description Premium, typography-driven Login screen with split-pane layout.
 *              Uses a luxury architectural shadow graphic for the visual pane.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      toast.success("Access Granted. Welcome to the Archive.");
      navigate('/dashboard');
    } catch (err) {
      const errMsg = err.response?.data?.errors?.[0]?.message || 
                     err.response?.data?.errors?.[0]?.msg || 
                     err.response?.data?.message || 
                     'Authentication failed. Please try again.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-luxury-ivory text-luxury-espresso font-sans">
      {/* ── Left Pane: Editorial Form ─────────────────── */}
      <div className="lg:col-span-5 flex flex-col justify-between p-8 md:p-12 lg:p-16 min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Link to="/" className="font-serif text-lg tracking-wide hover:opacity-80 transition-opacity">
            GTU Exam Buddy
          </Link>
          <Link
            to="/register"
            className="font-sans text-[10px] tracking-[0.2em] uppercase text-luxury-taupe hover:text-luxury-gold transition-colors duration-300"
          >
            CREATE ACCOUNT
          </Link>
        </header>

        {/* Center: Sign-In Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-md w-full mx-auto my-auto py-12"
        >
          <span className="font-sans text-[9px] tracking-[0.4em] uppercase text-luxury-gold mb-2 block">
            ADMINISTRATOR PORTAL
          </span>
          <h2 className="font-serif text-4xl mb-3 font-normal leading-tight">
            Sign In
          </h2>
          <div className="w-8 h-px bg-luxury-gold mb-10" />

          {error && (
            <p className="text-xs text-red-600 tracking-wider mb-6 bg-red-50 p-3 border-l-[2.5px] border-red-500 font-sans">
              {error.toUpperCase()}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block font-sans text-[9px] tracking-[0.25em] uppercase text-luxury-taupe"
              >
                EMAIL ADDRESS
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-luxury-charcoal/20 py-2 focus:border-luxury-gold transition-colors duration-300 outline-none text-sm placeholder-luxury-taupe/40"
                placeholder="name@domain.com"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="block font-sans text-[9px] tracking-[0.25em] uppercase text-luxury-taupe"
              >
                PASSWORD
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-luxury-charcoal/20 py-2 focus:border-luxury-gold transition-colors duration-300 outline-none text-sm placeholder-luxury-taupe/40"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full font-sans text-xs tracking-[0.3em] uppercase py-4 border-thin border-luxury-charcoal bg-luxury-espresso text-luxury-ivory hover:bg-transparent hover:text-luxury-espresso transition-all duration-500"
              >
                {isLoading ? 'VERIFYING...' : 'ENTER CONSOLE'}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Footer */}
        <footer className="text-center lg:text-left">
          <p className="font-sans text-[9px] tracking-[0.2em] uppercase text-luxury-taupe/50">
            SECURE ACCESS · VERIFICATION PORTAL
          </p>
        </footer>
      </div>

      {/* ── Right Pane: Luxury Architectural Shadow Graphic ── */}
      <div className="hidden lg:block lg:col-span-7 relative h-screen overflow-hidden">
        {/* Low opacity graphic/dark overlay to look like an expensive lookbook */}
        <div className="absolute inset-0 bg-luxury-espresso/35 z-10 pointer-events-none mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-luxury-espresso/80 via-transparent to-transparent z-15 pointer-events-none" />
        
        <img
          src="/assets/auth-frame.png"
          alt="Luxury Architecture and Shadow"
          className="w-full h-full object-cover filter grayscale contrast-110"
        />

        <div className="absolute bottom-12 left-12 z-20 max-w-md text-luxury-ivory">
          <p className="font-sans text-[9px] tracking-[0.35em] uppercase text-luxury-gold mb-2">
            INTELLECTUAL RIGOR
          </p>
          <p className="font-serif text-lg italic font-light opacity-90 leading-relaxed">
            "A seamless terminal for past examination papers and structured academic schemas."
          </p>
        </div>
      </div>
    </div>
  );
}
