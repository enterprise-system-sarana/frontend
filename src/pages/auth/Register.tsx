import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthService, type RegisterRequest } from "@/services/auth/auth.service";
import {
  AlertCircle,
  CheckCircle2,
  CircleCheck,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useLanguage } from "@/i18n/LanguageContext";
import { ROUTERS } from "@/constants/Route";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterRequest>({
    firstName: "",
    lastName: "",
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
  const { language } = useLanguage();
  const isKm = language === "km";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.password !== formData.confirmPassword) {
      setError(isKm ? "ពាក្យសម្ងាត់ផ្ទៀងផ្ទាត់មិនត្រូវគ្នាទេ" : "Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError(
        isKm
          ? "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ"
          : "Password must be at least 6 characters.",
      );
      return;
    }

    setIsLoading(true);
    try {
      await AuthService.register(formData);
      setSuccess(
        isKm
          ? "ការចុះឈ្មោះបានជោគជ័យ! កំពុងបញ្ជូនទៅកាន់ទំព័រចូលប្រព័ន្ធ..."
          : "Account created successfully! Redirecting to sign in...",
      );
      setTimeout(() => navigate(ROUTERS.LOGIN), 1500);
    } catch (err: any) {
      console.error("Register error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          (isKm
            ? "ការចុះឈ្មោះមិនបានសម្រេច សូមពិនិត្យព័ត៌មានម្តងទៀត"
            : "Failed to register. Please check your information and try again."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className="relative flex min-h-screen w-full overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/login-bg.jpg')", backgroundColor: "#0b1329" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[#0f172a]/30 backdrop-blur-[2px]" />

      <aside className="relative z-10 hidden w-[32.5%] min-w-[360px] flex-col justify-between bg-sidebar px-[52px] pt-[52px] pb-12 text-white lg:flex">
        <div>
          <div className="flex size-[136px] items-center justify-center rounded-2xl bg-white p-3 shadow-[0_1px_1.5px_rgba(11,44,82,0.06)]">
            <img src="/logo.png" alt="360 Phone Shop" className="size-full object-contain" />
          </div>
          <p className="mt-7 text-base font-semibold">360 Phone Shop</p>
          <p className="text-xs text-white/80">
            {isKm ? "ហាងលក់ទូរស័ព្ទដៃទំនើប" : "Smartphones & Accessories"}
          </p>
        </div>
        <div className="max-w-[400px]">
          <h1 className="text-xl leading-[26px] font-semibold text-white">
            {isKm ? "បង្កើតគណនីសម្រាប់គ្រប់គ្រងហាងរបស់អ្នក។" : "Create your account and manage your shop in one place."}
          </h1>
          <ul className="mt-5 space-y-3">
            {(isKm
              ? ["គ្រប់គ្រងការលក់ និងស្តុក", "តាមដានហាងរបស់អ្នក", "ទទួលបានរបាយការណ៍ច្បាស់លាស់"]
              : ["Manage sales and inventory", "Track your shop in one place", "Get clear business reports"]
            ).map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-white/90">
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

      <section className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="absolute top-5 right-5 flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <div className="w-full max-w-[560px] rounded-2xl border border-border bg-card p-7 shadow-[0_10px_15px_-3px_rgba(30,60,110,0.10),0_1px_2px_rgba(30,60,110,0.05)] sm:p-9">
          <h2 className="mb-4 p-2 text-center text-[22px] font-bold tracking-tight text-foreground">
            {isKm ? "ចុះឈ្មោះគណនី" : "Sign Up for an Account"}
          </h2>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">
                  {isKm ? "នាមខ្លួន" : "First Name"} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder={isKm ? "នាមខ្លួន" : "First Name"}
                  autoComplete="given-name"
                  disabled={isLoading}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">
                  {isKm ? "នាមត្រកូល" : "Last Name"} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder={isKm ? "នាមត្រកូល" : "Last Name"}
                  autoComplete="family-name"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">{isKm ? "លេខទូរស័ព្ទ" : "Phone Number"}</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder={isKm ? "លេខទូរស័ព្ទ" : "Phone Number"}
                autoComplete="tel"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">
                {isKm ? "អ៊ីមែល" : "Email"} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={isKm ? "អ៊ីមែល" : "name@example.com"}
                autoComplete="email"
                disabled={isLoading}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="password">
                  {isKm ? "ពាក្យសម្ងាត់" : "Password"} <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={isKm ? "បញ្ចូលពាក្យសម្ងាត់" : "Enter your password"}
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
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">
                  {isKm ? "បញ្ជាក់ពាក្យសម្ងាត់" : "Confirm Password"} <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder={isKm ? "បញ្ជាក់ពាក្យសម្ងាត់" : "Confirm your password"}
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
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-[10px] border border-destructive/20 bg-destructive/10 p-3 text-[14px] text-destructive animate-in fade-in">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span className="leading-snug">{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2 rounded-[10px] border border-success/20 bg-success/10 p-3 text-[14px] text-success animate-in fade-in">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                <span className="leading-snug">{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-[42px] w-full items-center justify-center gap-2 rounded-[6px] bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-150 hover:bg-primary-hover hover:shadow disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{isKm ? "កំពុងចុះឈ្មោះ..." : "Creating account..."}</span>
                </>
              ) : (
                <span>{isKm ? "ចុះឈ្មោះ" : "Sign Up"}</span>
              )}
            </button>
          </form>

          <p className="mt-5 border-t border-border pt-5 text-center text-sm text-muted-foreground">
            {isKm ? "មានគណនីរួចហើយ? " : "Already have an account? "}
            <Link to={ROUTERS.LOGIN} className="font-medium text-primary hover:underline">
              {isKm ? "ចូលប្រព័ន្ធ" : "Sign In"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
