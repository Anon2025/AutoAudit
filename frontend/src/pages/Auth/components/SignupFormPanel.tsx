import React, { useState, type ChangeEvent, type FormEvent, type ReactElement } from "react";
import { ArrowRight, Eye, EyeOff, Mail, Building, User, ShieldCheck } from "lucide-react";
import type { SignUpFormData, SignUpSubmitPayload } from "../signUpTypes";

const TERMS_ERROR_MESSAGE = "Please agree to the terms and privacy policy";
const PASSWORD_MISMATCH_MESSAGE = "These passwords do not match";

type SignupInputFieldName = "firstName" | "lastName" | "email" | "organizationName";

type InputFieldConfig = {
  name: SignupInputFieldName;
  label: string;
  icon: React.ReactNode;
  type: "text" | "email";
  placeholder: string;
};

const inputFields: InputFieldConfig[] = [
  {
    name: "firstName",
    label: "First Name",
    icon: <User size={16} />,
    type: "text",
    placeholder: "First name",
  },
  {
    name: "lastName",
    label: "Last Name",
    icon: <User size={16} />,
    type: "text",
    placeholder: "Last name",
  },
  {
    name: "email",
    label: "Email Address",
    icon: <Mail size={16} />,
    type: "email",
    placeholder: "your.email@company.com",
  },
  {
    name: "organizationName",
    label: "Organization Name",
    icon: <Building size={16} />,
    type: "text",
    placeholder: "Enter your organization name",
  },
];

type SocialButtonConfig = {
  label: string;
  provider: string;
  icon: ReactElement;
  disabled?: boolean;
};

const socialButtons: SocialButtonConfig[] = [
  {
    label: "Google",
    provider: "google",
    icon: (
      <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#FFC107"
          d="M43.611 20.083H42V20H24v8h11.303C33.915 32.659 29.275 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.962 3.038l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"
        />
        <path
          fill="#FF3D00"
          d="M6.306 14.691l6.571 4.819C14.655 16.108 19.001 12 24 12c3.059 0 5.842 1.154 7.962 3.038l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.254 0-9.881-3.317-11.288-7.946l-6.501 5.007C9.535 39.556 16.227 44 24 44z"
        />
        <path
          fill="#1976D2"
          d="M43.611 20.083H42V20H24v8h11.303c-.681 1.793-1.815 3.356-3.245 4.571l.001-.001 6.19 5.238C36.993 39.129 44 34 44 24c0-1.341-.138-2.651-.389-3.917z"
        />
      </svg>
    ),
  },
];

export type SignupFormPanelProps = {
  formData: SignUpFormData;
  onFormChange: (field: keyof SignUpFormData, value: string) => void;
  onSubmit: (payload: SignUpSubmitPayload) => void | Promise<void>;
  onBackToLogin: () => void;
  submitError: string;
};

type PasswordStrength = {
  label: string;
  level: 1 | 2 | 3 | 4;
};

export const getPasswordStrength = (password: string): PasswordStrength | null => {
  if (!password) return null;
  if (password.length < 6) return { label: "Weak", level: 1 };
  let score = 0;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { label: "Weak", level: 1 };
  if (score === 2) return { label: "Fair", level: 2 };
  if (score === 3) return { label: "Good", level: 3 };
  return { label: "Strong", level: 4 };
};

const SignupFormPanel = ({
  formData,
  onFormChange,
  onSubmit,
  onBackToLogin,
  submitError,
}: SignupFormPanelProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const apiBaseUrl = import.meta.env.VITE_API_URL;

  const handleAgreeTermsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setAgreeTerms(checked);

    if (checked && error === TERMS_ERROR_MESSAGE) {
      setError("");
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    onFormChange(name as keyof SignUpFormData, value);
    if (error) setError("");
  };

  const validate = (): boolean => {
    if (!agreeTerms) {
      setError(TERMS_ERROR_MESSAGE);
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(PASSWORD_MISMATCH_MESSAGE);
      return false;
    }
    if (error) setError("");
    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    await onSubmit({ ...formData, agreeTerms: true });
  };

  const handleSocialSignUp = (provider: string) => {
    if (!apiBaseUrl) {
      setError("Missing API configuration. Please set VITE_API_URL.");
      return;
    }

    if (provider === "google") {
      window.location.assign(`${apiBaseUrl}/v1/auth/google/authorize`);
      return;
    }

    setError("Unsupported provider.");
  };

  const strength = getPasswordStrength(formData.password);

  const strengthBarColor: Record<number, string> = {
    1: "bg-red-500",
    2: "bg-orange-400",
    3: "bg-yellow-400",
    4: "bg-green-500",
  };

  const strengthLabelColor: Record<number, string> = {
    1: "text-red-500",
    2: "text-orange-400",
    3: "text-yellow-400",
    4: "text-green-500",
  };

  return (
    <section
      className="flex items-stretch justify-center rounded-[24px]"
      aria-labelledby="signup-form-heading"
    >
      <div className="h-full w-full max-w-[480px] rounded-[18px] bg-[rgba(15,35,56,0.9)] p-9 shadow-[0_30px_60px_rgba(5,9,20,0.45)]">
        <header className="mb-8">
          <h2 id="signup-form-heading" className="mb-2 text-[2rem] leading-tight text-white">
            Create Account
          </h2>
          <p className="text-[#b0c4de]">Start your compliance journey with AutoAudit.</p>
        </header>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {inputFields.slice(0, 2).map((field) => (
              <label key={field.name} className="flex flex-col">
                <span className="mb-[0.4rem] text-[#b0c4de]">{field.label}</span>
                <div className="relative">
                  <span
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b82f6]"
                    aria-hidden="true"
                  >
                    {field.icon}
                  </span>
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    required
                    className="w-full rounded-[12px] border-2 border-[rgba(59,130,246,0.2)] bg-[rgba(255,255,255,0.05)] px-4 py-4 pl-12 text-[1rem] text-white outline-none transition placeholder:text-[#6c7a8d] focus:border-[#3b82f6] focus:bg-[rgba(255,255,255,0.08)] focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
                  />
                </div>
              </label>
            ))}
          </div>

          {inputFields.slice(2).map((field) => (
            <label key={field.name} className="flex flex-col">
              <span className="mb-[0.4rem] text-[#b0c4de]">{field.label}</span>
              <div className="relative">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b82f6]"
                  aria-hidden="true"
                >
                  {field.icon}
                </span>
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  required
                  className="w-full rounded-[12px] border-2 border-[rgba(59,130,246,0.2)] bg-[rgba(255,255,255,0.05)] px-4 py-4 pl-12 text-[1rem] text-white outline-none transition placeholder:text-[#6c7a8d] focus:border-[#3b82f6] focus:bg-[rgba(255,255,255,0.08)] focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
                />
              </div>
            </label>
          ))}

          <label className="flex flex-col">
            <span className="mb-[0.4rem] text-[#b0c4de]">Password</span>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b82f6]"
                aria-hidden="true"
              >
                <ShieldCheck size={16} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                required
                className="w-full rounded-[12px] border-2 border-[rgba(59,130,246,0.2)] bg-[rgba(255,255,255,0.05)] px-4 py-4 pl-12 pr-12 text-[1rem] text-white outline-none transition placeholder:text-[#6c7a8d] focus:border-[#3b82f6] focus:bg-[rgba(255,255,255,0.08)] focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 border-none bg-transparent text-[#b0c4de] transition hover:text-[#3b82f6]"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {strength && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {([1, 2, 3, 4] as const).map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded ${i <= strength.level ? strengthBarColor[strength.level] : "bg-white/10"}`}
                    />
                  ))}
                </div>
                <span className={`w-10 text-right text-xs ${strengthLabelColor[strength.level]}`}>
                  {strength.label}
                </span>
              </div>
            )}
          </label>

          <label className="flex flex-col">
            <span className="mb-[0.4rem] text-[#b0c4de]">Confirm Password</span>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b82f6]"
                aria-hidden="true"
              >
                <ShieldCheck size={16} />
              </span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                className="w-full rounded-[12px] border-2 border-[rgba(59,130,246,0.2)] bg-[rgba(255,255,255,0.05)] px-4 py-4 pl-12 pr-12 text-[1rem] text-white outline-none transition placeholder:text-[#6c7a8d] focus:border-[#3b82f6] focus:bg-[rgba(255,255,255,0.08)] focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 border-none bg-transparent text-[#b0c4de] transition hover:text-[#3b82f6]"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-2 text-[#b0c4de]">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={handleAgreeTermsChange}
              className="mt-[2px] h-[18px] w-[18px] accent-[#3b82f6]"
            />
            <span>
              I agree to the{" "}
              <a href="/#terms" className="text-[#3b82f6] no-underline">
                Terms & Conditions
              </a>{" "}
              and{" "}
              <a href="/#privacy" className="text-[#3b82f6] no-underline">
                Privacy Policy
              </a>
            </span>
          </label>

          {(error || submitError) && (
            <p
              className="rounded-[6px] border border-[rgba(255,80,80,0.3)] bg-[rgba(255,80,80,0.08)] px-[10px] py-2 text-[13px] text-[#ff6b6b]"
              role="alert"
            >
              {error || submitError}
            </p>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_100%)] px-4 py-4 text-[1rem] font-semibold text-white transition hover:-translate-y-[2px] hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)]"
          >
            <span>Create Account</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="my-8 flex items-center text-[0.8rem] uppercase tracking-[1px] text-[#b0c4de] before:h-px before:flex-1 before:bg-[rgba(59,130,246,0.2)] before:content-[''] after:h-px after:flex-1 after:bg-[rgba(59,130,246,0.2)] after:content-['']">
          <span className="px-4">Or sign up with</span>
        </div>

        <div
          className={`mb-6 grid gap-4 ${
            socialButtons.length === 1 ? "grid-cols-1 justify-items-center" : "grid-cols-2"
          }`}
        >
          {socialButtons.map((button) => (
            <button
              key={button.label}
              type="button"
              className="flex w-full max-w-[280px] items-center justify-center gap-2 rounded-[12px] border-2 border-[rgba(59,130,246,0.2)] bg-[rgba(255,255,255,0.04)] px-4 py-[0.9rem] font-semibold text-white transition hover:-translate-y-[2px] hover:border-[#3b82f6]"
              onClick={() => handleSocialSignUp(button.provider)}
              disabled={Boolean(button.disabled)}
              aria-disabled={button.disabled ? "true" : "false"}
              title={button.disabled ? "Coming soon" : `Continue with ${button.label}`}
            >
              <span
                className="grid h-8 w-8 place-items-center rounded-[10px] bg-[rgba(255,255,255,0.08)]"
                aria-hidden="true"
              >
                {button.icon}
              </span>
              <span>{button.label}</span>
            </button>
          ))}
        </div>

        <p className="text-center text-[0.95rem] text-[#b0c4de]">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onBackToLogin}
            className="border-none bg-transparent font-semibold text-[#3b82f6]"
          >
            Sign In
          </button>
        </p>
      </div>
    </section>
  );
};

export default SignupFormPanel;