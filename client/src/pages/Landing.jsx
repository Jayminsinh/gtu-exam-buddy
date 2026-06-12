/**
 * @file Landing Page
 * @description Premium editorial landing for GTU Exam Buddy.
 *              Typography-driven "Quiet Luxury" aesthetic with
 *              Framer Motion entrance animations.
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// ─── Animation Variants ──────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ─── Feature Data ────────────────────────────────────────────
const features = [
  {
    mark: 'I',
    title: 'CURATED PAPERS',
    image: '/assets/feature-papers.jpeg',
    description:
      'A meticulously organized repository of past examination papers, indexed by branch, semester, and subject.',
  },
  {
    mark: 'II',
    title: 'STRUCTURED SYLLABI',
    image: '/assets/feature-syllabi.png',
    description:
      'Complete syllabus tracking with version history, ensuring you study exactly what is prescribed.',
  },
  {
    mark: 'III',
    title: 'ACADEMIC TAXONOMY',
    image: '/assets/feature-taxonomy.png',
    description:
      'Branches, semesters, and subjects mapped with precision — an architecture built for clarity.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-luxury-ivory">
      {/* ── Navigation Bar ───────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.1 }}
        className="flex items-center justify-between px-8 py-6 md:px-16 lg:px-24"
      >
        <span className="font-serif text-xl tracking-wide text-luxury-espresso">
          GTU Exam Buddy
        </span>
        <Link
          to="/login"
          className="font-sans text-xs tracking-[0.25em] uppercase text-luxury-taupe hover:text-luxury-gold transition-colors duration-500"
        >
          DASHBOARD
        </Link>
      </motion.nav>

      {/* ── Hero Section ─────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 md:py-32 lg:py-40 text-center">
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="font-sans text-[10px] tracking-[0.35em] uppercase text-luxury-taupe mb-8"
        >
          GUJARAT TECHNOLOGICAL UNIVERSITY
        </motion.p>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="font-serif text-5xl md:text-7xl lg:text-8xl font-normal leading-[1.05] text-luxury-espresso max-w-4xl"
        >
          Your Exam Archive,
          <br />
          <span className="italic text-luxury-espresso/80">Elevated.</span>
        </motion.h1>

        {/* Gold accent rule */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="w-12 h-px bg-luxury-gold mt-10 mb-10"
        />

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="font-sans text-sm md:text-base tracking-wide text-luxury-taupe max-w-lg leading-relaxed"
        >
          A refined platform for accessing past examination papers, structured
          syllabi, and academic resources — designed with intention and clarity.
        </motion.p>

        {/* CTA */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="mt-14"
        >
          <Link
            to="/login"
            className="inline-block font-sans text-xs tracking-[0.3em] uppercase px-10 py-4 border-thin border-luxury-charcoal text-luxury-espresso hover:bg-luxury-espresso hover:text-luxury-ivory transition-all duration-500"
          >
            ENTER THE ARCHIVE
          </Link>
        </motion.div>
      </section>

      {/* ── Features Section ─────────────────────────── */}
      <section className="px-6 md:px-16 lg:px-24 pb-24 md:pb-32">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-px bg-luxury-charcoal/10 max-w-6xl mx-auto"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={scaleIn}
              className="bg-luxury-ivory p-10 md:p-12 flex flex-col"
            >
              {/* Feature image with luxury styles */}
              {feature.image && (
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-64 object-cover filter grayscale hover:grayscale-0 transition-all duration-500 mb-4"
                />
              )}

              {/* Roman numeral mark */}
              <span className="font-serif text-3xl text-luxury-gold/50 mb-6">
                {feature.mark}
              </span>

              <h3 className="font-sans text-[11px] tracking-[0.3em] uppercase text-luxury-espresso mb-4">
                {feature.title}
              </h3>

              <p className="font-sans text-sm text-luxury-taupe leading-relaxed">
                {feature.description}
              </p>

              {/* Thin bottom accent */}
              <div className="mt-auto pt-8">
                <div className="w-6 h-px bg-luxury-gold/40" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Asymmetric Image Showcase Panel ─────────── */}
      <section className="px-6 md:px-16 lg:px-24 pb-24 md:pb-32">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            custom={1}
            className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center py-16 border-t-[0.5px] border-luxury-charcoal/20"
          >
            {/* Left side (span 5 cols): elegant typography block */}
            <div className="md:col-span-5 flex flex-col justify-center">
              <span className="font-sans text-[9px] tracking-[0.4em] uppercase text-luxury-gold mb-3">
                THE REGISTRY
              </span>
              <h2 className="font-serif text-3xl text-luxury-espresso mb-4 leading-snug">
                THE CORE REGISTRY — A seamless terminal for past examination papers and structured schemas.
              </h2>
              <div className="w-8 h-px bg-luxury-gold/50 mb-6" />
              <p className="font-sans text-xs text-luxury-taupe leading-relaxed mb-6">
                Engineered for minimal distraction. Map branch structures, check detailed syllabi, and retrieve verified exam papers in a magazine-grade administrative environment.
              </p>
              <Link
                to="/login"
                className="self-start font-sans text-[10px] tracking-[0.2em] uppercase border-b border-luxury-espresso pb-1 text-luxury-espresso hover:text-luxury-gold hover:border-luxury-gold transition-colors duration-300"
              >
                DISCOVER THE STRUCTURE
              </Link>
            </div>

            {/* Right side (span 7 cols): main image asset inside a premium frame */}
            <div className="md:col-span-7 overflow-hidden border-[0.5px] border-luxury-charcoal aspect-video">
              <img
                src="/assets/hero-archive.png"
                alt="Main Core Registry Archive"
                className="w-full h-full object-cover filter grayscale contrast-110 hover:grayscale-0 transition-all duration-700 ease-out"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Divider ──────────────────────────────────── */}
      <div className="max-w-6xl mx-auto w-full px-6 md:px-16 lg:px-24">
        <div className="h-px bg-luxury-charcoal/10" />
      </div>

      {/* ── Philosophy Section ───────────────────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="py-24 md:py-32 px-6 text-center"
      >
        <p className="font-serif text-2xl md:text-3xl italic text-luxury-espresso/60 max-w-2xl mx-auto leading-relaxed">
          "Simplicity is the ultimate sophistication."
        </p>
        <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-luxury-taupe mt-6">
          — LEONARDO DA VINCI
        </p>
      </motion.section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="py-8 px-6 text-center">
        <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-luxury-taupe/60">
          © {new Date().getFullYear()} GTU EXAM BUDDY — ALL RIGHTS RESERVED
        </p>
      </footer>
    </div>
  );
}
