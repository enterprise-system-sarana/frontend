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
import { RoleSchema } from "@/types/users/Role";
import type { RoleResponse, RoleRequest } from "@/types/users/Role";
import { useCreateRole, useUpdateRole } from "@/hooks/users/useRole";
import FormTextField, { FormTextareaField } from "@/components/ui/FormTextField";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

type FormRoleProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    role: RoleResponse | null;
};

const FormRole = ({ open, setOpen, role }: FormRoleProps) => {
    const { t } = useLanguage();
    const { mutate: createRoleMutate, isPending: isCreating } = useCreateRole();
    const { mutate: updateRoleMutate, isPending: isUpdating } = useUpdateRole();

    const isPending = isCreating || isUpdating;
    const form = useForm({
        defaultValues: {
            code: role?.code || "",
            name: role?.name || "",
            description: role?.description || "",
        } as RoleRequest,
        validators: {
            onSubmit: RoleSchema,
        },
        onSubmit: async ({ value }) => {
            const payload = value as RoleRequest;
            const handleSuccess = () => {
                setOpen(false);
                form.reset();
            };

            if (role) {
                updateRoleMutate(
                    { id: role.id, request: payload },
                    {
                        onSuccess: () => {
                            toast.success("Role updated successfully");
                            handleSuccess();
                        },
                        onError: (err: any) => {
                            toast.error(err?.message || "Failed to update role");
                        },
                    }
                );
            } else {
                createRoleMutate(payload, {
                    onSuccess: () => {
                        toast.success("Role created successfully");
                        handleSuccess();
                    },
                    onError: (err: any) => {
                        toast.error(err?.message || "Failed to create role");
                    },
                });
            }
        },
    });

    useEffect(() => {
        if (role) {
            form.setFieldValue("code", role.code || "");
            form.setFieldValue("name", role.name || "");
            form.setFieldValue("description", role.description || "");
        } else {
            form.reset();
        }
    }, [role, open]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="md:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>{role ? t("common.edit") : t("common.add")} {t("nav.role")}</DialogTitle>
                </DialogHeader>
                <form
                    id="role-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                >
                    <FieldGroup>
                        <FormTextField
                            form={form}
                            name="code"
                            label={t("common.code")}
                            placeholder="e.g. ROLE_ADMIN"
                            type="text"
                            required={true}
                            autoComplete="off"
                        />
                        <FormTextField
                            form={form}
                            name="name"
                            label={t("common.name")}
                            placeholder="e.g. Admin"
                            type="text"
                            required={true}
                            autoComplete="off"
                        />
                        <FormTextareaField
                            form={form}
                            name="description"
                            label={t("common.description")}
                            placeholder="Role description..."
                        />
                    </FieldGroup>
                </form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">{t("common.cancel")}</Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        form="role-form"
                        disabled={isPending}
                    >
                        {isPending ? t("common.saving") : role ? t("common.save") : t("common.add")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FormRole;
