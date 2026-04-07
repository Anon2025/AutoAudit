import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import LandingHeader from "./components/LandingHeader";
import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import BenefitsSection from "./components/BenefitsSection";
import CTASection from "./components/CTASection";
import LandingFooter from "./components/LandingFooter";

type LandingPageProps = {
  onSignInClick?: () => void;
};

const LandingPage = ({ onSignInClick }: LandingPageProps) => {
  const location = useLocation();

  // Support "/#features" and "/#benefits" nav links without hard reload.
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    if (!id) return;

    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        const header = document.querySelector(".landing-header");
        const headerOffset = header ? header.getBoundingClientRect().height + 12 : 0;
        const targetY = el.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top: targetY, behavior: "smooth" });
        return;
      }
      attempts += 1;
      if (attempts < 20) {
        requestAnimationFrame(tryScroll);
      }
    };
    tryScroll();
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      <a
        className="sr-only z-50 rounded-xl bg-[#3b82f6] px-4 py-2 font-semibold text-white focus:fixed focus:left-4 focus:top-4 focus:not-sr-only"
        href="#main-content"
      >
        Skip to main content
      </a>
      <LandingHeader onSignInClick={onSignInClick} />
      <main id="main-content">
        <HeroSection onSignInClick={onSignInClick} />
        <FeaturesSection />
        <BenefitsSection />
        <CTASection onSignInClick={onSignInClick} />
      </main>
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
