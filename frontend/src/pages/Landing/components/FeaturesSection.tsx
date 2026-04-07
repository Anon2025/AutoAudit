import React from "react";
import { landingFeatures, type LandingFeature } from "../featuresData";

const FeatureCard = ({ icon: Icon, title, description }: LandingFeature) => (
  <article className="group relative overflow-hidden rounded-[20px] border border-[rgba(59,130,246,0.1)] bg-[rgba(255,255,255,0.03)] p-8 transition duration-300 hover:-translate-y-2 hover:border-[#3b82f6] hover:shadow-[0_20px_45px_rgba(59,130,246,0.2)]">
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[rgba(59,130,246,0.15)] to-[rgba(59,130,246,0.12)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    <div className="relative z-[1] mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-gradient-to-br from-[#3b82f6] to-[#2563eb] text-[rgba(236,240,255,0.98)] shadow-[0_10px_22px_rgba(59,130,246,0.22)]">
      <Icon size={18} strokeWidth={2.2} />
    </div>
    <h3 className="relative z-[1] mb-3 text-xl font-semibold">{title}</h3>
    <p className="relative z-[1] leading-relaxed text-[#b0c4de]">{description}</p>
  </article>
);

const FeaturesSection = () => {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f1f38] to-[#162a4a] px-[5%] py-24"
      id="features"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(59,130,246,0.08),transparent_62%),radial-gradient(circle_at_88%_22%,rgba(37,99,235,0.06),transparent_60%)]" />
      <div className="relative mx-auto mb-12 max-w-[720px] text-center">
        <h2 className="mb-2 text-[clamp(1.5rem,3vw,2.2rem)] font-bold text-[#3b82f6]">
          Features
        </h2>
        <h3 className="mb-4 text-[clamp(2.25rem,4vw,2.8rem)] font-bold text-white">
          Everything you need for compliance
        </h3>
        <p className="leading-relaxed text-[#b0c4de]">
          Comprehensive tools and insights to keep your organization secure and
          audit-ready.
        </p>
      </div>

      <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {landingFeatures.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
