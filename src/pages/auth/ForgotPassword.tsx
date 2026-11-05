import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthService } from "@/services/auth/auth.service";
import {
  AlertCircle,
  CheckCircle2,
  CircleCheck,
  Eye,
  EyeOff,
  HelpCircle,
  Loader2,
  Smartphone,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useLanguage } from "@/i18n/LanguageContext";
import { ROUTERS } from "@/constants/Route";

export default function ForgotPasswordPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { language } = useLanguage();
  const isKm = language === "km";
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = usernameOrEmail.trim();
    const phoneTrimmed = phone.trim();

    if (!query) {
      setError(
        isKm
          ? "សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់ ឬ អ៊ីមែលរបស់អ្នក"
          : "Please enter your username or email address."
      );
      return;
    }

    if (!phoneTrimmed) {
      setError(
        isKm
          ? "សូមបញ្ចូលលេខទូរស័ព្ទដែលបានចុះឈ្មោះជាមួយគណនីរបស់អ្នក"
          : "Please enter your registered phone number."
      );
      return;
    }

    if (newPassword.length < 6) {
      setError(
        isKm
          ? "ពាក្យសម្ងាត់ថ្មីត្រូវតែមានយ៉ាងតិច ៦ តួអក្សរ"
          : "New password must be at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        isKm
          ? "ពាក្យសម្ងាត់ផ្ទៀងផ្ទាត់មិនត្រូវគ្នាទេ"
          : "Passwords do not match."
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await AuthService.resetPasswordByPhone({
        usernameOrEmail: query,
        phone: phoneTrimmed,
        newPassword,
      });
      setIsSubmitted(true);
      setTimeout(() => {
        navigate(ROUTERS.LOGIN);
      }, 2500);
    } catch (err: any) {
      console.error("Reset password error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          (isKm
            ? "មិនអាចផ្លាស់ប្តូរពាក្យសម្ងាត់បានទេ។ សូមពិនិត្យឈ្មោះ និងលេខទូរស័ព្ទរបស់អ្នកឡើងវិញ!"
            : "Failed to reset password. Please check your username and registered phone number.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const highlights = isKm
    ? [
        "ផ្ទៀងផ្ទាត់រហ័សតាមលេខទូរស័ព្ទ",
        "ការពារ និងរក្សាសុវត្ថិភាពគណនីរបស់អ្នក",
        "ផ្លាស់ប្តូរពាក្យសម្ងាត់ភ្លាមៗដោយសុវត្ថិភាព",
      ]
    : [
        "Quick verification via registered phone",
        "Protect and recover your account securely",
        "Instantly reset your password without email",
      ];

  return (
    <main
      className="relative flex min-h-screen w-full overflow-hidden bg-cover bg-center"
      style={{
        backgroundImage: "url('/login-bg.jpg')",
        backgroundColor: "#0b1329",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[#0f172a]/30 backdrop-blur-[2px]" />

      {/* ================= LEFT BRAND PANEL (Matches Login & Register) ================= */}
      <aside className="relative z-10 hidden w-[32.5%] min-w-[360px] flex-col justify-between bg-sidebar px-[52px] pt-[52px] pb-12 text-white lg:flex">
        <div>
          <div className="flex size-[136px] items-center justify-center rounded-2xl bg-white p-3 shadow-[0_1px_1.5px_rgba(11,44,82,0.06)]">
            <img
              src="/logo.png"
              alt="360 Phone Shop"
              className="size-full object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = "none";
                if (target.nextElementSibling) {
                  (target.nextElementSibling as HTMLElement).style.display = "flex";
                }
              }}
            />
            <div className="hidden size-full items-center justify-center text-primary">
              <Smartphone className="size-12" />
            </div>
          </div>
          <p className="mt-7 text-base leading-6 font-semibold">360 Phone Shop</p>
          <p className="text-xs leading-[18px] text-white/80">
            {isKm ? "ហាងលក់ទូរស័ព្ទដៃទំនើប" : "Smartphones & Accessories"}
          </p>
        </div>

        <div className="max-w-[400px]">
          <h1 className="text-xl leading-[26px] font-semibold text-white">
            {isKm
              ? "សុវត្ថិភាព និងការគ្រប់គ្រងគណនី — រហ័ស និងងាយស្រួល។"
              : "Account security and recovery — fast, simple and secure."}
          </h1>
          <ul className="mt-5 space-y-3">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm leading-[22px] text-white/90">
                <CircleCheck className="size-[18px] shrink-0" strokeWidth={1.75} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/75">
          © {new Date().getFullYear()} 360 Phone Shop · {isKm ? "ប្រព័ន្ធគ្រប់គ្រង" : "Management System"}
        </p>
      </aside>

      {/* ================= RIGHT FORM PANEL (Matches Login & Register) ================= */}
      <section className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="absolute top-5 right-5 flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[420px] rounded-2xl border border-border bg-card p-8 sm:p-9 shadow-[0_10px_15px_-3px_rgba(30,60,110,0.10),0_1px_2px_rgba(30,60,110,0.05)]">
          {/* Mobile brand (left panel is hidden below lg) */}
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-[10px] border border-border bg-white p-1">
              <img src="/logo.png" alt="" className="size-full object-contain" />
            </span>
            <span className="text-base font-semibold text-foreground">360 Phone Shop</span>
          </div>

          {!isSubmitted ? (
            <>
              <h2 className="text-[26px] sm:text-[28px] text-center p-2 leading-9 font-bold tracking-[-0.015em] text-foreground">
                {isKm ? "កំណត់ពាក្យសម្ងាត់ឡើងវិញ" : "Reset password"}
              </h2>
             

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Username or Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="usernameOrEmail">
                    {isKm ? "ឈ្មោះអ្នកប្រើប្រាស់ ឬ អ៊ីមែល" : "Username or email"}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="usernameOrEmail"
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder={isKm ? "ឈ្មោះអ្នកប្រើប្រាស់ ឬ អ៊ីមែល" : "Username or email"}
                    autoComplete="username"
                    disabled={isLoading}
                    required
                    autoFocus
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone">
                    {isKm ? "លេខទូរស័ព្ទចុះឈ្មោះ" : "Registered phone number"}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 012345678"
                    autoComplete="tel"
                    disabled={isLoading}
                    required
                  />
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">
                    {isKm ? "ពាក្យសម្ងាត់ថ្មី" : "New password"}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={isKm ? "យ៉ាងតិច ៦ តួអក្សរ" : "At least 6 characters"}
                      autoComplete="new-password"
                      disabled={isLoading}
                      required
                      className="pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-text-secondary hover:bg-muted hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">
                    {isKm ? "ផ្ទៀងផ្ទាត់ពាក្យសម្ងាត់ថ្មី" : "Confirm new password"}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={isKm ? "បញ្ចូលពាក្យសម្ងាត់ថ្មីម្តងទៀត" : "Re-enter new password"}
                      autoComplete="new-password"
                      disabled={isLoading}
                      required
                      className="pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-text-secondary hover:bg-muted hover:text-foreground"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-[10px] border border-destructive/20 bg-destructive/10 p-3 text-[14px] text-destructive animate-in fade-in">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span className="leading-snug">{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[linear-gradient(180deg,var(--primary-gradient-from)_0%,var(--primary)_100%)] shadow-[0_4px_10px_-2px_color-mix(in_srgb,var(--primary)_35%,transparent)] hover:bg-[linear-gradient(180deg,var(--primary)_0%,var(--primary-hover)_100%)] dark:bg-none dark:hover:bg-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>{isKm ? "កំពុងដំណើរការ..." : "Resetting password..."}</span>
                    </>
                  ) : (
                    <span>{isKm ? "ប្តូរពាក្យសម្ងាត់" : "Reset password"}</span>
                  )}
                </Button>
              </form>

              {/* Admin Help Hint */}
              {/* <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
                <HelpCircle className="size-4 shrink-0 text-primary" />
                <span>
                  {isKm
                    ? "ភ្លេចលេខទូរស័ព្ទ? សូមទាក់ទង Admin (Super Admin) ដើម្បីប្តូរពាក្យសម្ងាត់ជូនអ្នក។"
                    : "Forgot phone? Contact Admin (Super Admin) to reset your password."}
                </span>
              </div> */}

              {/* Footer Back Link */}
              <p className="mt-5 border-t border-border pt-5 text-center text-sm text-muted-foreground">
                <Link to={ROUTERS.LOGIN} className="font-medium text-primary hover:underline">
                  {isKm ? "← ត្រឡប់ទៅចូលប្រព័ន្ធ" : "← Back to sign in"}
                </Link>
              </p>
            </>
          ) : (
            <div className="py-4 text-center animate-in zoom-in-95 duration-200">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-success/15 text-success ring-8 ring-success/5">
                <CheckCircle2 className="size-8" />
              </div>

              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {isKm ? "ប្តូរពាក្យសម្ងាត់ជោគជ័យ!" : "Password Reset Successfully!"}
              </h2>

              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {isKm
                  ? "ពាក្យសម្ងាត់របស់អ្នកត្រូវបានផ្លាស់ប្តូរដោយជោគជ័យ។ កំពុងបញ្ជូនទៅកាន់ទំព័រចូលប្រព័ន្ធ..."
                  : "Your password has been updated. Redirecting to login page..."}
              </p>

              <div className="mt-6">
                <Link
                  to={ROUTERS.LOGIN}
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:opacity-95 transition-opacity"
                >
                  <span>{isKm ? "ចូលប្រព័ន្ធឥឡូវនេះ" : "Sign in now"}</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
