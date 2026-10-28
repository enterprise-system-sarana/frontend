import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthService, type RegisterRequest } from "@/services/auth/auth.service";
import {
  User,
  Lock,
  Mail,
  Phone,
  AtSign,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Smartphone,
} from "lucide-react";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { useLanguage } from "@/i18n/LanguageContext";
import { ROUTERS } from "@/constants/Route";

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterRequest>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const isKm = language === "km";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.password !== formData.confirmPassword) {
      setError(
        isKm ? "ពាក្យសម្ងាត់ផ្ទៀងផ្ទាត់មិនត្រូវគ្នាទេ" : "Passwords do not match."
      );
      return;
    }

    if (formData.password.length < 6) {
      setError(
        isKm
          ? "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ"
          : "Password must be at least 6 characters."
      );
      return;
    }

    setIsLoading(true);

    try {
      await AuthService.register(formData);
      setSuccess(
        isKm
          ? "ការចុះឈ្មោះបានជោគជ័យ! កំពុងបញ្ជូនទៅកាន់ទំព័រចូលប្រព័ន្ធ..."
          : "Account created successfully! Redirecting to sign in..."
      );
      setTimeout(() => {
        navigate(ROUTERS.LOGIN);
      }, 1500);
    } catch (err: any) {
      console.error("Register error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          (isKm
            ? "ការចុះឈ្មោះមិនបានសម្រេច សូមពិនិត្យព័ត៌មានម្តងទៀត"
            : "Failed to register. Please check your information and try again.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center p-4 sm:p-6 bg-cover bg-center overflow-x-hidden select-none"
      style={{
        backgroundImage: "url('/login-bg.jpg')",
        backgroundColor: "#0b1329",
      }}
    >
      {/* Ambient store overlay for premium contrast & focus */}
      <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px] pointer-events-none" />

      {/* Floating Language Toggle in Top Right */}
      <div className="absolute top-4 right-4 z-30">
        <div className="bg-white/90 backdrop-blur-md rounded-xl p-1 shadow-md border border-white/60">
          <LanguageToggle />
        </div>
      </div>

      {/* Main Register Card */}
      <div className="relative z-10 w-full max-w-[840px] rounded-[26px] bg-white shadow-[0_25px_65px_-15px_rgba(0,0,0,0.38)] overflow-hidden grid grid-cols-1 md:grid-cols-[40%_60%] min-h-[520px] my-6">
        {/* ================= LEFT BRAND PANEL (360° PHONE SHOP) ================= */}
        <div
          className="relative flex flex-col items-center justify-center px-6 sm:px-8 py-10 overflow-hidden min-h-[220px] md:min-h-full"
          style={{
            background:
              "linear-gradient(90deg, #0049be 0%, #0049be 46%, #005ae6 46%, #005ae6 100%)",
          }}
        >
          {/* Subtle vertical divide line */}
          <div className="absolute inset-y-0 left-[46%] w-[1px] bg-white/10 pointer-events-none" />

          {/* 3D Sphere 1 (Bottom Left - Cyan / Blue gradient) */}
          <div
            className="absolute -bottom-10 -left-10 size-40 sm:size-44 rounded-full pointer-events-none z-10"
            style={{
              background:
                "radial-gradient(circle at 35% 30%, #38d6fc 0%, #00a0e3 28%, #0077b6 58%, #023e8a 85%, #001f4d 100%)",
              boxShadow: "0 15px 35px rgba(0, 20, 60, 0.4)",
            }}
          />

          {/* 3D Sphere 2 (Bottom Center-Right - Royal Blue gradient) */}
          <div
            className="absolute bottom-1 left-24 sm:left-28 size-28 sm:size-32 rounded-full pointer-events-none z-10"
            style={{
              background:
                "radial-gradient(circle at 36% 30%, #38bdf8 0%, #0066ff 32%, #004ecc 62%, #002c80 88%, #001642 100%)",
              boxShadow: "0 15px 35px rgba(0, 15, 50, 0.45)",
            }}
          />

          {/* Brand Identity: 360° Phone Shop */}
          <div className="relative z-20 flex flex-col items-center text-center -mt-2">
            {/* Store Circular Logo Badge */}
            <div className="relative mb-3.5 flex items-center justify-center">
              <div className="size-20 sm:size-22 rounded-full bg-white/15 backdrop-blur-md p-1 border-2 border-white/40 shadow-xl flex items-center justify-center group">
                <img
                  src="/logo.png"
                  alt="360° Phone Shop"
                  className="size-full rounded-full object-cover shadow-inner"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = "none";
                    if (target.nextElementSibling) {
                      (target.nextElementSibling as HTMLElement).style.display = "flex";
                    }
                  }}
                />
                <div className="hidden size-full items-center justify-center text-white">
                  <Smartphone className="size-10" />
                </div>
              </div>
            </div>

            {/* Store Title: 360° */}
            <h1 className="text-4xl sm:text-[44px] font-black tracking-wider text-white drop-shadow-md font-sans leading-none flex items-center justify-center">
              360°
            </h1>

            {/* Sub-brand: ─ Phone Shop ─ */}
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="w-5 sm:w-6 h-[1.5px] bg-white/85 rounded-full" />
              <span className="text-white text-xs sm:text-[13px] font-bold tracking-[0.22em] uppercase font-sans">
                Phone Shop
              </span>
              <span className="w-5 sm:w-6 h-[1.5px] bg-white/85 rounded-full" />
            </div>

            {/* Khmer / English Tagline for Phone Shop */}
            <p className="mt-2.5 text-[11px] sm:text-xs text-blue-100/90 font-medium tracking-wide">
              {isKm ? "ហាងលក់ទូរស័ព្ទដៃទំនើប" : "Smartphones & Accessories"}
            </p>
          </div>
        </div>

        {/* ================= RIGHT FORM PANEL ================= */}
        <div className="relative bg-white px-7 sm:px-10 py-8 sm:py-9 flex flex-col justify-center">
          {/* Decorative Blue Circle in Bottom-Right Corner */}
          <div
            className="absolute -bottom-9 -right-9 size-24 rounded-full pointer-events-none z-0"
            style={{ backgroundColor: "#0062ea" }}
          />

          <div className="relative z-10 w-full">
            {/* Header */}
            <h2 className="text-[22px] font-bold text-slate-900 tracking-tight mb-4">
              {isKm ? "ចុះឈ្មោះគណនី" : "Create Account"}
            </h2>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Row 1: First Name & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="relative flex items-center bg-[#f8fafc] border border-[#dbe2eb] rounded-[6px] px-3 h-[40px] transition-all focus-within:border-[#0062ea] focus-within:ring-2 focus-within:ring-[#0062ea]/15">
                  <User className="size-4 text-slate-500 shrink-0 mr-2.5" />
                  <input
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder={isKm ? "នាមត្រកូល *" : "First Name *"}
                    disabled={isLoading}
                    required
                    className="w-full bg-transparent text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none font-normal"
                  />
                </div>

                <div className="relative flex items-center bg-[#f8fafc] border border-[#dbe2eb] rounded-[6px] px-3 h-[40px] transition-all focus-within:border-[#0062ea] focus-within:ring-2 focus-within:ring-[#0062ea]/15">
                  <User className="size-4 text-slate-500 shrink-0 mr-2.5" />
                  <input
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder={isKm ? "នាមខ្លួន *" : "Last Name *"}
                    disabled={isLoading}
                    required
                    className="w-full bg-transparent text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none font-normal"
                  />
                </div>
              </div>

              {/* Row 2: Username & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="relative flex items-center bg-[#f8fafc] border border-[#dbe2eb] rounded-[6px] px-3 h-[40px] transition-all focus-within:border-[#0062ea] focus-within:ring-2 focus-within:ring-[#0062ea]/15">
                  <AtSign className="size-4 text-slate-500 shrink-0 mr-2.5" />
                  <input
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder={isKm ? "ឈ្មោះអ្នកប្រើប្រាស់ *" : "Username *"}
                    autoComplete="username"
                    disabled={isLoading}
                    required
                    className="w-full bg-transparent text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none font-normal"
                  />
                </div>

                <div className="relative flex items-center bg-[#f8fafc] border border-[#dbe2eb] rounded-[6px] px-3 h-[40px] transition-all focus-within:border-[#0062ea] focus-within:ring-2 focus-within:ring-[#0062ea]/15">
                  <Phone className="size-4 text-slate-500 shrink-0 mr-2.5" />
                  <input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={isKm ? "លេខទូរស័ព្ទ" : "Phone Number"}
                    disabled={isLoading}
                    className="w-full bg-transparent text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none font-normal"
                  />
                </div>
              </div>

              {/* Row 3: Email */}
              <div className="relative flex items-center bg-[#f8fafc] border border-[#dbe2eb] rounded-[6px] px-3 h-[40px] transition-all focus-within:border-[#0062ea] focus-within:ring-2 focus-within:ring-[#0062ea]/15">
                <Mail className="size-4 text-slate-500 shrink-0 mr-2.5" />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={isKm ? "អ៊ីមែល *" : "Email Address *"}
                  autoComplete="email"
                  disabled={isLoading}
                  required
                  className="w-full bg-transparent text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none font-normal"
                />
              </div>

              {/* Row 4: Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="relative flex items-center bg-[#f8fafc] border border-[#dbe2eb] rounded-[6px] px-3 h-[40px] transition-all focus-within:border-[#0062ea] focus-within:ring-2 focus-within:ring-[#0062ea]/15">
                  <Lock className="size-4 text-slate-500 shrink-0 mr-2.5" />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={isKm ? "ពាក្យសម្ងាត់ *" : "Password *"}
                    autoComplete="new-password"
                    disabled={isLoading}
                    required
                    className="w-full bg-transparent text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none font-normal pr-1"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-[10px] font-bold text-[#0062ea] hover:text-blue-700 tracking-wider uppercase transition-colors shrink-0 cursor-pointer select-none py-1 px-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (isKm ? "លាក់" : "HIDE") : isKm ? "បង្ហាញ" : "SHOW"}
                  </button>
                </div>

                <div className="relative flex items-center bg-[#f8fafc] border border-[#dbe2eb] rounded-[6px] px-3 h-[40px] transition-all focus-within:border-[#0062ea] focus-within:ring-2 focus-within:ring-[#0062ea]/15">
                  <Lock className="size-4 text-slate-500 shrink-0 mr-2.5" />
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder={isKm ? "ផ្ទៀងផ្ទាត់ពាក្យសម្ងាត់ *" : "Confirm Password *"}
                    autoComplete="new-password"
                    disabled={isLoading}
                    required
                    className="w-full bg-transparent text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none font-normal pr-1"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="text-[10px] font-bold text-[#0062ea] hover:text-blue-700 tracking-wider uppercase transition-colors shrink-0 cursor-pointer select-none py-1 px-1"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (isKm ? "លាក់" : "HIDE") : isKm ? "បង្ហាញ" : "SHOW"}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600 animate-in fade-in">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-600 animate-in fade-in">
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{success}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[42px] bg-[#0062ea] hover:bg-[#0054cc] active:bg-[#0047b3] text-white text-sm font-semibold rounded-[6px] shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-white" />
                    <span>{isKm ? "កំពុងចុះឈ្មោះ..." : "Creating account..."}</span>
                  </>
                ) : (
                  <span>{isKm ? "ចុះឈ្មោះ" : "Sign Up"}</span>
                )}
              </button>
            </form>

            {/* Divider "OR" */}
            <div className="relative my-3.5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-white px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                {isKm ? "ឬ" : "OR"}
              </span>
            </div>

            {/* Already have an account? Sign In */}
            <div className="text-center">
              <p className="text-xs text-slate-600">
                {isKm ? "មានគណនីរួចហើយ? " : "Already have an account? "}
                <Link
                  to={ROUTERS.LOGIN}
                  className="font-semibold text-[#0062ea] hover:underline ml-0.5"
                >
                  {isKm ? "ចូលប្រព័ន្ធ" : "Sign In"}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
