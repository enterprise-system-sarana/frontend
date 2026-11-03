import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthService } from "@/services/auth/auth.service";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
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
    <main
      className="relative flex min-h-svh items-center justify-center overflow-hidden bg-cover bg-center p-4 sm:p-6 md:p-10"
      style={{
        backgroundImage: "url('/login-bg.jpg')",
        backgroundColor: "#0b1329",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[#0f172a]/30 backdrop-blur-[2px]" />

      {/* Top right language toggle */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card/90 p-1 shadow-md backdrop-blur-md">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Shop Header */}
        <div className="mb-6 text-center">
          <div className="mb-3 inline-block rounded-full border border-border bg-card p-1 shadow-lg">
            <img
              src="/logo.png"
              alt="360° Phone Shop"
              className="size-20 rounded-full object-cover sm:size-24"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
            360° Phone Shop
          </h1>
          <p className="mt-1 text-xs text-white/80">
            {t("auth.forgot.title", "Forgot password?")}
          </p>
        </div>

        {/* Card Container */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_20px_45px_-15px_rgba(15,23,42,0.35)] sm:p-8">
          {!isSubmitted ? (
            <div>
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-foreground">
                  {t("auth.forgot.title", "Reset your password")}
                </h2>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  {t(
                    "auth.forgot.subtitle",
                    "Enter your email address or username and we'll send you instructions to reset your password."
                  )}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="emailOrUsername"
                    className="block text-xs font-semibold tracking-wide text-text-secondary"
                  >
                    {t("auth.login.username_or_email")}{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                      className="h-12 rounded-xl border border-border bg-muted/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive animate-in fade-in-50 duration-200">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="leading-snug">{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || !emailOrUsername.trim()}
                  className="mt-2 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[linear-gradient(180deg,var(--primary-gradient-from)_0%,var(--primary)_100%)] font-semibold text-primary-foreground shadow-[0_4px_10px_-2px_color-mix(in_srgb,var(--primary)_35%,transparent)] transition-colors hover:bg-[linear-gradient(180deg,var(--primary)_0%,var(--primary-hover)_100%)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
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
              <div className="mt-6 text-center border-t border-border pt-5">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>{t("auth.forgot.back_to_login")}</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Success confirmation screen */
            <div className="text-center py-2 animate-in zoom-in-95 duration-200">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success ring-8 ring-success/5">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {t("auth.forgot.check_inbox", "Check Your Inbox")}
              </h2>

              <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t("auth.forgot.sent_instructions", "We sent password reset instructions to:")}
              </p>

              <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted border border-border text-xs font-semibold text-foreground max-w-full truncate">
                <Mail className="size-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{emailOrUsername}</span>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                {t("auth.forgot.not_received_desc", "Did not receive the email? Check your spam folder or request a new link below.")}
              </p>

              {error && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive text-left">
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
                  className="w-full h-11 rounded-xl text-xs font-semibold border-border hover:bg-muted/50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  {resendCooldown > 0
                    ? `${t("auth.forgot.resend_cooldown", "Resend available in")} ${resendCooldown}s`
                    : t("auth.forgot.resend", "Resend Email")}
                </Button>

                <Link
                  to="/login"
                  className="inline-flex w-full h-11 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-95 transition-opacity"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("auth.forgot.back_to_login")}
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Security badge at bottom */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4" />
          <span>{t("auth.security_encrypted", "Encrypted with 256-bit SSL Security")}</span>
        </div>
      </div>
    </main>
  );
}
