import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthService } from "@/services/auth/auth.service";
import { KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";

import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { useLanguage } from "@/i18n/LanguageContext";

export default function ForgotPasswordPage({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await AuthService.forgotPassword({ emailOrUsername });
      setSuccess("Password reset instructions have been sent to your email.");
    } catch (err: any) {
      console.error("Forgot password error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to send reset instructions. Please check your username or email."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="absolute top-4 right-4 z-10">
        <LanguageToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card className="border-border/60 shadow-lg rounded-2xl backdrop-blur-sm">
            <CardHeader className="text-center space-y-1.5 pb-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2 shadow-inner">
                <KeyRound className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-bold font-heading tracking-tight">
                {t("auth.forgot.title")}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-sans">
                {t("auth.forgot.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <FieldGroup className="gap-4">
                  <Field>
                    <FieldLabel htmlFor="emailOrUsername" className="text-xs font-semibold">
                      {t("auth.login.username_or_email")} <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="emailOrUsername"
                      type="text"
                      placeholder={t("auth.login.username_or_email")}
                      required
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      disabled={isLoading}
                      className="h-10 text-xs rounded-xl"
                    />
                  </Field>

                  {error && <FieldError className="text-xs">{error}</FieldError>}

                  {success && (
                    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{success}</span>
                    </div>
                  )}

                  <Field className="pt-1">
                    <Button type="submit" disabled={isLoading} className="w-full h-10 rounded-xl font-medium shadow-md shadow-primary/25">
                      {isLoading ? t("common.loading") : t("auth.forgot.button")}
                    </Button>
                  </Field>

                  <div className="text-center pt-2">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>{t("auth.forgot.back_to_login")}</span>
                    </Link>
                  </div>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
