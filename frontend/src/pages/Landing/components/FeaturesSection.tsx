import React from "react";
import { landingFeatures, type LandingFeature } from "../featuresData";

const FeatureCard = ({ icon: Icon, title, description }: LandingFeature) => (
  <article className="group relative overflow-hidden rounded-[20px] border border-[rgb(var(--brand-blue)/0.1)] bg-[rgb(255_255_255/0.03)] p-8 transition duration-300 hover:-translate-y-2 hover:border-[rgb(var(--brand-blue))] hover:shadow-[0_20px_45px_rgb(var(--brand-blue)/0.2)]">
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[rgb(var(--brand-blue)/0.15)] to-[rgb(var(--brand-blue)/0.12)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    <div className="relative z-[1] mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] border border-[rgb(255_255_255/0.08)] bg-gradient-to-br from-[rgb(var(--brand-blue))] to-[rgb(var(--brand-blue-deep))] text-[rgb(236_240_255/0.98)] shadow-[0_10px_22px_rgb(var(--brand-blue)/0.22)]">
      <Icon size={18} strokeWidth={2.2} />
    </div>
    <h3 className="relative z-[1] mb-3 text-xl font-semibold">{title}</h3>
    <p className="relative z-[1] leading-relaxed text-[rgb(var(--landing-text-soft))]">{description}</p>
  </article>
);

const FeaturesSection = () => {
  return (
    <section
      className="relative scroll-mt-28 overflow-hidden bg-gradient-to-br from-[rgb(var(--landing-bg-base))] via-[rgb(var(--landing-bg-mid))] to-[rgb(var(--landing-bg-end))] px-[5%] py-24"
      id="features"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgb(var(--brand-blue)/0.08),transparent_62%),radial-gradient(circle_at_88%_22%,rgb(var(--brand-blue-deep)/0.06),transparent_60%)]" />
      <div className="relative mx-auto mb-12 max-w-[720px] text-center">
        <h2 className="mb-2 text-[clamp(1.5rem,3vw,2.2rem)] font-bold text-[rgb(var(--brand-blue))]">
          Features
        </h2>
        <h3 className="mb-4 text-[clamp(2.25rem,4vw,2.8rem)] font-bold text-white">
          Everything you need for compliance
        </h3>
        <p className="leading-relaxed text-[rgb(var(--landing-text-soft))]">
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
