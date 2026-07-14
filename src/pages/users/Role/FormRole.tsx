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
import FormTextField from "@/components/ui/FormTextField";

type FormRoleProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    role: RoleResponse | null;
};

const FormRole = ({ open, setOpen, role }: FormRoleProps) => {
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
                    { onSuccess: handleSuccess },
                );
            } else {
                createRoleMutate(payload, { onSuccess: handleSuccess });
            }
        },
    });

    useEffect(() => {
        form.reset();
    }, [role, open]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="min-w-[400px]">
                <DialogHeader>
                    <DialogTitle>{role ? "Edit" : "Create"} Role</DialogTitle>
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
                            label="Code"
                            placeholder="Enter role code"
                            type="text"
                            autoComplete="off"
                        />
                        <FormTextField
                            form={form}
                            name="name"
                            label="Name"
                            placeholder="Enter role name"
                            type="text"
                            autoComplete="off"
                        />
                        <FormTextField
                            form={form}
                            name="description"
                            label="Description"
                            placeholder="Enter role description"
                            type="text"
                            autoComplete="off"
                        />
                    </FieldGroup>
                </form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        form="role-form"
                        disabled={isPending}
                    >
                        {isPending ? "Saving..." : (role ? "Update" : "Create")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FormRole;
