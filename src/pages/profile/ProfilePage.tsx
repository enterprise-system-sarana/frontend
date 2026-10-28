import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/store/useAuth";
import { useAppDispatch } from "@/store/store";
import { updateUser } from "@/store/authSlice";
import { useUser } from "@/hooks/users/useUser";
import { useStore } from "@/hooks/inventory/useStore";
import { userService } from "@/services/users/user.service";
import { AuthService } from "@/services/auth/auth.service";
import { fileService } from "@/services/file/file.service";
import { useLanguage } from "@/i18n/LanguageContext";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { FileUpload } from "@/components/ui/FileUpload";
import { toast } from "sonner";
import {
  UserRound,
  Store,
  LockKeyhole,
  Eye,
  EyeOff,
  Save,
  X,
} from "lucide-react";

type ProfileTab = "profile" | "security";

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const { data: usersData, refetch: refetchUsers } = useUser({
    page: 1,
    size: 100,
  });

  const detailedUser = useMemo(() => {
    const users = usersData?.payload?.data ?? [];
    return users.find(
      (item: any) =>
        item.id === user?.userId ||
        item.username === user?.username
    );
  }, [usersData, user]);

  const { data: storesData } = useStore.useGetAllStore({
    page: 0,
    size: 1000,
  });

  const stores = storesData?.payload?.data ?? storesData?.data ?? [];

  const assignedStore = useMemo(() => {
    const storeId = user?.storeId ?? detailedUser?.storeId;
    return stores.find((store: any) => Number(store.id) === Number(storeId));
  }, [stores, user?.storeId, detailedUser?.storeId]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    profileImage: "",
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    const source = detailedUser ?? user;
    if (!source) return;

    setForm({
      firstName: source.firstName ?? "",
      lastName: source.lastName ?? "",
      username: source.username ?? "",
      email: source.email ?? "",
      phone: source.phone ?? "",
      profileImage: source.profileImage ?? "",
    });
  }, [detailedUser, user]);

  const setField = (field: keyof typeof form, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleCancel = () => {
    const source = detailedUser ?? user;
    if (source) {
      setForm({
        firstName: source.firstName ?? "",
        lastName: source.lastName ?? "",
        username: source.username ?? "",
        email: source.email ?? "",
        phone: source.phone ?? "",
        profileImage: source.profileImage ?? "",
      });
    }
    setIsEditing(false);
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.username.trim()) {
      toast.error("Username is required");
      return;
    }

    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    const targetUserId = detailedUser?.id ?? user?.userId;
    if (!targetUserId) {
      toast.error("Unable to identify your account");
      return;
    }

    setIsSaving(true);

    try {
      const roles =
        detailedUser?.roleCodes ??
        detailedUser?.roles ??
        (user as any)?.roleCodes ??
        user?.roles ??
        [];

      const roleCodes = (Array.isArray(roles) ? roles : [roles])
        .map((role: any) =>
          typeof role === "string" ? role : role.code ?? role.name
        )
        .filter(Boolean);

      await userService.update(targetUserId, {
        firstName: form.firstName.trim() || null,
        lastName: form.lastName.trim() || null,
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        profileImage: form.profileImage.trim() || null,
        isActive: detailedUser?.isActive ?? (user as any)?.isActive ?? "ACTIVE",
        storeId: detailedUser?.storeId ?? user?.storeId ?? null,
        roleCodes,
      } as any);

      dispatch(
        updateUser({
          username: form.username.trim(),
          email: form.email.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
          profileImage: form.profileImage.trim(),
        })
      );

      await refetchUsers();
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ??
        error?.message ??
        "Failed to update profile"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must contain at least 8 characters");
      return;
    }

    if (newPassword === currentPassword) {
      toast.error("New password must differ from current password");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsChangingPassword(true);

    try {
      await AuthService.changePassword({
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ??
        error?.message ??
        "Failed to change password"
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const rawRoles =
    detailedUser?.roleCodes ??
    detailedUser?.roles ??
    (user as any)?.roleCodes ??
    user?.roles ??
    [];

  const roles = (Array.isArray(rawRoles) ? rawRoles : [rawRoles])
    .map((role: any) =>
      typeof role === "string" ? role : role.code ?? role.name
    )
    .filter(Boolean);

  const fullName =
    [form.firstName, form.lastName].filter(Boolean).join(" ") ||
    form.username ||
    "User";

  const currentProfileImage = form.profileImage
    ? form.profileImage.startsWith("http") ||
      form.profileImage.startsWith("blob:")
      ? form.profileImage
      : fileService.getPreviewUrl("user", form.profileImage)
    : "/default-user-avatar.png";

  const storeId = user?.storeId ?? detailedUser?.storeId;
  const accountStatus = detailedUser?.isActive ?? "ACTIVE";

  const tabs = [
    { id: "profile" as const, label: "Personal Information", icon: UserRound },
    { id: "security" as const, label: "Security & Password", icon: LockKeyhole },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title={t("profile.settings", "My Profile")}
        // description="Manage your personal information and account security."
      />

      {/* Account summary header */}
      <Card className="rounded-none shadow-none">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <Avatar className="size-16 rounded-full">
            <AvatarImage
              src={currentProfileImage}
              alt={fullName}
              className="object-cover"
            />
            <AvatarFallback>
              {fullName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold">{fullName}</h2>
            <p className="text-sm text-muted-foreground">
              @{form.username || "username"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={accountStatus} />
              {roles.map((role: string) => (
                <span
                  key={role}
                  className="border px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {role.replace("ROLE_", "")}
                </span>
              ))}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Store className="size-4" />
              <span>
                {storeId
                  ? assignedStore?.name ?? `Store #${storeId}`
                  : "All Stores / HQ"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation tabs */}
      <div className="flex border-b">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm transition-colors ${
              activeTab === id
                ? "border-primary font-semibold text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Personal information tab */}
      {activeTab === "profile" && (
        <Card className="rounded-none shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
            <CardDescription>
              Update your personal details and contact information.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {isEditing && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Profile Photo</label>
                  <FileUpload
                    bucketName="user"
                    value={form.profileImage}
                    onUploaded={(value) => setField("profileImage", value)}
                    onRemove={() => setField("profileImage", "")}
                    label="Upload profile photo"
                  />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <Input
                    value={form.firstName}
                    disabled={!isEditing}
                    onChange={(e) => setField("firstName", e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input
                    value={form.lastName}
                    disabled={!isEditing}
                    onChange={(e) => setField("lastName", e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    value={form.username}
                    disabled={!isEditing}
                    onChange={(e) => setField("username", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    value={form.email}
                    disabled={!isEditing}
                    onChange={(e) => setField("email", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    value={form.phone}
                    disabled={!isEditing}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="mr-2 size-4" />
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      <Save className="mr-2 size-4" />
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </>
                ) : (
                  <Button type="button" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Security & Password tab */}
      {activeTab === "security" && (
        <Card className="rounded-none shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Change Password</CardTitle>
            <CardDescription>
              Use a strong password to keep your account secure.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {[
                {
                  label: "Current Password",
                  value: currentPassword,
                  setter: setCurrentPassword,
                },
                {
                  label: "New Password",
                  value: newPassword,
                  setter: setNewPassword,
                },
                {
                  label: "Confirm New Password",
                  value: confirmPassword,
                  setter: setConfirmPassword,
                },
              ].map(({ label, value, setter }) => (
                <div key={label} className="max-w-lg space-y-2">
                  <label className="text-sm font-medium">{label}</label>
                  <div className="relative">
                    <Input
                      type={showPasswords ? "text" : "password"}
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      className="pr-10"
                      required
                      minLength={label === "New Password" ? 8 : undefined}
                      autoComplete={
                        label === "Current Password"
                          ? "current-password"
                          : "new-password"
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((previous) => !previous)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showPasswords ? "Hide passwords" : "Show passwords"
                      }
                    >
                      {showPasswords ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4">
                <Button
                  type="submit"
                  disabled={
                    isChangingPassword ||
                    !currentPassword ||
                    newPassword.length < 8 ||
                    newPassword !== confirmPassword
                  }
                >
                  <LockKeyhole className="mr-2 size-4" />
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
