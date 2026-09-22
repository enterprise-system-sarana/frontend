import { useMemo, useState } from "react";
import { useAuth } from "@/store/useAuth";
import { useAppDispatch } from "@/store/store";
import { updateUser } from "@/store/authSlice";
import { useStore } from "@/hooks/inventory/useStore";
import { useUser } from "@/hooks/users/useUser";
import { AuthService } from "@/services/auth/auth.service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { ROUTERS } from "@/constants/Route";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatDate } from "@/utils/formatDate";
import {
  Mail,
  Shield,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Save,
  X,
  Search,
  Check,
  Copy,
  ExternalLink,
} from "lucide-react";

export default function ProfilePage() {
  const { user, permissions, roles } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [permissionSearch, setPermissionSearch] = useState("");

  const { data: usersData } = useUser({ page: 1, size: 100 });
  const detailedUser = useMemo(() => {
    if (!usersData?.payload?.data || !user) return null;
    return usersData.payload.data.find(
      (u: any) => u.id === user.userId || u.username === user.username
    );
  }, [usersData, user]);

  const { data: storesData } = useStore.useGetAllStore({ page: 0, size: 1000 });
  const stores = storesData?.payload?.data ?? storesData?.data ?? [];
  const assignedStore = useMemo(() => {
    if (!user?.storeId) return null;
    return stores.find((s: any) => Number(s.id) === Number(user.storeId));
  }, [stores, user?.storeId]);

  const handleCopy = async (text: string, field: string) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`Copied ${field} to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Unable to copy to clipboard");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editUsername.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    if (!editEmail.trim() || !editEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSavingProfile(true);
    try {
      dispatch(
        updateUser({
          username: editUsername.trim(),
          email: editEmail.trim(),
        })
      );
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const strength = useMemo(() => {
    if (!newPassword) return { score: 0, label: "", color: "", text: "" };

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

  const hasMinLength = newPassword.length >= 8;
  const hasMixedCase = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const hasNumberOrSymbol = /[\d!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordFormValid =
    hasMinLength && passwordsMatch && currentPassword.trim().length > 0;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password");
      return;
    }

    setIsChangingPassword(true);
    try {
      await AuthService.changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess("Your password has been changed successfully!");
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to update password";
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const filteredPermissions = useMemo(() => {
    const list = permissions || [];
    if (!permissionSearch.trim()) return list;

    const query = permissionSearch.toLowerCase();
    return list.filter((permission) => permission.toLowerCase().includes(query));
  }, [permissions, permissionSearch]);

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "US";

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <PageHeader
        title={t("user.profile")}
        description="Manage your basic account details and security settings."
        hideButton
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-1.5 cursor-pointer"
            >
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        }
      />

      <Card className="overflow-hidden">
        <div className="bg-linear-to-r from-primary/10 to-primary/5 p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 rounded-2xl border-4 border-background shadow-sm">
                <AvatarFallback className="rounded-2xl bg-primary text-primary-foreground text-lg font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-foreground">
                    {user?.username || "System User"}
                  </h2>
                  <StatusBadge status="ACTIVE" />
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user?.email || "No email set"}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(roles && roles.length > 0 ? roles : ["USER"]).map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  <Shield className="h-3 w-3" />
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-border/60 p-4 sm:grid-cols-3">
          <div className="rounded-xl bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Assigned Store</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4 text-primary" />
              {assignedStore?.name || detailedUser?.storeName || "Main Branch"}
            </p>
          </div>
          <div className="rounded-xl bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Permissions</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium">
              <KeyRound className="h-4 w-4 text-primary" />
              {permissions?.length || 0}
            </p>
          </div>
          <div className="rounded-xl bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Last Login</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-primary" />
              {detailedUser?.lastLoginAt ? formatDate(detailedUser.lastLoginAt) : "Current session"}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>Basic account details and contact information.</CardDescription>
          </CardHeader>

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 p-6 pt-0">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  Username
                </label>
                <Input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  Email
                </label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSavingProfile}>
                  <Save className="h-4 w-4" />
                  {isSavingProfile ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 p-6 pt-0">
              <div className="space-y-3">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Username</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(user?.username || "", "username")}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {copiedField === "username" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 font-medium text-foreground">{user?.username || "—"}</p>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Email</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(user?.email || "", "email")}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {copiedField === "email" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 font-medium text-foreground">{user?.email || "—"}</p>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Store</p>
                  <p className="mt-1 font-medium text-foreground">
                    {user?.storeId ? `#${user.storeId} (${assignedStore?.name || "Store"})` : "All Stores / HQ"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4 text-primary" />
              Security
            </CardTitle>
            <CardDescription>Update your password and keep your account protected.</CardDescription>
          </CardHeader>

          <form onSubmit={handleChangePassword} className="space-y-4 p-6 pt-0">
            {passwordError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-foreground">
                Current Password
              </label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-foreground">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {newPassword && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Strength</span>
                    <span className={`font-medium ${strength.text}`}>{strength.label}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1.5 rounded-full ${strength.score >= step ? strength.color : "bg-muted"
                          }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-foreground">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-red-500">Passwords do not match</p>
              )}
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground space-y-2">
              <p className="font-medium uppercase tracking-wide text-foreground">Requirements</p>
              <div className="flex items-center gap-2">
                {hasMinLength ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />}
                <span>At least 8 characters</span>
              </div>
              <div className="flex items-center gap-2">
                {hasMixedCase ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />}
                <span>Upper and lowercase letters</span>
              </div>
              <div className="flex items-center gap-2">
                {hasNumberOrSymbol ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />}
                <span>Number or special symbol</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                size="sm"
                disabled={!isPasswordFormValid || isChangingPassword}
                className="gap-1.5"
              >
                <Save className="h-4 w-4" />
                {isChangingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-primary" />
              Roles & Permissions
            </CardTitle>
            <CardDescription>Your available access rights for this account.</CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(ROUTERS.ROLE_PERMISSIONS)}
            className="gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Manage Permissions
          </Button>
        </CardHeader>

        <div className="space-y-4 p-6 pt-0">
          <div className="flex flex-wrap gap-2">
            {(roles && roles.length > 0 ? roles : ["USER"]).map((role) => (
              <span
                key={role}
                className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground"
              >
                {role}
              </span>
            ))}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={permissionSearch}
              onChange={(e) => setPermissionSearch(e.target.value)}
              placeholder="Search permissions"
              className="pl-9"
            />
          </div>

          {filteredPermissions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No permissions found
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredPermissions.map((permission) => (
                <span
                  key={permission}
                  className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-mono text-foreground"
                >
                  {permission}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
