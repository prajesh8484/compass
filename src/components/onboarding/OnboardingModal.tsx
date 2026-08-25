import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Zap, Command, ShieldCheck, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { projectRepository } from '../../repositories/projectRepository';
import { useProjectStore } from '../../stores/useProjectStore';
import { AppLogo } from '../ui/AppLogo';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SLIDES = [
  {
    id: 'welcome',
    icon: Compass,
    color: '#007AFF', // macOS System Blue
    gradient: 'linear-gradient(135deg, rgba(0, 122, 255, 0.25) 0%, rgba(88, 86, 214, 0.15) 100%)',
    title: 'Welcome to Compass',
    subtitle: 'A local-first task prioritization engine built for developers who care about focus.',
    tagline: 'Local-First Prioritization',
    features: [
      'Focus on ONE priority task at a time with confidence',
      'Zero cloud accounts, telemetry, or network dependency',
      'Instant, liquid-smooth native desktop performance'
    ]
  },
  {
    id: 'engine',
    icon: Zap,
    color: '#FF9500', // macOS System Orange
    gradient: 'linear-gradient(135deg, rgba(255, 149, 0, 0.25) 0%, rgba(255, 59, 48, 0.15) 100%)',
    title: 'Adaptive Priority Engine',
    subtitle: 'Never manually rank or sort task lists ever again.',
    tagline: '9-Factor In-Memory Ranking',
    features: [
      'Multi-factor scoring: Importance, Deadlines, Effort & Project Health',
      'Calculates your exact Focus Task in memory instantly',
      'Automatically surfaces Quick Wins when you need momentum'
    ]
  },
  {
    id: 'keyboard',
    icon: Command,
    color: '#AF52DE', // macOS System Purple
    gradient: 'linear-gradient(135deg, rgba(175, 82, 222, 0.25) 0%, rgba(255, 45, 85, 0.15) 100%)',
    title: 'Keyboard-First Workflow',
    subtitle: 'Designed so your hands never need to leave the keyboard.',
    tagline: 'Lightning Fast Shortcuts',
    keys: [
      { key: 'N', label: 'Create new task anywhere' },
      { key: '⌘ K', label: 'Open global Command Palette' },
      { key: '/', label: 'Focus search instantly' },
      { key: '⌘ ↵', label: 'Save task inside modal' }
    ]
  },
  {
    id: 'clean',
    icon: ShieldCheck,
    color: '#34C759', // macOS System Green
    gradient: 'linear-gradient(135deg, rgba(52, 199, 89, 0.25) 0%, rgba(48, 209, 88, 0.15) 100%)',
    title: 'Zero Workspace Pollution',
    subtitle: 'Your project directories stay 100% clean.',
    tagline: 'Clean SQLite Storage',
    features: [
      'Tasks stay safely in your local SQLite database',
      'Zero auto-dumped markdown files in your project folders',
      'Organize work cleanly by Project → Section / Topic'
    ]
  }
];

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { loadSettings } = useProjectStore();

  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;
  const isLast = currentSlide === SLIDES.length - 1;

  const handleFinish = async () => {
    try {
      await projectRepository.setSetting('has_completed_onboarding', 'true');
      await loadSettings();
    } catch (err) {
      console.error('Failed to save onboarding setting', err);
    }
    onClose();
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  };

  return (
    <AnimatePresence>
      <motion.div
        className="palette-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ zIndex: 2000, backdropFilter: 'blur(20px)', background: 'rgba(0, 0, 0, 0.65)' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          style={{
            width: 560,
            height: 520, // FIXED STABLE HEIGHT to prevent sizing jitter!
            maxWidth: '92vw',
            maxHeight: '90vh',
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between', // Fixed layout structure
            borderRadius: 24, // Apple Squircle curvature
            background: 'rgba(24, 24, 28, 0.92)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 40px 100px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            boxSizing: 'border-box',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Ambient Apple HIG Background Glow */}
          <div
            style={{
              position: 'absolute',
              top: -80,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 320,
              height: 220,
              background: slide.gradient,
              filter: 'blur(60px)',
              pointerEvents: 'none',
              borderRadius: '50%',
              transition: 'background 400ms ease'
            }}
          />

          {/* Slide Content (Fixed height area to prevent shifts) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 16
                }}
              >
                {/* Apple HIG Squircle Icon Badge */}
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  background: slide.gradient,
                  border: `1px solid ${slide.color}40`,
                  boxShadow: `0 12px 30px ${slide.color}25, inset 0 1px 0 rgba(255, 255, 255, 0.3)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {slide.id === 'welcome' ? (
                    <AppLogo size={40} />
                  ) : (
                    <Icon size={36} color={slide.color} strokeWidth={1.8} />
                  )}
                </div>

                <div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: slide.color,
                    marginBottom: 4,
                    display: 'block'
                  }}>
                    {slide.tagline}
                  </span>
                  <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff', marginBottom: 6 }}>
                    {slide.title}
                  </h2>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: '#9ca3af', maxWidth: 440, margin: '0 auto' }}>
                    {slide.subtitle}
                  </p>
                </div>

                {/* Features list / Keycap list */}
                {slide.keys ? (
                  <div style={{
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    marginTop: 8
                  }}>
                    {slide.keys.map((k, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: 12,
                          textAlign: 'left'
                        }}
                      >
                        <kbd style={{
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          padding: '3px 7px',
                          background: 'rgba(255, 255, 255, 0.12)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: 6,
                          color: slide.color,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}>
                          {k.key}
                        </kbd>
                        <span style={{ fontSize: 12, color: '#e5e7eb', fontWeight: 450 }}>{k.label}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '8px 0 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    textAlign: 'left',
                    width: '100%'
                  }}>
                    {slide.features?.map((feat, idx) => (
                      <li
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          fontSize: 13,
                          padding: '9px 14px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: 12,
                          color: '#f3f4f6'
                        }}
                      >
                        <div style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: `${slide.color}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Check size={12} color={slide.color} strokeWidth={2.5} />
                        </div>
                        <span style={{ fontSize: 13, color: '#e5e7eb' }}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Controls (Fixed position at bottom) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 16,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            zIndex: 2
          }}>
            {/* SF Style Spring Pagination Dots */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  style={{
                    width: idx === currentSlide ? 22 : 7,
                    height: 7,
                    borderRadius: 4,
                    background: idx === currentSlide ? slide.color : 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              {currentSlide > 0 && (
                <button
                  className="btn btn--ghost"
                  onClick={handlePrev}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 12,
                    fontSize: 13,
                    color: '#9ca3af'
                  }}
                >
                  <ArrowLeft size={14} /> Back
                </button>
              )}
              {!isLast && (
                <button
                  className="btn btn--ghost"
                  onClick={handleFinish}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 12,
                    fontSize: 13,
                    opacity: 0.6
                  }}
                >
                  Skip
                </button>
              )}
              <button
                className="btn btn--primary"
                onClick={handleNext}
                style={{
                  padding: '8px 18px',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  background: slide.color,
                  border: 'none',
                  boxShadow: `0 4px 14px ${slide.color}40`
                }}
              >
                {isLast ? 'Get Started' : 'Next'} <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
