import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "@/services/auth/auth.service";
import { ArrowRight, Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

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
      setError(err?.response?.data?.message || err?.message || "Invalid username/email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#f1f1f3] p-5">
      <div className="flex w-full max-w-[980px] overflow-hidden rounded-[28px] border border-[#e7e1ee] bg-white shadow-[0_30px_80px_rgba(79,62,130,0.12)]">
        <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-[#4b3bd5] via-[#4b3bd5] to-[#5c3ae4] p-10 md:flex">
          <div className="absolute -left-16 top-1/2 h-[210px] w-[210px] -translate-y-1/2 rounded-full bg-[#6552e1]/30 blur-2xl" />
          <div className="absolute -right-20 bottom-0 h-[250px] w-[250px] rounded-full bg-[#7f69f1]/25 blur-3xl" />
          <div className="relative z-10 flex w-full max-w-[420px] flex-col items-center">
            <div className="mb-8 flex h-[170px] w-[270px] items-center justify-center rounded-[22px] bg-[#f7f7f8] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
              <div className="relative flex h-[120px] w-[210px] items-center justify-center rounded-[18px] bg-white/80">
                <div className="absolute left-1/2 top-1/2 h-[104px] w-[104px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[8px] border-[#2ec5b8] border-l-transparent border-b-transparent rotate-45 opacity-90" />
                <div className="absolute left-1/2 top-1/2 h-[90px] w-[90px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[8px] border-[#30cdd3] border-r-transparent border-t-transparent rotate-45 opacity-80" />
                <div className="relative text-[54px] font-black tracking-[-0.08em] text-[#1ec7b7]">360</div>
                <div className="absolute right-6 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-[3px] border-[#1ec7b7] border-l-transparent border-b-transparent rotate-45" />
              </div>
            </div>

            <div className="text-5xl font-bold tracking-[-0.06em] text-white">POS System</div>
            <p className="mt-5 max-w-[300px] text-center text-lg leading-8 text-[#e7e0ff]">
              Welcome back! Enter your credentials to access the admin dashboard and manage your business effectively.
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center bg-[#f8f8f9] px-6 py-8 sm:px-10 md:px-12">
          <div className="w-full max-w-[420px]">
            <h1 className="mb-10 text-center text-5xl font-semibold tracking-[-0.06em] text-[#1f2430]">Sign In</h1>
            <p className="mb-8 text-center text-base text-[#6d7180]">Continue to your account.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="usernameOrEmail" className="block text-[12px] font-semibold tracking-[0.15em] text-[#4c4f5c] uppercase">
                  Username or Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d8291]" />
                  <Input
                    id="usernameOrEmail"
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="admin@example.com"
                    autoComplete="username"
                    disabled={isLoading}
                    className="h-14 rounded-xl border-0 bg-[#eef0f3] pl-11 pr-4 text-base text-[#1d2430] placeholder:text-[#8b90a0] focus-visible:ring-2 focus-visible:ring-[#5b4bd9]/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-[12px] font-semibold tracking-[0.15em] text-[#4c4f5c] uppercase">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d8291]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="h-14 rounded-xl border-0 bg-[#eef0f3] pl-11 pr-12 text-base text-[#1d2430] placeholder:text-[#8b90a0] focus-visible:ring-2 focus-visible:ring-[#5b4bd9]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#525a68] transition hover:bg-[#e3e7ee]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#4f3cd8] to-[#4a43d0] text-lg font-semibold text-white shadow-[0_12px_25px_rgba(75,59,213,0.30)] transition hover:brightness-105 disabled:opacity-80"
              >
                {isLoading ? "Signing In..." : "Sign In "}
                {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}