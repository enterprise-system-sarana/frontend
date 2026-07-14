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
import { GroupShema } from "@/types/users/Group";
import type { GroupPermission, GroupPermissionRequest } from "@/types/users/Group";
import { useGroupPermission } from "@/hooks/users/useGroupPermision";
import FormTextField from "@/components/ui/FormTextField";

type FormGroupPermissionProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    group: GroupPermission | null;
};

const FormGroupPermission = ({ open, setOpen, group }: FormGroupPermissionProps) => {
    const { mutate: createGroupMutate, isPending: isCreating } = useGroupPermission.useCreate();
    const { mutate: updateGroupMutate, isPending: isUpdating } = useGroupPermission.useUpdate();

    const isPending = isCreating || isUpdating;
    const form = useForm({
        defaultValues: {
            code: group?.code || "",
            name: group?.name || "",
            description: group?.description || "",
        } as GroupPermissionRequest,
        validators: {
            onSubmit: GroupShema,
        },
        onSubmit: async ({ value }) => {
            const payload = value as GroupPermissionRequest;
            const handleSuccess = () => {
                setOpen(false);
                form.reset();
            };

            if (group) {
                updateGroupMutate(
                    { id: group.id, request: payload },
                    { onSuccess: handleSuccess },
                );
            } else {
                createGroupMutate(payload, { onSuccess: handleSuccess });
            }
        },
    });

    useEffect(() => {
        form.reset();
    }, [group, open]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="min-w-[400px]">
                <DialogHeader>
                    <DialogTitle>{group ? "Edit" : "Create"} Permission Group</DialogTitle>
                </DialogHeader>
                <form
                    id="group-permission-form"
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
                            placeholder="Enter permission group code"
                            type="text"
                            autoComplete="off"
                        />
                        <FormTextField
                            form={form}
                            name="name"
                            label="Name"
                            placeholder="Enter permission group name"
                            type="text"
                            autoComplete="off"
                        />
                        <FormTextField
                            form={form}
                            name="description"
                            label="Description"
                            placeholder="Enter description"
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
                        form="group-permission-form"
                        disabled={isPending}
                    >
                        {group ? "Save changes" : "Create"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FormGroupPermission;
