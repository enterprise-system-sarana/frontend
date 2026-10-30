import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthService } from "@/services/auth/auth.service";
import { AlertCircle, CircleCheck, Eye, EyeOff, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useLanguage } from "@/i18n/LanguageContext";
import { ROUTERS } from "@/constants/Route";

export default function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { language } = useLanguage();

  const isKm = language === "km";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const username = usernameOrEmail.trim();

    if (!username || !password) {
      setError(
        isKm
          ? "សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់ និងពាក្យសម្ងាត់"
          : "Please enter your username/email and password."
      );
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
      if (rememberMe) {
        localStorage.setItem("usernameOrEmail", username);
      } else {
        localStorage.removeItem("usernameOrEmail");
      }

      navigate(ROUTERS.DASHBOARD);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          (isKm
            ? "ឈ្មោះអ្នកប្រើប្រាស់ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ"
            : "Invalid username/email or password.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const highlights = isKm
    ? ["តាមដានការលក់ ស្តុក និងការទិញ", "គ្រប់គ្រងហាងច្រើនក្នុងកន្លែងតែមួយ", "របាយការណ៍ប្រាក់ចំណេញ និងចំណាយភ្លាមៗ"]
    : ["Track sales, stock and purchases", "Manage every store in one place", "Instant profit, expense and payment reports"];

  return (
    <main className="flex min-h-screen w-full bg-background">
      {/* ================= LEFT BRAND PANEL (Figma: Web/Auth/Login) ================= */}
      <aside className="relative hidden w-[32.5%] min-w-[360px] flex-col justify-between bg-sidebar px-[52px] pt-[52px] pb-12 text-white lg:flex">
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
              ? "ការលក់ ស្តុក និងរបាយការណ៍ហាង — នៅកន្លែងតែមួយ។"
              : "Sales, stock and shop reporting — all in one place."}
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

      {/* ================= RIGHT FORM PANEL ================= */}
      <section className="relative flex flex-1 items-center justify-center px-4 py-10">
        <div className="absolute top-5 right-5 flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[406px] rounded-2xl border border-border bg-card p-9 shadow-[0_10px_15px_-3px_rgba(30,60,110,0.10),0_1px_2px_rgba(30,60,110,0.05)]">
          {/* Mobile brand (left panel is hidden below lg) */}
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-[10px] border border-border bg-white p-1">
              <img src="/logo.png" alt="" className="size-full object-contain" />
            </span>
            <span className="text-base font-semibold text-foreground">360 Phone Shop</span>
          </div>

          <h2 className="text-[28px] leading-9 font-bold tracking-[-0.015em] text-foreground">
            {isKm ? "ចូលប្រព័ន្ធ" : "Sign in"}
          </h2>
          <p className="mt-1 text-sm leading-[22px] text-muted-foreground">
            {isKm ? "ប្រើគណនី 360 Phone Shop របស់អ្នក។" : "Use your 360 Phone Shop account."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
                placeholder={isKm ? "ឈ្មោះអ្នកប្រើប្រាស់ ឬ អ៊ីមែល" : "name@example.com"}
                autoComplete="username"
                disabled={isLoading}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">
                {isKm ? "ពាក្យសម្ងាត់" : "Password"}
                <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isKm ? "បញ្ចូលពាក្យសម្ងាត់" : "Enter your password"}
                  autoComplete="current-password"
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

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-text-secondary select-none">
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-[18px] rounded-[4px] border-border-strong"
                />
                {isKm ? "ចងចាំខ្ញុំ" : "Remember me"}
              </label>
              <Link to={ROUTERS.FORGOT_PASSWORD} className="text-sm font-medium text-primary hover:underline">
                {isKm ? "ភ្លេចពាក្យសម្ងាត់?" : "Forgot password?"}
              </Link>
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
                  <span>{isKm ? "កំពុងចូល..." : "Signing in..."}</span>
                </>
              ) : (
                <span>{isKm ? "ចូលប្រព័ន្ធ" : "Sign in"}</span>
              )}
            </Button>
          </form>

          <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0" strokeWidth={1.75} />
            {isKm ? "ចូលប្រើបានតែបុគ្គលិកដែលមានសិទ្ធិប៉ុណ្ណោះ។" : "Access limited to authorized staff."}
          </p>

          <p className="mt-5 border-t border-border pt-5 text-center text-sm text-muted-foreground">
            {isKm ? "មិនទាន់មានគណនី? " : "Don't have an account? "}
            <Link to={ROUTERS.REGISTER} className="font-medium text-primary hover:underline">
              {isKm ? "ចុះឈ្មោះ" : "Sign up"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
