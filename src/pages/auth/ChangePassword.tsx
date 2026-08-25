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
import { AuthService, type ChangePasswordRequest } from "@/services/auth/auth.service";
import { Lock, CheckCircle2 } from "lucide-react";

import { useLanguage } from "@/i18n/LanguageContext";

export default function ChangePasswordPage({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
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
        err.response?.data?.message ||
          err.message ||
          "Failed to change password. Please verify your current password."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card className="border-border/60 shadow-xs rounded-2xl">
            <CardHeader className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold font-heading">
                    {t("auth.change.title")}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground font-sans">
                    {t("auth.change.subtitle")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <FieldGroup className="gap-4">
                  {/* Current Password */}
                  <Field>
                    <FieldLabel htmlFor="currentPassword" className="text-xs font-semibold">
                      {t("auth.change.current_password")} <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-10 text-xs rounded-xl"
                    />
                  </Field>

                  {/* New Password */}
                  <Field>
                    <FieldLabel htmlFor="newPassword" className="text-xs font-semibold">
                      {t("auth.change.new_password")} <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-10 text-xs rounded-xl"
                    />
                  </Field>

                  {/* Confirm New Password */}
                  <Field>
                    <FieldLabel htmlFor="confirmNewPassword" className="text-xs font-semibold">
                      {t("auth.change.confirm_new_password")} <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="confirmNewPassword"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-10 text-xs rounded-xl"
                    />
                  </Field>

                  {error && <FieldError className="text-xs">{error}</FieldError>}

                  {success && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{success}</span>
                    </div>
                  )}

                  <Field className="pt-2">
                    <Button type="submit" disabled={isLoading} className="w-full h-10 rounded-xl font-medium shadow-md shadow-primary/25">
                      {isLoading ? t("common.loading") : t("auth.change.button")}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
