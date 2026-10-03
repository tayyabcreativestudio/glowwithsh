import React, { useRef, useState, useEffect } from 'react';
import { ArrowRight, Play, Pause } from 'lucide-react';
import { HomepageCMS } from '../../types';

interface HeroSectionProps {
  cms: HomepageCMS['hero'];
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  cms,
  onPrimaryClick,
  onSecondaryClick,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);
  const [mobileVideo, setMobileVideo] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
      setPrefersReducedMotion(mediaQuery.matches || Boolean(connection?.saveData));
      setMobileVideo(window.matchMedia('(max-width: 767px)').matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
    }
  }, []);

  // The decorative video is downloaded only when the visitor presses Play.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;

    if (videoEnabled && !prefersReducedMotion) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            setIsPlaying(false);
          });
      }
    }
  }, [videoEnabled, prefersReducedMotion, cms.videoUrl]);

  const togglePlay = () => {
    if (!videoEnabled) { setVideoEnabled(true); return; }
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const defaultPoster = !cms.posterImage || /^\/images\/hero[_-]poster(?:_v2)?\.(webp|jpg)/.test(cms.posterImage);
  const posterSrc = defaultPoster ? `/images/hero-poster-${mobileVideo ? 640 : 1920}.webp` : cms.posterImage;
  const posterSrcSet = defaultPoster ? '/images/hero-poster-640.webp 640w, /images/hero-poster-1280.webp 1280w, /images/hero-poster-1920.webp 1920w' : undefined;
  const videoSrc = (cms.videoUrl && !cms.videoUrl.includes('hero_glowwithsh')) ? cms.videoUrl : '/videos/hero_skincare.mp4';
  const selectedVideoSrc = mobileVideo ? (cms.mobileVideoUrl || '/videos/hero_mobile_v2.mp4') : videoSrc;

  return (
    <section
      id="hero-cinematic-section"
      className="relative w-full min-h-[82vh] lg:min-h-[92vh] flex items-center justify-center overflow-hidden"
      style={{
        minHeight: 'clamp(580px, 88vh, 960px)',
        background: 'linear-gradient(135deg, #1E1630 0%, #2D1F4E 40%, #3B2571 100%)',
      }}
    >
      {/* Animated decorative orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-[#A78BFA]/15 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-32 right-16 w-80 h-80 bg-[#C084FC]/12 rounded-full blur-3xl animate-float-delay pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#7C3AED]/8 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />

      {/* Video Background with Direct Source & Fallbacks */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <img
          src={posterSrc}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          srcSet={posterSrcSet}
          sizes="100vw"
          width="1920"
          height="1080"
          className="w-full h-full object-cover object-center opacity-60"
        />
        {videoEnabled && !videoError && !prefersReducedMotion && (
          <video
            key={selectedVideoSrc}
            ref={videoRef}
            src={selectedVideoSrc}
            autoPlay
            muted
            aria-hidden="true"
            tabIndex={-1}
            loop
            playsInline
            preload="none"
            poster={posterSrc}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onCanPlay={() => setVideoReady(true)}
            onError={() => setVideoError(true)}
            className={`absolute inset-0 w-full h-full object-cover object-center ${videoReady ? 'opacity-80' : 'opacity-0'}`}
          >
          </video>
        )}

        {/* Purple gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(30, 22, 48, 0.82) 0%, rgba(45, 31, 78, 0.45) 45%, rgba(59, 37, 113, 0.3) 100%)',
          }}
        />
      </div>

      {/* Hero Typography & CTA Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white pt-12 pb-20">
        {/* Eyebrow */}
        <div
          className="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full shadow-lg"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(167, 139, 250, 0.3)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />
          <span className="text-[10px] sm:text-xs tracking-[0.25em] font-sans uppercase font-medium text-white/90">
            {cms.eyebrow || 'GLOWWITHS•H ATELIER'}
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-white max-w-3xl mx-auto leading-[1.08] mb-6 drop-shadow-lg">
          {cms.headline || 'Your Glow, Your Ritual.'}<span className="sr-only"> — GlowWithSH Skincare &amp; Beauty</span>
        </h1>

        {/* Subheadline */}
        <p className="font-sans text-sm sm:text-base lg:text-lg text-white/85 max-w-xl mx-auto font-light leading-relaxed mb-9 drop-shadow-sm">
          {cms.subheadline ||
            'Beauty essentials created to become part of the way you care for and express yourself.'}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
          <button
            id="hero-primary-cta"
            onClick={onPrimaryClick}
            className="w-full sm:w-auto px-8 py-3.5 glass-btn-primary font-sans font-semibold text-xs tracking-[0.14em] uppercase rounded-xl flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>{cms.primaryCtaText || 'SHOP PRODUCTS'}</span>
            <ArrowRight
              size={14}
              className="text-white group-hover:translate-x-1 transition-transform"
            />
          </button>

          <button
            id="hero-secondary-cta"
            onClick={onSecondaryClick}
            className="w-full sm:w-auto px-8 py-3.5 font-sans font-medium text-xs tracking-[0.14em] uppercase rounded-xl cursor-pointer transition-all duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.2)';
              (e.target as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.1)';
              (e.target as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
          >
            {cms.secondaryCtaText || 'DISCOVER OUR STORY'}
          </button>
        </div>
      </div>

      {/* Video Interactive Controls: Play/Pause & Sound */}
      {!videoError && !prefersReducedMotion && (
        <div className="absolute bottom-7 right-6 z-20 flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(167, 139, 250, 0.3)',
              color: 'white',
            }}
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
            title={isPlaying ? 'Pause video' : 'Play video'}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} className="translate-x-0.5" />}
          </button>

        </div>
      )}

      {/* Subtle Bottom Scroll Cue */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center opacity-75 hover:opacity-100 transition-opacity pointer-events-none">
        <span className="text-[10px] tracking-[0.25em] font-sans uppercase text-white/80">
          Scroll to explore
        </span>
        <div className="w-[1px] h-5 bg-[#A78BFA] mt-2 opacity-70" />
      </div>
    </section>
  );
};
