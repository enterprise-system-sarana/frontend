import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthService } from "@/services/auth/auth.service";
import {
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  Mail,
  AlertCircle,
  Sparkles,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { useLanguage } from "@/i18n/LanguageContext";

export default function ForgotPasswordPage() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { t } = useLanguage();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = emailOrUsername.trim();
    if (!query) {
      setError("Please enter your registered email address or username.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await AuthService.forgotPassword({ emailOrUsername: query });
      setIsSubmitted(true);
      setResendCooldown(60);
    } catch (err: any) {
      console.error("Forgot password error:", err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Unable to send reset instructions. Please check your username or email."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      await AuthService.forgotPassword({ emailOrUsername: emailOrUsername.trim() });
      setResendCooldown(60);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to resend. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-svh items-center justify-center bg-[#f1f1f3] dark:bg-slate-950 p-4 sm:p-6 md:p-10 overflow-hidden select-none">
      {/* Top right language toggle */}
      <div className="absolute top-5 right-5 z-20">
        <LanguageToggle />
      </div>

      {/* Ambient background decoration */}
      <div className="pointer-events-none absolute -left-20 top-1/4 h-80 w-80 rounded-full bg-[#4b3bd5]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-[#2ec5b8]/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
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
            {t("auth.forgot.title") || "Reset your password"}
          </p>
        </div>

        {/* Card Container */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
          {!isSubmitted ? (
            <div>


              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="emailOrUsername"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                  >
                    {t("auth.login.username_or_email")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="emailOrUsername"
                      type="text"
                      placeholder="e.g. user@company.com or username"
                      required
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      disabled={isLoading}
                      autoComplete="email"
                      autoFocus
                      className="h-12 rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#4b3bd5] focus:bg-white focus:ring-2 focus:ring-[#4b3bd5]/20 dark:border-slate-800 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-900"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/80 dark:bg-red-950/40 p-3 text-xs text-red-600 dark:text-red-400 animate-in fade-in-50 duration-200">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="leading-snug">{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || !emailOrUsername.trim()}
                  className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4b3bd5] to-[#5c3ae4] font-semibold text-white shadow-lg shadow-[#4b3bd5]/25 hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>{t("common.loading")}</span>
                    </>
                  ) : (
                    <>
                      <span>{t("auth.forgot.button")}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Footer Back Link */}
              <div className="mt-6 text-center border-t border-slate-100 dark:border-slate-800 pt-5">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#4b3bd5] dark:hover:text-[#8b79f7] transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>{t("auth.forgot.back_to_login")}</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Success confirmation screen */
            <div className="text-center py-2 animate-in zoom-in-95 duration-200">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/5">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Check Your Inbox
              </h2>

              <p className="mt-2.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                We sent password reset instructions to:
              </p>

              <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-full truncate">
                <Mail className="size-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{emailOrUsername}</span>
              </div>

              <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
                Did not receive the email? Check your spam folder or request a new link below.
              </p>

              {error && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 text-left">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <Button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isLoading}
                  variant="outline"
                  className="w-full h-11 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  {resendCooldown > 0
                    ? `Resend available in ${resendCooldown}s`
                    : "Resend Email"}
                </Button>

                <Link
                  to="/login"
                  className="inline-flex w-full h-11 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-95 transition-opacity"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("auth.forgot.back_to_login")}
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Security badge at bottom */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <ShieldCheck className="size-4" />
          <span>Encrypted with 256-bit SSL Security</span>
        </div>
      </div>
    </main>
  );
}
