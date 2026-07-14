import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import FormTextField, { FormSelectField } from "@/components/ui/FormTextField";
import { useUnit } from "@/hooks/product/useUnit";
import { Status } from "@/types/enum/status";
import { Operation, UnitSchema, type UnitResponse, type UnitFormValues } from "@/types/product/Unit";
import { useForm } from "@tanstack/react-form";

type unitFormProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
    unit: UnitResponse | null;
}
export const UnitForm = ({ open, setOpen, unit }: unitFormProps) => {
    const { mutate: createUnit } = useUnit.useUnitCreate()
    const { mutate: updateUnit } = useUnit.useUnitUpdate()

    const form = useForm({
        defaultValues: {
            name: unit?.name || "",
            code: unit?.code || "",
            baseUnit: unit?.baseUnit ?? undefined,
            operation: (unit?.operation || Operation.Multiply) as Operation,
            operationValue: unit?.operationValue ?? undefined,
            status: unit?.status || Status.Active,
        } as UnitFormValues,
        validators: {
            onSubmit: UnitSchema
        },
        onSubmit: async ({ value }) => {
            const handleSuccess = () => {
                setOpen(false);
                form.reset();
            };

            const payload = UnitSchema.parse(value);

            if (unit) {
                updateUnit({ id: unit.id, request: payload },
                    { onSuccess: handleSuccess })
            } else {
                createUnit(payload,
                    { onSuccess: handleSuccess })
            }
        }
    })



    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px]">

                <DialogHeader>
                    <DialogTitle>{unit ? "Edit" : "Create"} Unit</DialogTitle>
                </DialogHeader>

                <form
                    id="unit-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}>

                    <FieldGroup>

                        <div className="flex gap-4 ">
                            <FormTextField
                                form={form}
                                name="name"
                                label="Name"
                                placeholder="Enter Name"
                                type="text"
                                required={true}

                            />

                            <FormTextField
                                form={form}
                                name="code"
                                label="Code"
                                placeholder="Enter Code"
                                type="text"
                                required={true}

                            />
                        </div>

                        <div className="flex gap-4">

                            <FormTextField
                                form={form}
                                name="baseUnit"
                                label="Base Unit"
                                placeholder="Enter Base Unit"
                                type="number"
                                required={true}

                            />



                            <FormSelectField
                                form={form}
                                name="operation"
                                label="Operation"
                                placeholder="Select Operation"
                                options={Object.entries(Operation).map(([key, value]) => ({
                                    value: value,
                                    label: key,
                                })) || []}
                                required={true}

                            />
                        </div>

                        <div className="flex gap-4">
                            <FormTextField
                                form={form}
                                name="operationValue"
                                label="Operation Value"
                                placeholder="Enter Operation Value"
                                type="number"
                                required={true}

                            />


                            <FormSelectField
                                form={form}
                                name="status"
                                label="Status"
                                placeholder="Select Status"
                                options={Object.entries(Status).map(([key, value]) => ({
                                    value: value,
                                    label: key,
                                })) || []}
                                required={true}

                            />
                        </div>

                        {/* 
                        <FormTextField
                            form={form}
                            name="status"
                            label="Status"
                            placeholder="Enter Status"
                            type="text"
                        /> */}
                    </FieldGroup>
                </form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        form="unit-form"
                    >
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}