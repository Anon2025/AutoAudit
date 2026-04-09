import React from "react";
import type { LucideIcon } from "lucide-react";
import { Timer, Target, ShieldCheck, Lightbulb } from "lucide-react";

type Benefit = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const benefits: Benefit[] = [
  {
    icon: Timer,
    title: "Save Time & Resources",
    description:
      "Reduce manual compliance work so your team can focus on strategic initiatives.",
  },
  {
    icon: Target,
    title: "Stay Ahead of Threats",
    description:
      "Proactive monitoring identifies vulnerabilities before they are exploited.",
  },
  {
    icon: ShieldCheck,
    title: "Ensure Compliance",
    description:
      "Stay aligned with cybersecurity frameworks as they get updated with ease",
  },
  {
    icon: Lightbulb,
    title: "Expert Guidance",
    description:
      "Every finding includes prioritized remediation steps to improve security posture.",
  },
];

const BenefitsSection = () => {
  return (
    <section
      className="relative scroll-mt-28 overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f1f38] to-[#162a4a] px-[5%] py-24"
      id="benefits"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(59,130,246,0.08),transparent_62%),radial-gradient(circle_at_88%_22%,rgba(37,99,235,0.06),transparent_60%)]" />
      <div className="relative mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-center gap-12">
        <div
          className="relative min-h-[320px] overflow-hidden rounded-[24px] border border-[rgba(59,130,246,0.1)] bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.25),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(59,130,246,0.25),transparent_60%),linear-gradient(135deg,#1e3a5f,#0a1628)]"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:40px_40px] opacity-60" />
          <div className="absolute inset-0 pointer-events-none">
            <span className="absolute left-[22%] top-[20%] h-4 w-4 rounded-full bg-[#3b82f6] shadow-[0_0_20px_rgba(59,130,246,0.8)]" />
            <span className="absolute left-[60%] top-[40%] h-4 w-4 rounded-full bg-[#2563eb] shadow-[0_0_20px_rgba(59,130,246,0.8)]" />
            <span className="absolute left-[35%] top-[65%] h-4 w-4 rounded-full bg-[#3b82f6] shadow-[0_0_20px_rgba(59,130,246,0.8)]" />
            <span className="absolute left-[80%] top-[30%] h-4 w-4 rounded-full bg-[#2563eb] shadow-[0_0_20px_rgba(59,130,246,0.8)]" />
            <span className="absolute left-[23%] top-[28%] h-[2px] w-[45%] origin-left rotate-[12deg] bg-gradient-to-r from-[#3b82f6] to-transparent opacity-60" />
            <span className="absolute left-[36%] top-[50%] h-[2px] w-[32%] origin-left -rotate-[20deg] bg-gradient-to-r from-[#3b82f6] to-transparent opacity-60" />
            <span className="absolute left-[60%] top-[58%] h-[2px] w-[22%] origin-left rotate-[25deg] bg-gradient-to-r from-[#2563eb] to-transparent opacity-60" />
          </div>
        </div>

        <div>
          <h2 className="mb-7 text-[clamp(2rem,4vw,2.5rem)] font-bold text-white">
            Why Choose AutoAudit?
          </h2>
          {benefits.map((benefit) => (
            <article
              key={benefit.title}
              className="mb-3.5 flex items-start gap-4 rounded-2xl border border-[rgba(59,130,246,0.1)] bg-[rgba(255,255,255,0.02)] p-5 transition duration-300 hover:translate-x-2 hover:border-[#3b82f6] hover:shadow-[0_20px_45px_rgba(59,130,246,0.18)]"
            >
              <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-gradient-to-br from-[#3b82f6] to-[#2563eb] text-[rgba(236,240,255,0.98)] shadow-[0_10px_22px_rgba(59,130,246,0.22)]">
                <benefit.icon size={18} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="mb-1.5 text-xl font-semibold text-white">{benefit.title}</h3>
                <p className="m-0 leading-relaxed text-[#b0c4de]">{benefit.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
