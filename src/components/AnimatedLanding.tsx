
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function AnimatedLanding() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const title = titleRef.current;
    const cta = ctaRef.current;
    const nav = navRef.current;
    const video = videoRef.current;

    if (!container || !title || !cta || !nav || !video) return;

    // Set initial states
    gsap.set([title, cta], { opacity: 0, y: 100 });
    gsap.set(nav, { opacity: 0, y: -50 });
    gsap.set(video, { scale: 1.1, opacity: 0 });

    // Create timeline
    const tl = gsap.timeline();

    // Animate video entrance
    tl.to(video, {
      opacity: 1,
      scale: 1,
      duration: 2,
      ease: "power2.out"
    })
    // Animate nav entrance
    .to(nav, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power2.out"
    }, "-=1.5")
    // Animate title entrance
    .to(title, {
      opacity: 1,
      y: 0,
      duration: 1.5,
      ease: "power2.out"
    }, "-=1")
    // Animate CTA entrance
    .to(cta, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power2.out"
    }, "-=0.5");

    // Add scroll-triggered animations
    ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: "bottom top",
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        gsap.to(video, {
          scale: 1 + progress * 0.2,
          duration: 0.3
        });
        gsap.to(title, {
          y: -progress * 100,
          opacity: 1 - progress * 0.5,
          duration: 0.3
        });
      }
    });

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden">
      {/* Background Video */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-0"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="https://drive.google.com/uc?export=download&id=1ACuNMStPhCWflm3lEm_9WW2sTrQsivnX" type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* Navigation */}
      <nav ref={navRef} className="relative z-20 w-full bg-transparent backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/b67f1a2b-54ff-4178-8050-c93aee78de22.png" 
              alt="ContentOasis" 
              className="h-8 w-auto"
            />
            <span className="text-2xl font-bold text-white">ContentOasis</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm text-white/80 hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-white/80 hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#testimonials" className="text-sm text-white/80 hover:text-white transition-colors">
              Testimonials
            </a>
            <a href="#pricing" className="text-sm text-white/80 hover:text-white transition-colors">
              Pricing
            </a>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-20 flex items-center justify-center min-h-screen pt-20">
        <div className="text-center">
          <h1 
            ref={titleRef}
            className="text-6xl md:text-8xl lg:text-9xl font-bold text-white mb-8 leading-tight"
            style={{ 
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            The Stage Is Yours.
          </h1>
          
          <div ref={ctaRef}>
            <Link to="/auth">
              <Button 
                size="lg" 
                className="text-lg px-12 py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-2xl"
              >
                Start Creating
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
