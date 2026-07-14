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
import FormTextField, { FormSelectField } from "@/components/ui/FormTextField";

type FormUserProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    user: UserResponse | null;
};

const FormUser = ({ open, setOpen, user }: FormUserProps) => {
    const { mutate: createUserMutate, isPending: isCreating } = useCreateUser();
    const { mutate: updateUserMutate, isPending: isUpdating } = useUpdateUser();

    const isPending = isCreating || isUpdating;
    const form = useForm({
        defaultValues: {
            username: user?.username || "",
            email: user?.email || "",
            password: "",
            isActive: user?.isActive || Status.Active,
            storeId: user?.storeId || null,
            roleCodes: user?.roles || [],
        } as UserRequest,
        validators: {
            onSubmit: UserSchema,
        },
        onSubmit: async ({ value }) => {
            const payload = value as UserRequest;
            const handleSuccess = () => {
                setOpen(false);
                form.reset();
            };

            if (user) {
                updateUserMutate(
                    { id: user.id, request: payload },
                    { onSuccess: handleSuccess },
                );
            } else {
                createUserMutate(payload, { onSuccess: handleSuccess });
            }
        },
    });

    useEffect(() => {
        form.reset();
    }, [user, open]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{user ? "Edit" : "Create"} User</DialogTitle>
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
                            autoComplete="off"
                        />
                        <FormTextField
                            form={form}
                            name="email"
                            label="Email"
                            placeholder="Enter email"
                            type="email"
                            autoComplete="off"
                        />
                        <FormTextField
                            form={form}
                            name="password"
                            label="Password"
                            placeholder={user ? "Leave blank to keep current" : "Enter password"}
                            type="password"
                            autoComplete="new-password"
                        />
                        <FormSelectField
                            form={form}
                            name="status"
                            label="Status"
                            required={true}
                            placeholder="Select Status"
                            options={Object.entries(Status).map(([, value]) => ({
                                value: value,
                                label: value,
                            })) || []}
                        />
                    </FieldGroup>
                </form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        form="user-form"
                        disabled={isPending}
                    >
                        {isPending ? "Saving..." : (user ? "Update" : "Create")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FormUser;
