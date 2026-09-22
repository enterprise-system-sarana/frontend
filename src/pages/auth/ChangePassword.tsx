import { useState, useMemo } from "react";
import { AuthService, type ChangePasswordRequest } from "@/services/auth/auth.service";
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  KeyRound,
  Check,
  X,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/i18n/LanguageContext";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { t } = useLanguage();

  // Password strength calculation
  const strength = useMemo(() => {
    if (!newPassword) return { score: 0, label: "", color: "" };

    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) score += 1;
    if (/\d/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: "Weak", color: "bg-red-500", text: "text-red-500" };
      case 2:
        return { score: 2, label: "Fair", color: "bg-amber-500", text: "text-amber-500" };
      case 3:
        return { score: 3, label: "Good", color: "bg-blue-500", text: "text-blue-500" };
      case 4:
        return { score: 4, label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" };
      default:
        return { score: 0, label: "Too Short", color: "bg-red-400", text: "text-red-400" };
    }
  }, [newPassword]);

  // Validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasNumberOrSymbol = /[\d!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmNewPassword;
  const isValid = hasMinLength && passwordsMatch && currentPassword.trim().length > 0;

  const handleReset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("Your new password must be different from your current password.");
      return;
    }

    setIsLoading(true);
    try {
      const payload: ChangePasswordRequest = { currentPassword, newPassword };
      await AuthService.changePassword(payload);
      setSuccess("Your password has been changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      console.error("Change password error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to change password. Please verify your current password."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-4 sm:py-8 px-2 sm:px-4">
      {/* Page Title & Breadcrumb header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("auth.change.title")}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground ml-11">
          {t("auth.change.subtitle")}
        </p>
      </div>

      {/* Main Form Card */}
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="border-b border-border/60 bg-muted/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Security Credentials
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-primary/10 text-primary">
            <Lock className="size-3" />
            End-to-End Encrypted
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="currentPassword"
              className="block text-xs font-semibold text-foreground"
            >
              {t("auth.change.current_password")} <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="currentPassword"
                type={showCurrent ? "text" : "password"}
                placeholder="Enter current password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                className="h-11 rounded-xl bg-background pl-10 pr-11 text-sm focus-visible:ring-1"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="newPassword"
              className="block text-xs font-semibold text-foreground"
            >
              {t("auth.change.new_password")} <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="newPassword"
                type={showNew ? "text" : "password"}
                placeholder="Enter new password (min. 8 characters)"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
                className="h-11 rounded-xl bg-background pl-10 pr-11 text-sm focus-visible:ring-1"
              />
              <button
                type="button"
                onClick={() => setShowNew((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {/* Strength meter bar */}
            {newPassword && (
              <div className="pt-2 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground text-[11px]">Strength</span>
                  <span className={`text-[11px] font-semibold ${strength.text}`}>
                    {strength.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-1.5 rounded-full overflow-hidden bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${
                      strength.score >= 1 ? strength.color : "bg-transparent"
                    }`}
                  />
                  <div
                    className={`h-full rounded-full transition-all ${
                      strength.score >= 2 ? strength.color : "bg-transparent"
                    }`}
                  />
                  <div
                    className={`h-full rounded-full transition-all ${
                      strength.score >= 3 ? strength.color : "bg-transparent"
                    }`}
                  />
                  <div
                    className={`h-full rounded-full transition-all ${
                      strength.score >= 4 ? strength.color : "bg-transparent"
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="confirmNewPassword"
              className="block text-xs font-semibold text-foreground"
            >
              {t("auth.change.confirm_new_password")} <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmNewPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter your new password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
                className="h-11 rounded-xl bg-background pl-10 pr-11 text-sm focus-visible:ring-1"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Password Requirements Checklist */}
          <div className="rounded-xl bg-muted/40 p-3.5 text-xs space-y-2 border border-border/40">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium mb-1">
              <Info className="size-3.5 text-primary" />
              <span>Password requirements:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5">
                {hasMinLength ? (
                  <Check className="size-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <X className="size-3.5 text-muted-foreground shrink-0" />
                )}
                <span className={hasMinLength ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"}>
                  8+ characters
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {hasNumberOrSymbol ? (
                  <Check className="size-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <X className="size-3.5 text-muted-foreground shrink-0" />
                )}
                <span className={hasNumberOrSymbol ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"}>
                  Number or symbol
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {passwordsMatch ? (
                  <Check className="size-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <X className="size-3.5 text-muted-foreground shrink-0" />
                )}
                <span className={passwordsMatch ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"}>
                  Passwords match
                </span>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
              <span className="leading-snug">{success}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isLoading || (!currentPassword && !newPassword && !confirmNewPassword)}
              className="h-10 px-4 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Reset
            </Button>

            <Button
              type="submit"
              disabled={isLoading || !isValid}
              className="h-10 px-6 rounded-xl text-xs font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="mr-2 size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>{t("common.loading")}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-1.5 size-4" />
                  <span>{t("auth.change.button")}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
