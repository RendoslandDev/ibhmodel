import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ApplicationForm from '../components/ApplicationForm';

export default function LandingPage() {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (progressRef.current) progressRef.current.style.width = `${pct * 100}%`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-ibh-dark text-ibh-text">
      {/* Progress bar */}
      <div ref={progressRef} className="fixed top-0 left-0 h-[2px] bg-gold z-50 transition-all duration-100 w-0" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-8 py-5 bg-ibh-dark/90 backdrop-blur-sm border-b border-gold/10">
        <span className="font-cormorant text-xl font-light tracking-[0.2em] text-ibh-cream">
          IBH <span className="text-gold">COMPANY</span>
        </span>
        <Link
          to="/admin/login"
          className="text-[9px] tracking-[0.3em] uppercase text-ibh-muted hover:text-gold transition-colors"
        >
          Admin Portal
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 pt-20">
        {/* Grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(200,150,62,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(200,150,62,0.05) 1px,transparent 1px)',
            backgroundSize: '80px 80px',
            maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%,black 30%,transparent 80%)',
          }}
        />
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(200,150,62,0.12),transparent)]" />

        {/* Corner accents */}
        {[
          'top-10 left-10 border-t border-l',
          'top-10 right-10 border-t border-r',
          'bottom-10 left-10 border-b border-l',
          'bottom-10 right-10 border-b border-r',
        ].map((cls, i) => (
          <div key={i} className={`absolute w-16 h-16 border-gold/25 ${cls}`} />
        ))}

        <div className="relative z-10 text-center max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="ibh-section-tag mb-8"
          >
            IBH Company — Talent Roster
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="font-cormorant text-[clamp(64px,12vw,130px)] font-light leading-[0.88] tracking-tight text-ibh-cream mb-4"
          >
            Join<br /><em className="italic text-gold-light">IBH</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="font-cormorant text-2xl font-light italic text-ibh-muted mb-10 tracking-wider"
          >
            Where presence becomes legacy
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="w-px h-14 bg-gradient-to-b from-transparent via-gold to-transparent mx-auto mb-8"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-xs text-ibh-muted tracking-widest leading-loose max-w-md mx-auto mb-12"
          >
            We seek extraordinary individuals for fashion & runway, commercial & print, and fitness & lifestyle representation. Complete the application below to be considered for IBH's exclusive talent roster.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
          >
            <a href="#apply" className="ibh-btn-primary inline-flex">
              <span>Begin Application</span>
              <svg width="20" height="8" viewBox="0 0 20 8" fill="none">
                <path d="M0 4h18M14 1l4 3-4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </a>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <div className="w-px h-10 bg-gradient-to-b from-gold to-transparent animate-pulse" />
          <span className="text-[9px] tracking-[0.4em] text-ibh-muted uppercase">Scroll</span>
        </motion.div>
      </section>

      {/* What we offer */}
      <section className="relative py-24 px-6 bg-ibh-dark-2">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="ibh-section-tag block mb-4">What We Offer</span>
            <h2 className="font-cormorant text-5xl font-light text-ibh-cream">
              Three <em className="italic text-gold-light">Disciplines</em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: '01', title: 'Fashion & Runway', desc: 'Catwalk, designer showcases, editorial, and high-fashion campaigns with top African and international brands.' },
              { num: '02', title: 'Commercial & Print', desc: 'Advertising campaigns, product photography, e-commerce, and digital content creation for leading brands.' },
              { num: '03', title: 'Fitness & Lifestyle', desc: 'Health, wellness, activewear, and aspirational lifestyle content for modern, forward-thinking brands.' },
            ].map(({ num, title, desc }) => (
              <div key={num} className="ibh-card ibh-corner-box group hover:border-gold/20 transition-colors duration-300">
                <span className="font-cormorant text-gold/30 text-4xl font-light block mb-4">{num}</span>
                <h3 className="font-cormorant text-xl text-ibh-cream mb-3">{title}</h3>
                <p className="text-xs text-ibh-muted leading-relaxed tracking-wide">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application form */}
      <section id="apply" className="bg-ibh-dark-2 relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
        <ApplicationForm />
      </section>

      {/* Footer */}
      <footer className="border-t border-gold/10 py-10 px-6 text-center bg-ibh-dark">
        <p className="font-cormorant text-lg text-ibh-cream mb-1">IBH <span className="text-gold">COMPANY</span></p>
        <p className="text-[10px] text-ibh-muted/50 tracking-widest">© {new Date().getFullYear()} · All Rights Reserved · Talent Management & Representation</p>
      </footer>
    </div>
  );
}
