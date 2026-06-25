import { Input } from "@/components/ui/input";
import {
    Field,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";

type FormTextFieldProps = {
    form: any;
    name: string;
    label: string;
    placeholder?: string;
    type?: "text" | "number" | "email" | "password";
    autoComplete?: string;
    disabled?: boolean;
};

const FormTextField = ({
    form,
    name,
    label,
    placeholder = "",
    type = "text",
    autoComplete = "off",
    disabled = false,
}: FormTextFieldProps) => {
    return (
        <form.Field
            name={name}
            children={(field: any) => {
                const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                    <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>

                        <Input
                            id={field.name}
                            name={field.name}
                            type={type}
                            value={field.state.value ?? ""}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder={placeholder}
                            autoComplete={autoComplete}
                            disabled={disabled}
                        />

                        {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                        )}
                    </Field>
                );
            }}
        />
    );
};

export default FormTextField;