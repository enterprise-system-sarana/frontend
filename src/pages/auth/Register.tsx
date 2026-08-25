import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import {
  AuthService,
  type RegisterRequest,
} from "@/services/auth/auth.service";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UserRound,
  AtSign,
} from "lucide-react";

import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { useLanguage } from "@/i18n/LanguageContext";

export default function RegisterPage({
  className,
  ...props
}: React.ComponentProps<"div">) {
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors while user is typing
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setSuccess(null);

    // Password validation
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

      setSuccess(
        "Account created successfully! Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err: any) {
      console.error("Register error:", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to register. Please check your information and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "relative min-h-svh w-full overflow-hidden bg-background",
        className
      )}
      {...props}
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* Language */}
      <div className="absolute right-5 top-5 z-30">
        <LanguageToggle />
      </div>

      <div className="relative z-10 grid min-h-svh lg:grid-cols-2">

        {/* =====================================================
            LEFT SIDE
        ====================================================== */}
        <div className="relative hidden overflow-hidden bg-primary lg:flex">

          {/* Decorative circles */}
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-2xl" />

          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-black/10 blur-3xl" />

          <div className="relative flex w-full flex-col justify-between p-12 xl:p-16">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <Sparkles className="h-5 w-5 text-white" />
              </div>

              <div>
                <p className="text-lg font-bold tracking-tight text-white">
                  YourBrand
                </p>

                <p className="text-xs text-white/60">
                  Management Platform
                </p>
              </div>
            </div>

            {/* Main content */}
            <div className="max-w-lg">

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
                <UserPlus className="h-3.5 w-3.5" />
                Create your account
              </div>

              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
                Start your journey
                <span className="block text-white/70">
                  with us today.
                </span>
              </h1>

              <p className="mt-6 max-w-md text-sm leading-6 text-white/70 xl:text-base">
                Create your account and get access to a powerful,
                simple, and secure management platform.
              </p>

              {/* Features */}
              <div className="mt-10 space-y-5">

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                    <ShieldCheck className="h-4 w-4 text-white" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white">
                      Secure account
                    </p>

                    <p className="text-xs text-white/50">
                      Your information stays protected
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                    <UserRound className="h-4 w-4 text-white" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white">
                      Personal workspace
                    </p>

                    <p className="text-xs text-white/50">
                      Everything organized in one place
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white">
                      Simple experience
                    </p>

                    <p className="text-xs text-white/50">
                      Designed to be fast and easy to use
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="text-xs text-white/40">
              © {new Date().getFullYear()} YourBrand. All rights reserved.
            </div>
          </div>
        </div>

        {/* =====================================================
            RIGHT SIDE
        ====================================================== */}
        <div className="flex items-center justify-center px-5 py-20 sm:px-8 lg:px-12">

          <div className="w-full max-w-xl">

            {/* Mobile logo */}
            <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>

              <div>
                <p className="font-bold tracking-tight">
                  YourBrand
                </p>

                <p className="text-[10px] text-muted-foreground">
                  Management Platform
                </p>
              </div>

            </div>

            {/* Header */}
            <div className="mb-7 text-center lg:text-left">

              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                <UserPlus className="h-5 w-5" />
              </div>

              <h2 className="text-3xl font-bold tracking-tight">
                {t("auth.register.title")}
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                {t("auth.register.subtitle")}
              </p>

            </div>

            {/* Register Card */}
            <Card className="border-border/60 bg-card/80 shadow-xl shadow-black/5 backdrop-blur-xl">

              <CardHeader className="hidden">
                <CardTitle>
                  {t("auth.register.title")}
                </CardTitle>

                <CardDescription>
                  {t("auth.register.subtitle")}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 sm:p-8">

                <form onSubmit={handleSubmit}>

                  <FieldGroup className="gap-4">

                    {/* First Name / Last Name */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                      <Field>
                        <FieldLabel
                          htmlFor="firstName"
                          className="text-sm font-medium"
                        >
                          {t("auth.register.first_name")}
                          <span className="ml-1 text-destructive">
                            *
                          </span>
                        </FieldLabel>

                        <div className="relative mt-1.5">
                          <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                          <Input
                            id="firstName"
                            name="firstName"
                            type="text"
                            placeholder="John"
                            required
                            autoComplete="given-name"
                            value={formData.firstName}
                            onChange={handleChange}
                            disabled={isLoading}
                            className="pl-10"
                          />
                        </div>
                      </Field>

                      <Field>
                        <FieldLabel
                          htmlFor="lastName"
                          className="text-sm font-medium"
                        >
                          {t("auth.register.last_name")}
                          <span className="ml-1 text-destructive">
                            *
                          </span>
                        </FieldLabel>

                        <div className="relative mt-1.5">
                          <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                          <Input
                            id="lastName"
                            name="lastName"
                            type="text"
                            placeholder="Doe"
                            required
                            autoComplete="family-name"
                            value={formData.lastName}
                            onChange={handleChange}
                            disabled={isLoading}
                            className="pl-10"
                          />
                        </div>
                      </Field>

                    </div>

                    {/* Username */}
                    <Field>
                      <FieldLabel
                        htmlFor="username"
                        className="text-sm font-medium"
                      >
                        {t("auth.register.username")}
                        <span className="ml-1 text-destructive">
                          *
                        </span>
                      </FieldLabel>

                      <div className="relative mt-1.5">
                        <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                        <Input
                          id="username"
                          name="username"
                          type="text"
                          placeholder="johndoe"
                          required
                          autoComplete="username"
                          value={formData.username}
                          onChange={handleChange}
                          disabled={isLoading}
                          className="pl-10"
                        />
                      </div>
                    </Field>

                    {/* Email */}
                    <Field>
                      <FieldLabel
                        htmlFor="email"
                        className="text-sm font-medium"
                      >
                        {t("auth.register.email")}
                        <span className="ml-1 text-destructive">
                          *
                        </span>
                      </FieldLabel>

                      <div className="relative mt-1.5">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="john.doe@example.com"
                          required
                          autoComplete="email"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={isLoading}
                          className="pl-10"
                        />
                      </div>
                    </Field>

                    {/* Phone */}
                    <Field>
                      <div className="flex items-center justify-between">
                        <FieldLabel
                          htmlFor="phone"
                          className="text-sm font-medium"
                        >
                          {t("auth.register.phone")}
                        </FieldLabel>

                        <span className="text-xs text-muted-foreground">
                          Optional
                        </span>
                      </div>

                      <div className="relative mt-1.5">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          autoComplete="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          disabled={isLoading}
                          className="pl-10"
                        />
                      </div>
                    </Field>

                    {/* Password */}
                    <Field>
                      <FieldLabel
                        htmlFor="password"
                        className="text-sm font-medium"
                      >
                        {t("auth.register.password")}
                        <span className="ml-1 text-destructive">
                          *
                        </span>
                      </FieldLabel>

                      <div className="relative mt-1.5">

                        <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          required
                          autoComplete="new-password"
                          value={formData.password}
                          onChange={handleChange}
                          disabled={isLoading}
                          className="pl-10 pr-11"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((prev) => !prev)
                          }
                          disabled={isLoading}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={
                            showPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>

                      </div>

                      {/* Password requirement */}
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        Password must be at least 6 characters.
                      </p>
                    </Field>

                    {/* Confirm Password */}
                    <Field>
                      <FieldLabel
                        htmlFor="confirmPassword"
                        className="text-sm font-medium"
                      >
                        {t("auth.register.confirm_password")}
                        <span className="ml-1 text-destructive">
                          *
                        </span>
                      </FieldLabel>

                      <div className="relative mt-1.5">

                        <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={
                            showConfirmPassword
                              ? "text"
                              : "password"
                          }
                          placeholder="••••••••"
                          required
                          autoComplete="new-password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          disabled={isLoading}
                          className="pl-10 pr-11"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              (prev) => !prev
                            )
                          }
                          disabled={isLoading}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={
                            showConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>

                      </div>
                    </Field>

                    {/* Error */}
                    {error && (
                      <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                        <FieldError className="text-xs">
                          {error}
                        </FieldError>
                      </div>
                    )}

                    {/* Success */}
                    {success && (
                      <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-emerald-600 dark:text-emerald-400">

                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

                        <span className="text-xs font-medium leading-5">
                          {success}
                        </span>

                      </div>
                    )}

                    {/* Submit */}
                    <Field className="pt-2">

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="group h-11 w-full rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25"
                      >
                        {isLoading ? (
                          <>
                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />

                            {t("common.loading")}
                          </>
                        ) : (
                          <>
                            {t("auth.register.button")}

                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </Button>

                    </Field>

                    {/* Login */}
                    <div className="pt-1 text-center">

                      <Link
                        to="/login"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />

                        <span>
                          {t("auth.register.have_account")}
                        </span>
                      </Link>

                    </div>

                  </FieldGroup>
                </form>

              </CardContent>
            </Card>

            {/* Security */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />

              <span>
                Your information is securely protected
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
