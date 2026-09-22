import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthService, type RegisterRequest } from "@/services/auth/auth.service";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  AtSign,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const { t } = useLanguage();

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
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      await AuthService.register(formData);
      setSuccess("Account created successfully! Redirecting to sign in...");
      setTimeout(() => {
        navigate(ROUTERS.LOGIN);
      }, 1500);
    } catch (err: any) {
      console.error("Register error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to register. Please check your information and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-svh items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6">
      {/* Language Toggle in Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageToggle />
      </div>

      <div className="w-full max-w-[500px]">
        {/* Logo & Shop Header */}
        <div className="mb-6 text-center">
          <div className="inline-block p-1 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800 mb-3">
            <img
              src="/logo.png"
              alt="360° Phone Shop"
              className="size-18 sm:size-20 rounded-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            360° Phone Shop
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t("auth.register.title") || "Create an account to get started"}
          </p>
        </div>

        {/* Register Card */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* First & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("auth.register.first_name") || "First Name"} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    name="firstName"
                    type="text"
                    placeholder="First name"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="h-10 rounded-xl bg-slate-50/50 pl-9 pr-3 text-xs dark:bg-slate-800/40"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("auth.register.last_name") || "Last Name"} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    name="lastName"
                    type="text"
                    placeholder="Last name"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="h-10 rounded-xl bg-slate-50/50 pl-9 pr-3 text-xs dark:bg-slate-800/40"
                  />
                </div>
              </div>
            </div>

            {/* Username & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("auth.register.username") || "Username"} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <AtSign className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    name="username"
                    type="text"
                    placeholder="Username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="h-10 rounded-xl bg-slate-50/50 pl-9 pr-3 text-xs dark:bg-slate-800/40"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("auth.register.phone") || "Phone"}
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    name="phone"
                    type="tel"
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="h-10 rounded-xl bg-slate-50/50 pl-9 pr-3 text-xs dark:bg-slate-800/40"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t("auth.register.email") || "Email Address"} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-10 rounded-xl bg-slate-50/50 pl-9 pr-3 text-xs dark:bg-slate-800/40"
                />
              </div>
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("auth.register.password") || "Password"} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="h-10 rounded-xl bg-slate-50/50 pl-9 pr-8 text-xs dark:bg-slate-800/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("auth.register.confirm_password") || "Confirm Password"} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="h-10 rounded-xl bg-slate-50/50 pl-9 pr-8 text-xs dark:bg-slate-800/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 p-2.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/30 p-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{success}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-xs text-primary-foreground shadow-sm hover:opacity-95 transition-opacity disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>{t("common.loading") || "Creating account..."}</span>
                </>
              ) : (
                <>
                  <span>{t("auth.register.button") || "Create Account"}</span>
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </Button>
          </form>

          {/* Already have an account */}
          <div className="mt-5 text-center border-t border-slate-100 dark:border-slate-800 pt-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("auth.register.have_account") || "Already have an account?"}{" "}
              <Link
                to={ROUTERS.LOGIN}
                className="font-semibold text-primary hover:underline"
              >
                {t("auth.login.button") || "Sign In"}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
