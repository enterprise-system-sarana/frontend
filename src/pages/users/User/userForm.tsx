import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import FormTextField, {
    FormRadioGroupField,
    FormSelectField,
} from "@/components/ui/FormTextField";

import { useCreateUser, useUpdateUser } from "@/hooks/users/useUser";
import { useRole } from "@/hooks/users/useRole";
import { useStore } from "@/hooks/inventory/useStore";
import { useLanguage } from "@/i18n/LanguageContext";

import { UserSchema } from "@/types/users/Users";
import type {
    UserResponse,
    UserRequest,
} from "@/types/users/Users";

import { Status } from "@/types/enum/status";
import type { StoreResponse } from "@/types/inventory/Store";
import type { RoleResponse } from "@/types/users/Role";

type FormUserProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    user: UserResponse | null;
};

const FormUser = ({
    open,
    setOpen,
    user,
}: FormUserProps) => {
    const { t } = useLanguage();

    const {
        mutate: createUserMutate,
        isPending: isCreating,
    } = useCreateUser();

    const {
        mutate: updateUserMutate,
        isPending: isUpdating,
    } = useUpdateUser();

    const {
        data: storeData,
        isLoading: isLoadingStores,
    } = useStore.useGetAllStore({
        page: 1,
        size: 100,
    });

    const {
        data: rolesData,
        isLoading: isLoadingRoles,
    } = useRole.GetAllRole({
        page: 1,
        size: 100,
    });

    const isEdit = Boolean(user);
    const isPending = isCreating || isUpdating;

    const stores: StoreResponse[] =
        storeData?.payload?.data ?? [];

    const roles: RoleResponse[] = Array.isArray(
        rolesData?.payload?.data
    )
        ? rolesData.payload.data
        : Array.isArray(rolesData?.payload)
            ? rolesData.payload
            : [];

    const storeOptions = stores.map((store) => ({
        label: store.name,
        value: String(store.id),
    }));

    const roleOptions = roles.map((role) => ({
        label: role.name || role.code,
        value: role.code,
    }));

    const form = useForm({
        defaultValues: {
            firstName: "",
            lastName: "",
            phone: "",
            email: "",
            password: "",
            profileImage: "",
            isActive: Status.ACTIVE,
            storeId: null,
            roleCodes: [],
        } as UserRequest,

        validators: {
            onSubmit: UserSchema,
        },

        onSubmit: async ({ value }) => {
            const payload: UserRequest = {
                ...value,
                storeId: value.storeId
                    ? Number(value.storeId)
                    : null,

                // Don't send empty password when editing
                password:
                    value.password?.trim()
                        ? value.password
                        : undefined,
            };

            const handleSuccess = () => {
                setOpen(false);
                form.reset();
            };

            if (user) {
                updateUserMutate(
                    {
                        id: user.id,
                        request: payload,
                    },
                    {
                        onSuccess: () => {
                            toast.success(
                                "User updated successfully"
                            );
                            handleSuccess();
                        },
                        onError: (error: any) => {
                            toast.error(
                                error?.message ||
                                "Failed to update user"
                            );
                        },
                    }
                );

                return;
            }

            createUserMutate(payload, {
                onSuccess: () => {
                    toast.success(
                        "User created successfully"
                    );
                    handleSuccess();
                },
                onError: (error: any) => {
                    toast.error(
                        error?.message ||
                        "Failed to create user"
                    );
                },
            });
        },
    });

    /**
     * Populate form when editing.
     */
    useEffect(() => {
        if (!open) return;

        if (user) {
            form.setFieldValue(
                "firstName",
                user.firstName ?? ""
            );

            form.setFieldValue(
                "lastName",
                user.lastName ?? ""
            );

            form.setFieldValue(
                "phone",
                user.phone ?? ""
            );

            form.setFieldValue(
                "email",
                user.email ?? ""
            );

            form.setFieldValue(
                "password",
                ""
            );

            form.setFieldValue(
                "profileImage",
                user.profileImage ?? ""
            );

            form.setFieldValue(
                "isActive",
                user.isActive ?? Status.ACTIVE
            );

            form.setFieldValue(
                "storeId",
                user.storeId ?? null
            );

            form.setFieldValue(
                "roleCodes",
                user.roles ?? []
            );
        } else {
            form.reset();
        }
    }, [user, open]);

    const handleClose = () => {
        if (isPending) return;

        setOpen(false);
        form.reset();
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                if (!value) {
                    handleClose();
                } else {
                    setOpen(value);
                }
            }}
        >
            <DialogContent className="w-full max-w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg">
                        {isEdit
                            ? "Edit User"
                            : "Create User"}
                    </DialogTitle>

                </DialogHeader>

                <form
                    id="user-form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        event.stopPropagation();

                        form.handleSubmit();
                    }}
                    className="space-y-6"
                >
                    {/* =========================
                        PERSONAL INFORMATION
                    ========================== */}

                    <section className="space-y-4">


                        <FieldGroup>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormTextField
                                    form={form}
                                    name="firstName"
                                    label="First Name"
                                    placeholder=""
                                    type="text"
                                    required
                                    autoComplete="given-name"
                                />

                                <FormTextField
                                    form={form}
                                    name="lastName"
                                    label="Last Name"
                                    placeholder=""
                                    type="text"
                                    required
                                    autoComplete="family-name"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormTextField
                                    form={form}
                                    name="phone"
                                    label="Phone"
                                    placeholder=""
                                    type="tel"
                                    required
                                    autoComplete="tel"
                                />

                                <FormTextField
                                    form={form}
                                    name="email"
                                    label="Email"
                                    placeholder=""
                                    type="email"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </FieldGroup>
                    </section>

                    <section className="space-y-4">
                        <FormTextField
                            form={form}
                            name="password"
                            label={
                                isEdit
                                    ? "New Password"
                                    : "Password"
                            }
                            placeholder={
                                isEdit
                                    ? "Leave blank to keep current password"
                                    : "Enter password"
                            }
                            type="password"
                            required={!isEdit}
                            autoComplete={
                                isEdit
                                    ? "new-password"
                                    : "new-password"
                            }
                        />
                    </section>

                    {/* =========================
                        ACCESS CONTROL
                    ========================== */}

                    <section className="space-y-4">


                        {isLoadingRoles ? (
                            <div className="text-sm text-muted-foreground">
                                Loading roles...
                            </div>
                        ) : roleOptions.length > 0 ? (
                            <form.Subscribe
                                selector={(state) => [
                                    state.values.roleCodes,
                                ]}
                            >
                                {([selectedRoles = []]) => {
                                    const selected =
                                        selectedRoles as string[];

                                    return (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-semibold">
                                                    Roles{" "}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </label>

                                                <span className="text-xs text-muted-foreground">
                                                    {selected.length} selected
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {roleOptions.map(
                                                    (role) => {
                                                        const isSelected =
                                                            selected.includes(
                                                                role.value
                                                            );

                                                        return (
                                                            <button
                                                                key={
                                                                    role.value
                                                                }
                                                                type="button"
                                                                disabled={
                                                                    isPending
                                                                }
                                                                onClick={() => {
                                                                    if (
                                                                        isSelected
                                                                    ) {
                                                                        form.setFieldValue(
                                                                            "roleCodes",
                                                                            selected.filter(
                                                                                (
                                                                                    item
                                                                                ) =>
                                                                                    item !==
                                                                                    role.value
                                                                            )
                                                                        );
                                                                    } else {
                                                                        form.setFieldValue(
                                                                            "roleCodes",
                                                                            [
                                                                                ...selected,
                                                                                role.value,
                                                                            ]
                                                                        );
                                                                    }
                                                                }}
                                                                className={[
                                                                    "px-3 py-1.5",
                                                                    "text-xs font-medium",
                                                                    "border transition-colors",
                                                                    "cursor-pointer",
                                                                    "disabled:cursor-not-allowed disabled:opacity-50",
                                                                    isSelected
                                                                        ? "border-primary bg-primary text-primary-foreground"
                                                                        : "border-border bg-background hover:bg-muted",
                                                                ].join(
                                                                    " "
                                                                )}
                                                            >
                                                                {role.label}
                                                            </button>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        </div>
                                    );
                                }}
                            </form.Subscribe>
                        ) : (
                            <div className="border border-dashed p-4 text-sm text-muted-foreground">
                                No roles available.
                            </div>
                        )}
                    </section>



                    <section className="space-y-4">
                        {!isLoadingStores &&
                            storeOptions.length > 0 && (
                                <FormSelectField
                                    form={form}
                                    name="storeId"
                                    label="Store / Branch"
                                    placeholder="Select a store"
                                    options={storeOptions}
                                />
                            )}

                        {/* <FormRadioGroupField
                            form={form}
                            name="isActive"
                            label={t("common.status")}
                            required
                            options={[
                                {
                                    value: Status.ACTIVE,
                                    label: t("common.active"),
                                },
                                {
                                    value: Status.INACTIVE,
                                    label: t("common.inactive"),
                                },
                            ]}
                        /> */}
                    </section>
                </form>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isPending}
                        >
                            {t("common.cancel")}
                        </Button>
                    </DialogClose>

                    <Button
                        type="submit"
                        form="user-form"
                        disabled={isPending}
                    >
                        {isPending
                            ? t("common.saving")
                            : isEdit
                                ? t("common.save")
                                : t("common.add")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FormUser;
