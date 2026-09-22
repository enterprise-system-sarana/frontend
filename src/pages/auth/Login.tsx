import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthService } from "@/services/auth/auth.service";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { useLanguage } from "@/i18n/LanguageContext";
import { ROUTERS } from "@/constants/Route";

export default function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const username = usernameOrEmail.trim();

    if (!username || !password) {
      setError("Please enter your username/email and password.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await AuthService.login({
        usernameOrEmail: username,
        password,
      });

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("usernameOrEmail", username);

      navigate(ROUTERS.DASHBOARD);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Invalid username/email or password."
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

      <div className="w-full max-w-[420px]">
        {/* Logo & Shop Header */}
        <div className="mb-6 text-center">
          <div className="inline-block p-1 rounded-full bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800 mb-3">
            <img
              src="/logo.png"
              alt="360° Phone Shop"
              className="size-20 sm:size-24 rounded-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            360° Phone Shop
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t("auth.login.subtitle") || "Sign in to manage your store"}
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="usernameOrEmail"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {t("auth.login.username_or_email") || "Username or Email"}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="usernameOrEmail"
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Username or email"
                  autoComplete="username"
                  disabled={isLoading}
                  required
                  autoFocus
                  className="h-11 rounded-xl bg-slate-50/50 pl-10 pr-4 text-xs dark:bg-slate-800/40"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  {t("auth.login.password") || "Password"}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <Link
                  to={ROUTERS.FORGOT_PASSWORD}
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  {t("auth.login.forgot_password") || "Forgot password?"}
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  required
                  className="h-11 rounded-xl bg-slate-50/50 pl-10 pr-10 text-xs dark:bg-slate-800/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 p-2.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
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
                  <span>{t("common.loading") || "Signing in..."}</span>
                </>
              ) : (
                <>
                  <span>{t("auth.login.button") || "Sign In"}</span>
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-5 text-center border-t border-slate-100 dark:border-slate-800 pt-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("auth.login.no_account") || "Don't have an account?"}{" "}
              <Link
                to={ROUTERS.REGISTER}
                className="font-semibold text-primary hover:underline"
              >
                {t("auth.login.signup") || "Sign up"}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}