import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/store/useAuth";
import { useAppDispatch } from "@/store/store";
import { updateUser } from "@/store/authSlice";
import { useStore } from "@/hooks/inventory/useStore";
import { useUser, useUpdateUser } from "@/hooks/users/useUser";
import { AuthService } from "@/services/auth/auth.service";
import { fileService } from "@/services/file/file.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileUpload } from "@/components/ui/FileUpload";
import { toast } from "sonner";
import {
  Mail,
  Building2,
  Lock,
  Eye,
  EyeOff,
  Edit3,
  Save,
  X,
  Check,
  User,
  Shield,
  Phone,
} from "lucide-react";

export default function ProfilePage() {
  const { user, roles } = useAuth();
  const dispatch = useAppDispatch();
  const { mutateAsync: updateUserMutate } = useUpdateUser();

  /* ── Store lookup ── */
  const { data: usersData } = useUser({ page: 1, size: 100 });
  const detailedUser = useMemo(() => {
    if (!usersData?.payload?.data || !user) return null;
    return usersData.payload.data.find(
      (u: any) => u.id === user.userId || u.username === user.username
    );
  }, [usersData, user]);

  /* ── Edit Profile ── */
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editProfileImage, setEditProfileImage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (detailedUser && !isEditing) {
      setEditLastName(detailedUser.lastName || "");
      setEditPhone(detailedUser.phone || "");
      setEditProfileImage(detailedUser.profileImage || "");
      setEditEmail(detailedUser.email || user?.email || "");
      setEditUsername(detailedUser.username || user?.username || "");
    }
  }, [detailedUser, isEditing, user]);

  /* ── Change Password ── */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const { data: storesData } = useStore.useGetAllStore({ page: 0, size: 1000 });
  const stores = storesData?.payload?.data ?? storesData?.data ?? [];
  const assignedStore = useMemo(() => {
    if (!user?.storeId) return null;
    return stores.find((s: any) => Number(s.id) === Number(user.storeId));
  }, [stores, user?.storeId]);

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "US";
  const storeName = assignedStore?.name || detailedUser?.storeName || "All Stores";
  const roleList = roles && roles.length > 0 ? roles : ["USER"];

  /* ── Handlers ── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUsername.trim()) { toast.error("Username is required"); return; }
    if (!editEmail.trim() || !editEmail.includes("@")) { toast.error("Valid email is required"); return; }
    setIsSaving(true);
    try {
      if (user?.userId) {
        await updateUserMutate({
          id: user.userId,
          request: {
            firstName: detailedUser?.firstName || "",
            lastName: editLastName.trim(),
            phone: editPhone.trim(),
            email: editEmail.trim(),
            profileImage: editProfileImage,
            roleCodes: detailedUser?.roles || ["USER"],
            storeId: detailedUser?.storeId || null,
            isActive: detailedUser?.isActive || "ACTIVE",
          }
        });
      }
      
      dispatch(updateUser({ username: editUsername.trim(), email: editEmail.trim() }));
      toast.success("Profile updated");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.message || "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditUsername(detailedUser?.username || user?.username || "");
    setEditEmail(detailedUser?.email || user?.email || "");
    setEditLastName(detailedUser?.lastName || "");
    setEditPhone(detailedUser?.phone || "");
    setEditProfileImage(detailedUser?.profileImage || "");
    setIsEditing(false);
  };

  const isPasswordValid =
    currentPassword.trim().length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword;

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (!currentPassword) { setPwError("Enter your current password"); return; }
    if (newPassword.length < 8) { setPwError("New password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setPwError("Passwords do not match"); return; }
    if (currentPassword === newPassword) { setPwError("New password must differ from current"); return; }
    setIsChangingPw(true);
    try {
      await AuthService.changePassword({ currentPassword, newPassword });
      toast.success("Password updated successfully");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to update password";
      setPwError(msg);
      toast.error(msg);
    } finally {
      setIsChangingPw(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-10">

      {/* ── Avatar Banner ── */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
            {/* Avatar */}
            <Avatar className="h-20 w-20 shrink-0 rounded-2xl border-4 border-background shadow-md">
              {detailedUser?.profileImage && (
                <AvatarImage src={fileService.getPreviewUrl("profile", detailedUser.profileImage)} />
              )}
              <AvatarFallback className="rounded-2xl bg-primary text-primary-foreground text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl font-bold text-foreground">
                {detailedUser?.firstName || ""} {detailedUser?.lastName || ""} {!(detailedUser?.firstName || detailedUser?.lastName) && (user?.username || "User")}
              </h1>
              <p className="mt-0.5 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                <Mail className="h-3.5 w-3.5" />
                {detailedUser?.email || user?.email || "No email"}
              </p>
              {detailedUser?.phone && (
                <p className="mt-0.5 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                  <Phone className="h-3.5 w-3.5" />
                  {detailedUser.phone}
                </p>
              )}

              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                {roleList.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                  >
                    <Shield className="h-3 w-3" />
                    {role}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  {storeName}
                </span>
              </div>
            </div>

            {/* Edit toggle */}
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="shrink-0 gap-1.5 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* ── Edit Form ── */}
        {isEditing && (
          <form onSubmit={handleSave} className="border-t border-border/60 p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Edit Profile
            </p>

            <div className="flex flex-col gap-5">
              <div className="flex justify-center sm:justify-start">
                <FileUpload
                  bucketName="profile"
                  value={editProfileImage}
                  onUploaded={(fileName) => setEditProfileImage(fileName)}
                  onRemove={() => setEditProfileImage("")}
                  label="Profile Image"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Username</label>
                  <Input
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="Username"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Email</label>
                  <Input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Last Name</label>
                  <Input
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    placeholder="Last Name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Phone</label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Phone Number"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit}>
                <X className="h-3.5 w-3.5 mr-1" /> Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSaving}>
                <Save className="h-3.5 w-3.5 mr-1" />
                {isSaving ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* ── Change Password ── */}
      <Card>
        <form onSubmit={handleChangePw} className="p-5 space-y-4">
          <div className="border-b border-border/60 pb-4 mb-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Lock className="h-4 w-4 text-primary" />
              Change Password
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Keep your account secure by updating your password regularly.
            </p>
          </div>

          {/* Error banner */}
          {pwError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600">
              {pwError}
            </div>
          )}

          {/* Current password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Current Password</label>
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

          <div className="grid gap-3 sm:grid-cols-2">
            {/* New password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">New Password</label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
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
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Confirm Password</label>
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
              {confirmPassword && newPassword === confirmPassword && confirmPassword.length > 0 && (
                <p className="flex items-center gap-1 text-[11px] text-emerald-600">
                  <Check className="h-3 w-3" /> Passwords match
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              size="sm"
              disabled={!isPasswordValid || isChangingPw}
              className="gap-1.5"
            >
              <Lock className="h-3.5 w-3.5" />
              {isChangingPw ? "Updating…" : "Update Password"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
