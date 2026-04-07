import React from "react";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "Home", href: "/#main-content" },
  { label: "Features", href: "/#features" },
  { label: "Benefits", href: "/#benefits" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

type LandingHeaderProps = {
  onSignInClick?: () => void;
  hiddenLinks?: string[];
  showSignIn?: boolean;
};

const LandingHeader = ({
  onSignInClick,
  hiddenLinks = [],
  showSignIn = true,
}: LandingHeaderProps) => {
  const hiddenLinkSet = new Set(hiddenLinks.map((link) => link.toLowerCase()));

  return (
    <header className="landing-header sticky top-0 z-50 flex items-center justify-between border-b border-[rgba(59,130,246,0.1)] bg-[rgba(10,22,40,0.95)] px-[5%] py-2 backdrop-blur-xl">
      <Link
        className="inline-flex items-center"
        to="/#main-content"
        aria-label="AutoAudit home"
      >
        <picture>
          <source srcSet="/AutoAudit.webp" type="image/webp" />
          <img
            src="/AutoAudit.png"
            alt="AutoAudit"
            loading="lazy"
            className="block h-[70px] w-auto transition-transform duration-200 hover:scale-[1.03]"
          />
        </picture>
      </Link>

      <nav className="flex flex-wrap items-center justify-end gap-6" aria-label="Primary navigation">
        {navLinks
          .filter((link) => !hiddenLinkSet.has(link.label.toLowerCase()))
          .map((link) =>
            link.href.startsWith("/") ? (
              <Link
                key={link.label}
                to={link.href}
                className="relative py-1 text-sm font-medium text-slate-200 transition-colors duration-200 hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-[#3b82f6] after:transition-all hover:after:w-full"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="relative py-1 text-sm font-medium text-slate-200 transition-colors duration-200 hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-[#3b82f6] after:transition-all hover:after:w-full"
              >
                {link.label}
              </a>
            ),
          )}
        {showSignIn && (
          <button
            type="button"
            onClick={onSignInClick}
            className="rounded-full bg-gradient-to-br from-[#3b82f6] to-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white transition duration-200 hover:from-[#22d3ee] hover:to-[#3b82f6] hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(59,130,246,0.35)]"
          >
            Sign In
          </button>
        )}
      </nav>
    </header>
  );
};

export default LandingHeader;
