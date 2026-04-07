import React from "react";
import { Link } from "react-router-dom";

type CTASectionProps = {
  onSignInClick?: () => void;
};

const CTASection = ({ onSignInClick }: CTASectionProps) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f1f38] to-[#162a4a] px-[5%] py-24 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(59,130,246,0.08),transparent_62%),radial-gradient(circle_at_88%_22%,rgba(37,99,235,0.06),transparent_60%)]" />
      <div className="relative mx-auto max-w-[760px]">
        <h2 className="mb-4 text-[clamp(2rem,4vw,2.75rem)] font-bold text-white">
          Ready to transform your compliance process?
        </h2>
        <p className="mb-8 text-[1.2rem] leading-relaxed text-[#b0c4de]">
          Join thousands of organizations that trust AutoAudit to keep their
          Microsoft 365 environment secure and compliant.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#3b82f6] to-[#2563eb] px-7 py-3 font-semibold text-white shadow-[0_8px_30px_rgba(59,130,246,0.35)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(59,130,246,0.5)]"
            onClick={onSignInClick}
          >
            Start Free Trial
          </button>
          <Link
            className="inline-flex items-center justify-center rounded-full border-2 border-[#3b82f6] px-7 py-3 font-semibold text-[#3b82f6] transition duration-200 hover:-translate-y-0.5 hover:bg-[#3b82f6] hover:text-[#0a1628]"
            to="/contact"
          >
            Schedule Demo
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
