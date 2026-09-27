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
import {
  Mail,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Save,
  X,
  Check,
  Copy,
  Phone,
  User as UserIcon,
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();

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
        // Keep default existing roleCodes intact so they don't change
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

  const currentFirstName = detailedUser?.firstName ?? user?.firstName ?? "";
  const currentLastName = detailedUser?.lastName ?? user?.lastName ?? "";
  const currentPhone = detailedUser?.phone ?? user?.phone ?? "";
  const currentProfileImage = detailedUser?.profileImage ?? user?.profileImage ?? "";
  const currentUsername = user?.username ?? detailedUser?.username ?? "";
  const currentEmail = user?.email ?? detailedUser?.email ?? "";

  const fullName = [currentFirstName, currentLastName].filter(Boolean).join(" ");
  const displayName = fullName || currentUsername || "User";

  const initials = fullName
    ? fullName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : currentUsername
    ? currentUsername.slice(0, 2).toUpperCase()
    : "US";

  const avatarSrc = currentProfileImage
    ? currentProfileImage.startsWith("http") || currentProfileImage.startsWith("blob")
      ? currentProfileImage
      : fileService.getPreviewUrl("user", currentProfileImage)
    : "";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Profile Settings"
        description="Manage your account profile, personal details, and security credentials."
      />

      {/* Profile Overview Header Card */}
      <Card className="relative overflow-hidden border-border/60 bg-linear-to-r from-card via-card to-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20 ring-4 ring-background shadow-md">
                {avatarSrc ? (
                  <AvatarImage src={avatarSrc} alt={displayName} className="object-cover" />
                ) : null}
                <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">{displayName}</h2>
                  <StatusBadge status={detailedUser?.isActive || "ACTIVE"} />
                </div>
                <p className="text-sm text-muted-foreground font-mono">@{currentUsername || "—"}</p>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                  {currentEmail && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      {currentEmail}
                    </span>
                  )}
                  {currentPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      {currentPhone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    {user?.storeId || detailedUser?.storeId
                      ? `#${user?.storeId || detailedUser?.storeId} (${assignedStore?.name || "Store"})`
                      : "All Stores / HQ"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gap-2 shadow-xs"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Details Card */}
        <Card>
          {isEditing ? (
            <>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Edit Profile</CardTitle>
                <CardDescription>Update your personal info, contact, and profile picture.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-foreground">
                      Profile Image
                    </label>
                    <FileUpload
                      bucketName="user"
                      value={editProfileImage}
                      onUploaded={(fileName) => setEditProfileImage(fileName)}
                      onRemove={() => setEditProfileImage("")}
                      label="Upload Profile Photo"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wide text-foreground">
                        First Name
                      </label>
                      <Input
                        type="text"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        placeholder="Enter first name"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wide text-foreground">
                        Last Name
                      </label>
                      <Input
                        type="text"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wide text-foreground">
                        Phone Number
                      </label>
                      <Input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="e.g. +855 12 345 678"
                      />
                    </div>

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

                  <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                    <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 mr-1.5" />
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={isSavingProfile}>
                      <Save className="h-4 w-4 mr-1.5" />
                      {isSavingProfile ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">Personal Information</CardTitle>
                  <CardDescription>Your personal profile details and contact information.</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gap-1.5 text-xs"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>First Name</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(currentFirstName || "", "firstName")}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {copiedField === "firstName" ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="mt-1 font-medium text-foreground">{currentFirstName || "—"}</p>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Last Name</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(currentLastName || "", "lastName")}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {copiedField === "lastName" ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="mt-1 font-medium text-foreground">{currentLastName || "—"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Phone</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(currentPhone || "", "phone")}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {copiedField === "phone" ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="mt-1 font-medium text-foreground">{currentPhone || "—"}</p>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Username</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(currentUsername || "", "username")}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {copiedField === "username" ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="mt-1 font-medium text-foreground">{currentUsername || "—"}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Email</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(currentEmail || "", "email")}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {copiedField === "email" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="mt-1 font-medium text-foreground">{currentEmail || "—"}</p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Store</p>
                    <p className="mt-1 font-medium text-foreground">
                      {user?.storeId || detailedUser?.storeId
                        ? `#${user?.storeId || detailedUser?.storeId} (${assignedStore?.name || "Store"})`
                        : "All Stores / HQ"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* Security & Password Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4 text-primary" />
              Security & Password
            </CardTitle>
            <CardDescription>Update your password and keep your account protected.</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
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
                          className={`h-1.5 rounded-full ${
                            strength.score >= step ? strength.color : "bg-muted"
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
