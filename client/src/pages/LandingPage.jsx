import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import Navbar from '../components/layout/Navbar';
import HeroSection from '../components/sections/HeroSection';
import HowItWorksSection from '../components/sections/HowItWorksSection';
import FeatureSection from '../components/sections/FeatureSection';
import ShowcaseSection from '../components/sections/ShowcaseSection';
import Footer from '../components/layout/Footer';
import { Modal } from '../components/ui';
import { Loader2, AlertCircle } from '../components/ui/Icons';

export function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('login'); // 'login' | 'register'

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleOpenModal = (type) => {
    setModalType(type);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      toast.success("Access Granted. Welcome to the Archive.");
      handleCloseModal();
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

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!email.includes('@') || !email.includes('.')) {
      setError('Enter a valid academic email');
      toast.error('Please enter a valid academic email address.');
      setIsLoading(false);
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      toast.error('Password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/auth/register', { name, email, password });
      toast.success("Account created successfully. Please sign in.");
      setModalType('login');
      setError('');
      setPassword('');
    } catch (err) {
      const errMsg = err.response?.data?.errors?.[0]?.message || 
                     err.response?.data?.errors?.[0]?.msg || 
                     err.response?.data?.message || 
                     'Registration failed. Please try again.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#faf6ef] text-[#1a1a1a] overflow-x-hidden selection:bg-[#8026d3]/20 selection:text-[#8026d3]">
      {/* Subtle Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.012] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9Ii4xIi8+Cjwvc3ZnPg==')] bg-repeat" />

      {/* Navigation */}
      <Navbar onAuthClick={handleOpenModal} />

      <main className="max-w-[1440px] mx-auto px-6 md:px-20 pt-8 pb-12 flex flex-col gap-20">
        {/* Hero Section */}
        <HeroSection onAuthClick={handleOpenModal} />

        {/* The Workflow Sequence */}
        <HowItWorksSection />

        {/* Modules Grid */}
        <FeatureSection />

        {/* Generated Priority Output Document Preview */}
        <ShowcaseSection onAuthClick={handleOpenModal} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Auth Modals (Unified Light-themed overlay matches landing page vibe) */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalType === 'login' ? 'Academic Workspace Login' : 'Create Account'}
        variant="light"
      >
        {error && (
          <div className="flex items-center gap-2.5 text-[#ba1a1a] text-[13px] bg-[#ffdad6]/40 border border-[#ffdad6] rounded-xl p-3.5 mb-6 font-medium">
            <AlertCircle size={15} className="shrink-0 text-[#ba1a1a]" />
            <span>{error}</span>
          </div>
        )}

        {modalType === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5 text-left">
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.1em] mb-2 font-mono">
                Email Address
              </label>
              <input
                type="email"
                required
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 bg-[#f6f3f2] border border-[#cfc2d6]/40 rounded-xl px-4 text-[14.5px] text-[#1b1c1c] outline-none focus:border-[#a04df3]/60 focus:bg-[#ffffff] focus:ring-2 focus:ring-[#2e54fe]/10 transition-all duration-200"
                placeholder="name@domain.com"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.1em] mb-2 font-mono">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 bg-[#f6f3f2] border border-[#cfc2d6]/40 rounded-xl pl-4 pr-10 text-[14.5px] text-[#1b1c1c] outline-none focus:border-[#a04df3]/60 focus:bg-[#ffffff] focus:ring-2 focus:ring-[#2e54fe]/10 transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#a04df3] transition-colors duration-150 cursor-pointer"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#a04df3] text-[#ffffff] hover:bg-[#8026d3] rounded-xl text-[14px] font-bold tracking-wide flex items-center justify-center gap-2 mt-4 shadow-sm hover:shadow-[rgba(160,77,243,0.2)_0px_6px_20px] transition-all duration-200 cursor-pointer disabled:opacity-65"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>

            <p className="text-center text-[13.5px] text-[#76746f] mt-4 font-medium">
              New here?{' '}
              <button
                type="button"
                onClick={() => handleOpenModal('register')}
                className="text-[#a04df3] hover:text-[#8026d3] hover:underline font-bold cursor-pointer"
              >
                Create an account
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-5 text-left">
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.1em] mb-2 font-mono">
                Full Name
              </label>
              <input
                type="text"
                required
                disabled={isLoading}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 bg-[#f6f3f2] border border-[#cfc2d6]/40 rounded-xl px-4 text-[14.5px] text-[#1b1c1c] outline-none focus:border-[#a04df3]/60 focus:bg-[#ffffff] focus:ring-2 focus:ring-[#2e54fe]/10 transition-all duration-200"
                placeholder="John Doe"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.1em] mb-2 font-mono">
                Email Address
              </label>
              <input
                type="email"
                required
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 bg-[#f6f3f2] border border-[#cfc2d6]/40 rounded-xl px-4 text-[14.5px] text-[#1b1c1c] outline-none focus:border-[#a04df3]/60 focus:bg-[#ffffff] focus:ring-2 focus:ring-[#2e54fe]/10 transition-all duration-200"
                placeholder="name@domain.com"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-[#4c4354] uppercase tracking-[0.1em] mb-2 font-mono">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 bg-[#f6f3f2] border border-[#cfc2d6]/40 rounded-xl pl-4 pr-10 text-[14.5px] text-[#1b1c1c] outline-none focus:border-[#a04df3]/60 focus:bg-[#ffffff] focus:ring-2 focus:ring-[#2e54fe]/10 transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#a04df3] transition-colors duration-150 cursor-pointer"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#a04df3] text-[#ffffff] hover:bg-[#8026d3] rounded-xl text-[14px] font-bold tracking-wide flex items-center justify-center gap-2 mt-4 shadow-sm hover:shadow-[rgba(160,77,243,0.2)_0px_6px_20px] transition-all duration-200 cursor-pointer disabled:opacity-65"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>

            <p className="text-center text-[13.5px] text-[#76746f] mt-4 font-medium">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => handleOpenModal('login')}
                className="text-[#a04df3] hover:text-[#8026d3] hover:underline font-bold cursor-pointer"
              >
                Sign in
              </button>
            </p>
          </form>
        )}
      </Modal>
    </div>
  );
}
export default LandingPage;
