import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useEffect } from "react";
import { UserSchema } from "@/types/users/Users";
import type { UserResponse, UserRequest } from "@/types/users/Users";
import { Status } from "@/types/enum/status";
import { useCreateUser, useUpdateUser } from "@/hooks/users/useUser";
import FormTextField, { FormRadioGroupField, FormSelectField } from "@/components/ui/FormTextField";
import { useStore } from "@/hooks/inventory/useStore";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { useRole } from "@/hooks/users/useRole";
import type { StoreResponse } from "@/types/inventory/Store";
import type { RoleResponse } from "@/types/users/Role";

type FormUserProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    user: UserResponse | null;
};

const FormUser = ({ open, setOpen, user }: FormUserProps) => {
    const { t } = useLanguage();
    const { mutate: createUserMutate, isPending: isCreating } = useCreateUser();
    const { mutate: updateUserMutate, isPending: isUpdating } = useUpdateUser();

    const { data: storeData } = useStore.useGetAllStore({ page: 1, size: 100 });
    const { data: rolesData } = useRole.GetAllRole({ page: 1, size: 100 });

    const storeOptions = (storeData?.payload?.data || []).map((s: StoreResponse) => ({
        label: s.name,
        value: String(s.id),
    }));

    const roleList = rolesData?.payload?.data || rolesData?.payload || [];
    const roleOptions = (Array.isArray(roleList) ? roleList : []).map((r: RoleResponse) => ({
        label: r.name || r.code,
        value: r.code,
    }));

    const isPending = isCreating || isUpdating;

    const form = useForm({
        defaultValues: {
            username: user?.username || "",
            email: user?.email || "",
            password: "",
            isActive: user?.isActive || Status.ACTIVE,
            storeId: user?.storeId || null,
            roleCodes: user?.roles || [],
        } as UserRequest,
        validators: {
            onSubmit: UserSchema,
        },
        onSubmit: async ({ value }) => {
            const payload = {
                ...value,
                storeId: value.storeId ? Number(value.storeId) : null,
                password: value.password ? value.password : undefined,
            } as UserRequest;

            const handleSuccess = () => {
                setOpen(false);
                form.reset();
            };

            if (user) {
                updateUserMutate(
                    { id: user.id, request: payload },
                    {
                        onSuccess: () => {
                            toast.success("User updated successfully");
                            handleSuccess();
                        },
                        onError: (err: any) => {
                            toast.error(err?.message || "Failed to update user");
                        },
                    }
                );
            } else {
                createUserMutate(payload, {
                    onSuccess: () => {
                        toast.success("User created successfully");
                        handleSuccess();
                    },
                    onError: (err: any) => {
                        toast.error(err?.message || "Failed to create user");
                    },
                });
            }
        },
    });

    useEffect(() => {
        if (user) {
            form.setFieldValue("username", user.username || "");
            form.setFieldValue("email", user.email || "");
            form.setFieldValue("password", "");
            form.setFieldValue("isActive", user.isActive || Status.ACTIVE);
            form.setFieldValue("storeId", user.storeId || null);
            form.setFieldValue("roleCodes", user.roles || []);
        } else {
            form.reset();
        }
    }, [user, open]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="md:max-w-/[480px]">
                <DialogHeader>
                    <DialogTitle>{user ? t("common.edit") : t("common.add")} User</DialogTitle>
                </DialogHeader>
                <form
                    id="user-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                >
                    <FieldGroup>
                        <FormTextField
                            form={form}
                            name="username"
                            label="Username"
                            placeholder="Enter username"
                            type="text"
                            required={true}
                            autoComplete="off"
                        />
                        <FormTextField
                            form={form}
                            name="email"
                            label="Email"
                            placeholder="Enter email"
                            type="email"
                            required={true}
                            autoComplete="off"
                        />
                        <FormTextField
                            form={form}
                            name="password"
                            label="Password"
                            placeholder={user ? "Leave blank to keep current" : "Enter password"}
                            type="password"
                            required={!user}
                            autoComplete="new-password"
                        />

                        {storeOptions.length > 0 && (
                            <FormSelectField
                                form={form}
                                name="storeId"
                                label="Store / Branch"
                                placeholder="Select a Store"
                                options={storeOptions}
                            />
                        )}

                        {roleOptions.length > 0 && (
                            <form.Subscribe selector={(state) => [state.values.roleCodes]}>
                                {([selectedRoles = []]) => (
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-foreground">
                                            Assign Roles <span className="text-destructive">*</span>
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {roleOptions.map((role: any) => {
                                                const isSelected = (selectedRoles as string[]).includes(role.value);
                                                return (
                                                    <button
                                                        key={role.value}
                                                        type="button"
                                                        onClick={() => {
                                                            const current = (selectedRoles as string[]) || [];
                                                            if (isSelected) {
                                                                form.setFieldValue(
                                                                    "roleCodes",
                                                                    current.filter((r) => r !== role.value)
                                                                );
                                                            } else {
                                                                form.setFieldValue("roleCodes", [...current, role.value]);
                                                            }
                                                        }}
                                                        className={`inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer border ${isSelected
                                                            ? "border-primary bg-primary text-primary-foreground font-semibold shadow-xs ring-2 ring-primary/20"
                                                            : "border-border/70 bg-card hover:bg-muted/70 text-foreground/90"
                                                            }`}
                                                    >
                                                        {role.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </form.Subscribe>
                        )}

                        <FormRadioGroupField
                            form={form}
                            name="isActive"
                            label={t("common.status")}
                            required={true}
                            options={[
                                { value: Status.ACTIVE, label: t("common.active") },
                                { value: Status.INACTIVE, label: t("common.inactive") },
                            ]}
                        />
                    </FieldGroup>
                </form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">{t("common.cancel")}</Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        form="user-form"
                        disabled={isPending}
                    >
                        {isPending ? t("common.saving") : user ? t("common.save") : t("common.add")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FormUser;
