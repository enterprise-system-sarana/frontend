import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/store/useAuth";
import { useAppDispatch } from "@/store/store";
import { updateUser } from "@/store/authSlice";
import { useStore } from "@/hooks/inventory/useStore";
import { useUser } from "@/hooks/users/useUser";
import { userService } from "@/services/users/user.service";
import { AuthService } from "@/services/auth/auth.service";
import { fileService } from "@/services/file/file.service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { FileUpload } from "@/components/ui/FileUpload";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  Fingerprint,
  Hash,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Save,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Store,
  User,
  UserCheck,
  X,
  ArrowRight,
  ShieldAlert,
  IdCard,
} from "lucide-react";

type ProfileTab = "overview" | "security" | "permissions";

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  const { data: usersData, refetch: refetchUsers } = useUser({ page: 1, size: 100 });
  const detailedUser = useMemo(() => {
    if (!usersData?.payload?.data || !user) return null;
    return usersData.payload.data.find(
      (u: any) => u.id === user.userId || u.username === user.username
    );
  }, [usersData, user]);

  const { data: storesData } = useStore.useGetAllStore({ page: 0, size: 1000 });
  const stores = storesData?.payload?.data ?? storesData?.data ?? [];
  const assignedStore = useMemo(() => {
    const storeId = user?.storeId ?? detailedUser?.storeId;
    if (!storeId) return null;
    return stores.find((s: any) => Number(s.id) === Number(storeId));
  }, [stores, user?.storeId, detailedUser?.storeId]);

  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editProfileImage, setEditProfileImage] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
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

  // Sync state whenever detailedUser or user changes
  useEffect(() => {
    if (detailedUser) {
      setEditFirstName(detailedUser.firstName || "");
      setEditLastName(detailedUser.lastName || "");
      setEditPhone(detailedUser.phone || "");
      setEditProfileImage(detailedUser.profileImage || "");
      setEditUsername(detailedUser.username || user?.username || "");
      setEditEmail(detailedUser.email || user?.email || "");
    } else if (user) {
      setEditFirstName(user.firstName || "");
      setEditLastName(user.lastName || "");
      setEditPhone(user.phone || "");
      setEditProfileImage(user.profileImage || "");
      setEditUsername(user.username || "");
      setEditEmail(user.email || "");
    }
  }, [detailedUser, user]);

  const handleCancelEdit = () => {
    if (detailedUser) {
      setEditFirstName(detailedUser.firstName || "");
      setEditLastName(detailedUser.lastName || "");
      setEditPhone(detailedUser.phone || "");
      setEditProfileImage(detailedUser.profileImage || "");
      setEditUsername(detailedUser.username || user?.username || "");
      setEditEmail(detailedUser.email || user?.email || "");
    } else if (user) {
      setEditFirstName(user.firstName || "");
      setEditLastName(user.lastName || "");
      setEditPhone(user.phone || "");
      setEditProfileImage(user.profileImage || "");
      setEditUsername(user.username || "");
      setEditEmail(user.email || "");
    }
    setIsEditing(false);
  };

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
      const targetUserId = detailedUser?.id || user?.userId;
      if (targetUserId) {
        const currentRoles =
          (detailedUser as any)?.roleCodes ||
          detailedUser?.roles ||
          (user as any)?.roleCodes ||
          user?.roles ||
          [];

        const preservedRoleCodes = (Array.isArray(currentRoles) ? currentRoles : [currentRoles])
          .map((r: any) => (typeof r === "string" ? r : r.code || r.name))
          .filter(Boolean);

        await userService.update(targetUserId, {
          firstName: editFirstName.trim() || null,
          lastName: editLastName.trim() || null,
          phone: editPhone.trim() || null,
          profileImage: editProfileImage.trim() || null,
          email: editEmail.trim(),
          isActive: detailedUser?.isActive || (user as any)?.isActive || "ACTIVE",
          storeId: detailedUser?.storeId ?? user?.storeId ?? null,
          roleCodes: preservedRoleCodes.length > 0 ? preservedRoleCodes : (user?.roles || []),
        } as any);
      }

      dispatch(
        updateUser({
          username: editUsername.trim(),
          email: editEmail.trim(),
          firstName: editFirstName.trim(),
          lastName: editLastName.trim(),
          phone: editPhone.trim(),
          profileImage: editProfileImage.trim(),
        })
      );

      refetchUsers();
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to update profile";
      toast.error(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Password requirements checks
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordFormValid =
    hasMinLength && passwordsMatch && currentPassword.trim().length > 0;

  const strength = useMemo(() => {
    if (!newPassword) return { score: 0, label: "", color: "", text: "" };

    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (hasLower && hasUpper) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecial) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: t("profile.strength_weak", "Weak"), color: "bg-rose-500", text: "text-rose-500" };
      case 2:
        return { score: 2, label: t("profile.strength_fair", "Fair"), color: "bg-amber-500", text: "text-amber-500" };
      case 3:
        return { score: 3, label: t("profile.strength_good", "Good"), color: "bg-sky-500", text: "text-sky-500" };
      case 4:
        return { score: 4, label: t("profile.strength_strong", "Strong"), color: "bg-emerald-500", text: "text-emerald-500" };
      default:
        return { score: 0, label: t("profile.strength_too_short", "Too Short"), color: "bg-rose-400", text: "text-rose-400" };
    }
  }, [newPassword, hasLower, hasUpper, hasNumber, hasSpecial, t]);

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
      setPasswordError(t("profile.passwords_not_match", "New passwords do not match"));
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
      setPasswordSuccess(t("profile.password_updated_success", "Your password has been changed successfully!"));
      toast.success(t("profile.password_updated_success", "Password updated successfully"));
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

  const currentFirstName = detailedUser?.firstName ?? user?.firstName ?? "";
  const currentLastName = detailedUser?.lastName ?? user?.lastName ?? "";
  const currentPhone = detailedUser?.phone ?? user?.phone ?? "";
  const currentProfileImage = detailedUser?.profileImage ?? user?.profileImage ?? "";
  const currentUsername = user?.username ?? detailedUser?.username ?? "";
  const currentEmail = user?.email ?? detailedUser?.email ?? "";

  const fullName = [currentFirstName, currentLastName].filter(Boolean).join(" ");
  const displayName = fullName || currentUsername || "User";

  const rawRoles =
    (detailedUser as any)?.roleCodes ||
    detailedUser?.roles ||
    (user as any)?.roleCodes ||
    user?.roles ||
    [];

  const roleList: string[] = useMemo(() => {
    const list = (Array.isArray(rawRoles) ? rawRoles : [rawRoles])
      .map((r: any) => (typeof r === "string" ? r : r.code || r.name))
      .filter(Boolean);
    return list.length > 0 ? list : ["USER"];
  }, [rawRoles]);

  const permissionList: string[] = useMemo(() => {
    const p = user?.permissions || (detailedUser as any)?.permissions || [];
    return Array.isArray(p) ? p : [];
  }, [user?.permissions, detailedUser]);

  const filteredPermissions = useMemo(() => {
    if (!permissionSearch.trim()) return permissionList;
    const query = permissionSearch.toLowerCase();
    return permissionList.filter((p) => p.toLowerCase().includes(query));
  }, [permissionList, permissionSearch]);

  const avatarSrc = currentProfileImage
    ? currentProfileImage.startsWith("http") || currentProfileImage.startsWith("blob")
      ? currentProfileImage
      : fileService.getPreviewUrl("user", currentProfileImage)
    : "/default-user-avatar.png";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title={t("profile.settings", "Profile Settings")}
        description={t("profile.settings_desc", "Manage your account profile, personal details, and security credentials.")}
      />

      {/* Executive Cover Banner & Identity Header Card */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        {/* Cover Graphic Banner */}
        <div className="h-32 sm:h-36 w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 relative p-4 flex items-start justify-end overflow-hidden">
          {/* Subtle Ambient Orbs */}
          <div className="absolute -top-12 -left-12 size-48 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute top-0 right-1/4 size-36 rounded-full bg-sky-500/15 blur-2xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_60%)]" />

          {/* User ID chip */}
          <div className="relative z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white/80 text-[11px] font-mono border border-white/10 shadow-xs">
            <IdCard className="size-3 text-indigo-400" />
            <span>ID #{user?.userId || detailedUser?.id || "—"}</span>
          </div>
        </div>

        {/* Profile Card Body with Floating Avatar */}
        <div className="px-5 sm:px-8 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              {/* Floating Avatar with Online Ring */}
              <div className="relative size-24 sm:size-28 rounded-2xl ring-4 ring-card bg-card shadow-xl overflow-hidden shrink-0 group">
                {avatarSrc ? (
                  <Avatar className="size-full rounded-2xl">
                    <AvatarImage src={avatarSrc} alt={displayName} className="object-cover size-full" />
                    <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary size-full flex items-center justify-center">
                      <img src="/default-user-avatar.png" alt="" className="size-full object-cover" />
                    </AvatarFallback>
                  </Avatar>
                ) : null}

                {/* Online Indicator */}
                <div
                  className="absolute bottom-1.5 right-1.5 size-4 rounded-full bg-emerald-500 ring-2 ring-card shadow-xs"
                  title="Account Active"
                />
              </div>

              {/* Title & Badges */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-heading">
                    {displayName}
                  </h2>
                  <StatusBadge status={detailedUser?.isActive || "ACTIVE"} />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded text-[11px] border border-border/40">
                    @{currentUsername || "—"}
                  </span>

                  {/* Assigned Store */}
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-border/40">
                    <Store className="size-3 text-indigo-500 shrink-0" />
                    <span>
                      {user?.storeId || detailedUser?.storeId
                        ? `#${user?.storeId || detailedUser?.storeId} (${assignedStore?.name || "Store"})`
                        : t("profile.all_stores_hq", "All Stores / HQ")}
                    </span>
                  </span>

                  {/* Role Tags */}
                  {roleList.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60"
                    >
                      <Shield className="size-3 shrink-0" />
                      <span>{role.replace("ROLE_", "")}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(true);
                      setActiveTab("overview");
                    }}
                    className="gap-1.5 text-xs rounded-lg font-semibold shadow-xs hover:border-primary/50"
                  >
                    <Edit3 className="size-3.5 text-primary" />
                    <span>{t("profile.edit_profile", "Edit Profile")}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("security")}
                    className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Lock className="size-3.5" />
                    <span>{t("profile.security_password", "Security")}</span>
                  </Button>
                </>
              ) : (
                <div className="inline-flex items-center gap-2">
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                    {t("common.editing", "Editing Mode")}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="text-xs gap-1"
                  >
                    <X className="size-3.5" />
                    <span>{t("common.cancel", "Cancel")}</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Contact Line */}
          <div className="pt-2 border-t border-border/40 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {currentEmail && (
              <span className="flex items-center gap-1.5">
                <Mail className="size-3.5 text-sky-500 shrink-0" />
                <span className="font-mono text-[11px] text-foreground">{currentEmail}</span>
              </span>
            )}
            {currentPhone && (
              <span className="flex items-center gap-1.5">
                <Phone className="size-3.5 text-emerald-500 shrink-0" />
                <span className="font-mono text-[11px] text-foreground">{currentPhone}</span>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-amber-500 shrink-0" />
              <span>{permissionList.length} {t("profile.permissions_count", "active capabilities")}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/60 w-fit shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            activeTab === "overview"
              ? "bg-background text-foreground shadow-xs border border-border/80"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          }`}
        >
          <User className="size-3.5 text-primary" />
          <span>{t("profile.personal_info", "Personal Information")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            activeTab === "security"
              ? "bg-background text-foreground shadow-xs border border-border/80"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          }`}
        >
          <Lock className="size-3.5 text-amber-500" />
          <span>{t("profile.security_password", "Security & Password")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("permissions")}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            activeTab === "permissions"
              ? "bg-background text-foreground shadow-xs border border-border/80"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          }`}
        >
          <ShieldCheck className="size-3.5 text-emerald-500" />
          <span>{t("profile.roles_permissions", "Roles & Permissions")}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
            {roleList.length}
          </span>
        </button>
      </div>

      {/* TAB 1: Personal Details & Overview */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Main Profile Info / Edit Form */}
          <div className="lg:col-span-8">
            <Card className="rounded-xl border-border/60 shadow-xs">
              {isEditing ? (
                <>
                  <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Edit3 className="size-4 text-primary" />
                      <span>{t("profile.edit_profile", "Edit Personal Information")}</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {t("profile.edit_profile_desc", "Update your personal profile, contact channels, and avatar image.")}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-5">
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      {/* Avatar Upload */}
                      <div className="space-y-2 p-3.5 rounded-xl border border-border/60 bg-muted/20">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <User className="size-3.5 text-primary" />
                          <span>{t("profile.profile_image", "Profile Photo")}</span>
                        </label>
                        <FileUpload
                          bucketName="user"
                          value={editProfileImage}
                          onUploaded={(fileName) => setEditProfileImage(fileName)}
                          onRemove={() => setEditProfileImage("")}
                          label={t("profile.upload_photo", "Upload or change profile photo")}
                        />
                      </div>

                      {/* Name Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                            {t("profile.first_name", "First Name")}
                          </label>
                          <Input
                            type="text"
                            value={editFirstName}
                            onChange={(e) => setEditFirstName(e.target.value)}
                            placeholder="Enter first name"
                            className="h-9 text-xs rounded-lg border-border/80"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                            {t("profile.last_name", "Last Name")}
                          </label>
                          <Input
                            type="text"
                            value={editLastName}
                            onChange={(e) => setEditLastName(e.target.value)}
                            placeholder="Enter last name"
                            className="h-9 text-xs rounded-lg border-border/80"
                          />
                        </div>
                      </div>

                      {/* Contact & Username */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                            {t("profile.username", "Username")} <span className="text-destructive">*</span>
                          </label>
                          <Input
                            type="text"
                            value={editUsername}
                            onChange={(e) => setEditUsername(e.target.value)}
                            placeholder="Enter username"
                            required
                            className="h-9 text-xs rounded-lg border-border/80 font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                            {t("profile.phone_number", "Phone Number")}
                          </label>
                          <Input
                            type="text"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="e.g. +855 12 345 678"
                            className="h-9 text-xs rounded-lg border-border/80 font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                          {t("profile.email", "Email Address")} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="name@company.com"
                          required
                          className="h-9 text-xs rounded-lg border-border/80 font-mono"
                        />
                      </div>

                      <div className="flex justify-end gap-2.5 pt-3 border-t border-border/50">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="text-xs rounded-lg font-semibold"
                        >
                          <X className="size-3.5 mr-1.5" />
                          {t("common.cancel", "Cancel")}
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isSavingProfile}
                          className="text-xs rounded-lg font-semibold bg-primary"
                        >
                          <Save className="size-3.5 mr-1.5" />
                          {isSavingProfile ? t("common.loading", "Saving...") : t("profile.save_changes", "Save Changes")}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </>
              ) : (
                <>
                  <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40 bg-muted/10">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <User className="size-4 text-primary" />
                        <span>{t("profile.personal_info", "Personal Information")}</span>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {t("profile.personal_info_desc", "Your personal profile details and contact information.")}
                      </CardDescription>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="gap-1.5 text-xs font-semibold rounded-lg shadow-xs"
                    >
                      <Edit3 className="size-3.5 text-primary" />
                      <span>{t("common.edit", "Edit")}</span>
                    </Button>
                  </CardHeader>

                  <CardContent className="p-5">
                    {/* Modern Interactive Information Tiles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* First Name Tile */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-muted/30 transition-all duration-200 group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <User className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                              {t("profile.first_name", "First Name")}
                            </span>
                            <span className="text-sm font-semibold text-foreground truncate block">
                              {currentFirstName || "—"}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopy(currentFirstName || "", "First Name")}
                          className="size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors shrink-0"
                          title="Copy first name"
                        >
                          {copiedField === "First Name" ? (
                            <Check className="size-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Last Name Tile */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-muted/30 transition-all duration-200 group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-9 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                            <UserCheck className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                              {t("profile.last_name", "Last Name")}
                            </span>
                            <span className="text-sm font-semibold text-foreground truncate block">
                              {currentLastName || "—"}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopy(currentLastName || "", "Last Name")}
                          className="size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors shrink-0"
                          title="Copy last name"
                        >
                          {copiedField === "Last Name" ? (
                            <Check className="size-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Username Tile */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-muted/30 transition-all duration-200 group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Hash className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                              {t("profile.username", "Username")}
                            </span>
                            <span className="text-sm font-mono font-semibold text-foreground truncate block">
                              @{currentUsername || "—"}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopy(currentUsername || "", "Username")}
                          className="size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors shrink-0"
                          title="Copy username"
                        >
                          {copiedField === "Username" ? (
                            <Check className="size-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Phone Tile */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-muted/30 transition-all duration-200 group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Phone className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                              {t("profile.phone", "Phone Number")}
                            </span>
                            <span className="text-sm font-mono font-semibold text-foreground truncate block">
                              {currentPhone || "—"}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopy(currentPhone || "", "Phone")}
                          className="size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors shrink-0"
                          title="Copy phone"
                        >
                          {copiedField === "Phone" ? (
                            <Check className="size-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Email Tile */}
                      <div className="sm:col-span-2 flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-muted/30 transition-all duration-200 group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-9 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                            <Mail className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                {t("profile.email", "Email Address")}
                              </span>
                              <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                Primary
                              </span>
                            </div>
                            <span className="text-sm font-mono font-semibold text-foreground truncate block">
                              {currentEmail || "—"}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopy(currentEmail || "", "Email")}
                          className="size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors shrink-0"
                          title="Copy email"
                        >
                          {copiedField === "Email" ? (
                            <Check className="size-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Store Assignment Tile */}
                      <div className="sm:col-span-2 flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-muted/30 transition-all duration-200 group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <Building2 className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                              {t("store.name", "Assigned Location / Store")}
                            </span>
                            <span className="text-sm font-semibold text-foreground truncate block">
                              {user?.storeId || detailedUser?.storeId
                                ? `#${user?.storeId || detailedUser?.storeId} · ${assignedStore?.name || "Assigned Store"}`
                                : t("profile.all_stores_hq", "All Stores / Headquarters (Global Access)")}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                          {user?.storeId || detailedUser?.storeId ? "Store Assigned" : "Global"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          </div>

          {/* Side Cards: Account Overview & Quick Security */}
          <div className="lg:col-span-4 space-y-5">
            {/* Account Snapshot Card */}
            <Card className="rounded-xl border-border/60 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-500" />
                  <span>{t("profile.account_status", "Account Snapshot")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">{t("profile.account_id", "Account ID")}</span>
                  <span className="font-mono font-bold text-foreground">
                    #{user?.userId || detailedUser?.id || "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">{t("profile.status", "Status")}</span>
                  <StatusBadge status={detailedUser?.isActive || "ACTIVE"} />
                </div>

                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">{t("profile.roles", "Assigned Roles")}</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {roleList.map((r) => (
                      <span
                        key={r}
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                      >
                        {r.replace("ROLE_", "")}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">{t("profile.permissions", "Capabilities")}</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("permissions")}
                    className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span>{permissionList.length} permissions</span>
                    <ArrowRight className="size-3" />
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Security Status Card */}
            <Card className="rounded-xl border-border/60 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Lock className="size-4 text-amber-500" />
                  <span>{t("profile.security_card", "Security & Protection")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("profile.security_card_desc", "Keep your password updated regularly to safeguard transaction integrity.")}
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("security")}
                  className="w-full text-xs font-semibold gap-1.5 rounded-lg border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                >
                  <KeyRound className="size-3.5" />
                  <span>{t("profile.update_password", "Change Password")}</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: Security & Password */}
      {activeTab === "security" && (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          <div className="lg:col-span-8">
            <Card className="rounded-xl border-border/60 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Lock className="size-4 text-primary" />
                  <span>{t("profile.security_password", "Change Account Password")}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {t("profile.security_password_desc", "Update your password and keep your account protected with strong credentials.")}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {passwordError && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-300">
                      <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-600" />
                      <span className="font-medium">{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      <span className="font-medium">{passwordSuccess}</span>
                    </div>
                  )}

                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      {t("profile.current_password", "Current Password")} <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10 h-9 text-xs rounded-lg border-border/80"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded"
                      >
                        {showCurrent ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      {t("profile.new_password", "New Password")} <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="pr-10 h-9 text-xs rounded-lg border-border/80"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded"
                      >
                        {showNew ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>

                    {/* Dynamic Password Strength Indicator */}
                    {newPassword && (
                      <div className="space-y-2 pt-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{t("profile.strength", "Password Strength")}:</span>
                          <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                strength.score >= step ? strength.color : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      {t("profile.confirm_new_password", "Confirm Password")} <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="pr-10 h-9 text-xs rounded-lg border-border/80"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded"
                      >
                        {showConfirm ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>

                    {/* Real-time Match Indicator */}
                    {confirmPassword && (
                      <p className={`text-[11px] font-medium flex items-center gap-1 ${
                        newPassword === confirmPassword ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                      }`}>
                        {newPassword === confirmPassword ? (
                          <>
                            <CheckCircle2 className="size-3" />
                            <span>{t("profile.passwords_match", "Passwords match successfully")}</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="size-3" />
                            <span>{t("profile.passwords_not_match", "Passwords do not match")}</span>
                          </>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end pt-3 border-t border-border/50">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!isPasswordFormValid || isChangingPassword}
                      className="text-xs font-semibold rounded-lg bg-primary gap-1.5"
                    >
                      <Save className="size-3.5" />
                      <span>{isChangingPassword ? t("common.loading", "Updating...") : t("profile.update_password", "Update Password")}</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Password Guidelines Card */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="rounded-xl border-border/60 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  <span>{t("profile.security_guidelines", "Security Requirements")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 ${hasMinLength ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}`}>
                    <CheckCircle2 className={`size-3.5 ${hasMinLength ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                    <span>At least 8 characters length</span>
                  </div>

                  <div className={`flex items-center gap-2 ${hasUpper && hasLower ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}`}>
                    <CheckCircle2 className={`size-3.5 ${hasUpper && hasLower ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                    <span>Uppercase and lowercase letters</span>
                  </div>

                  <div className={`flex items-center gap-2 ${hasNumber ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}`}>
                    <CheckCircle2 className={`size-3.5 ${hasNumber ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                    <span>At least one numeric digit (0-9)</span>
                  </div>

                  <div className={`flex items-center gap-2 ${hasSpecial ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}`}>
                    <CheckCircle2 className={`size-3.5 ${hasSpecial ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                    <span>Special character (!@#$%^&*)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40">
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    {t("profile.password_tip", "Avoid reusing passwords from personal email or other systems.")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: Roles & Permissions */}
      {activeTab === "permissions" && (
        <Card className="rounded-xl border-border/60 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                <span>{t("profile.roles_permissions", "Assigned Roles & System Capabilities")}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {t("profile.roles_permissions_desc", "Review your operational access rights and role privileges.")}
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={permissionSearch}
                onChange={(e) => setPermissionSearch(e.target.value)}
                placeholder="Search capabilities..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border/70 bg-background placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
              />
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-5">
            {/* Roles Strip */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                {t("profile.active_roles", "Active Roles")} ({roleList.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {roleList.map((role) => (
                  <div
                    key={role}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-700 dark:text-indigo-300"
                  >
                    <Shield className="size-4 text-indigo-500" />
                    <span className="font-mono text-xs font-bold">{role.replace("ROLE_", "")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Permissions Breakdown */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("profile.permission_list", "Granted Permissions")} ({filteredPermissions.length})
                </span>
                {permissionSearch && (
                  <span className="text-[11px] text-muted-foreground">
                    Matching "{permissionSearch}"
                  </span>
                )}
              </div>

              {filteredPermissions.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                  {t("common.no_results", "No permissions match your filter")}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-80 overflow-y-auto pr-1">
                  {filteredPermissions.map((perm) => (
                    <div
                      key={perm}
                      className="p-2.5 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center gap-2 text-xs"
                    >
                      <Fingerprint className="size-3.5 text-primary shrink-0" />
                      <span className="font-mono text-[11px] text-foreground truncate">{perm}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
