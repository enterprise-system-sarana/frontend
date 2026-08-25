import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AuthService } from "@/services/auth/auth.service";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
} from "lucide-react";

import { useLanguage } from "@/i18n/LanguageContext";

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

      navigate("/");
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

    <main className="relative flex min-h-svh items-center justify-center px-5 py-10 sm:px-8">

      <div className="w-full max-w-[400px]">

        <div className="mb-8">

          <h2 className="text-[30px] font-semibold tracking-[-0.025em]">
            {t("auth.login.title")}
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("auth.login.no_account")}{" "}

            <Link
              to=""
              className="font-medium text-primary hover:underline"
            >
              {t("auth.login.signup")}
            </Link>
          </p>

        </div>

        <Card className="border-border/70 shadow-sm">

          <CardContent className="p-6 sm:p-7">

            <form onSubmit={handleSubmit}>

              <FieldGroup className="gap-5">

                <Field>

                  <FieldLabel
                    htmlFor="usernameOrEmail"
                    className="text-[13px] font-medium"
                  >
                    {t("auth.login.username_or_email")}
                  </FieldLabel>

                  <div className="relative mt-2">

                    <UserRound
                      className="
                            pointer-events-none
                            absolute
                            left-3
                            top-1/2
                            h-4
                            w-4
                            -translate-y-1/2
                            text-muted-foreground
                          "
                    />

                    <Input
                      id="usernameOrEmail"
                      type="text"
                      placeholder="Username or email"
                      required
                      autoFocus
                      autoComplete="username"
                      value={usernameOrEmail}
                      onChange={(e) =>
                        setUsernameOrEmail(e.target.value)
                      }
                      disabled={isLoading}
                      className="
                            h-11
                            rounded-lg
                            border-border
                            bg-background
                            pl-10
                            text-sm
                            shadow-none
                            transition
                            placeholder:text-muted-foreground/50
                            focus-visible:border-primary
                            focus-visible:ring-2
                            focus-visible:ring-primary/10
                          "
                    />

                  </div>

                </Field>

                {/* Password */}
                <Field>

                  <div className="flex items-center justify-between">

                    <FieldLabel
                      htmlFor="password"
                      className="text-[13px] font-medium"
                    >
                      {t("auth.login.password")}
                    </FieldLabel>

                    <Link
                      to="/forgot-password"
                      className="
                            text-xs
                            font-medium
                            text-muted-foreground
                            transition-colors
                            hover:text-primary
                          "
                    >
                      {t("auth.login.forgot_password")}
                    </Link>

                  </div>

                  <div className="relative mt-2">

                    <LockKeyhole
                      className="
                            pointer-events-none
                            absolute
                            left-3
                            top-1/2
                            h-4
                            w-4
                            -translate-y-1/2
                            text-muted-foreground
                          "
                    />

                    <Input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      disabled={isLoading}
                      className="
                            h-11
                            rounded-lg
                            border-border
                            bg-background
                            pl-10
                            pr-11
                            text-sm
                            shadow-none
                            transition
                            placeholder:text-muted-foreground/50
                            focus-visible:border-primary
                            focus-visible:ring-2
                            focus-visible:ring-primary/10
                          "
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((value) => !value)
                      }
                      disabled={isLoading}
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="
                            absolute
                            right-2
                            top-1/2
                            flex
                            h-8
                            w-8
                            -translate-y-1/2
                            items-center
                            justify-center
                            rounded-md
                            text-muted-foreground
                            transition
                            hover:bg-muted
                            hover:text-foreground
                          "
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>

                  </div>

                </Field>

                {/* Error */}
                {error && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3.5 py-3">

                    <FieldError className="text-xs leading-5">
                      {error}
                    </FieldError>

                  </div>
                )}

                {/* Submit */}
                <Field className="pt-1">

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="
                          h-11
                          w-full
                          rounded-lg
                          font-medium
                          shadow-sm
                          transition-all
                          duration-200
                          hover:-translate-y-[1px]
                          hover:shadow-md
                          active:translate-y-0
                        "
                  >
                    {isLoading ? (
                      <>
                        <span
                          className="
                                mr-2
                                h-4
                                w-4
                                animate-spin
                                rounded-full
                                border-2
                                border-current
                                border-t-transparent
                              "
                        />

                        {t("common.loading")}
                      </>
                    ) : (
                      <>
                        {t("auth.login.button")}

                        <ArrowRight
                          className="
                                ml-2
                                h-4
                                w-4
                                transition-transform
                                group-hover:translate-x-1
                              "
                        />
                      </>
                    )}
                  </Button>

                </Field>

              </FieldGroup>

            </form>

          </CardContent>
        </Card>



      </div>
    </main>
  );
}