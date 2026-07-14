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
    type?: "text" | "number" | "email" | "password" | "date";
    autoComplete?: string;
    disabled?: boolean;
    required?: boolean;
};

const FormTextField = ({
    form,
    name,
    label,
    placeholder = "",
    type = "text",
    autoComplete,
    disabled = false,
    required = false,
}: FormTextFieldProps) => {
    return (
        <form.Field
            name={name}
            children={(field: any) => {
                const isInvalid =
                    (field.state.meta.isTouched || form.state.submissionAttempts > 0) && !field.state.meta.isValid;

                return (
                    <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                            {label}
                            {required && <span className="text-destructive"> *</span>}
                        </FieldLabel>

                        <Input
                            id={field.name}
                            name={field.name}
                            type={type}
                            value={field.state.value ?? ""}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder={placeholder}
                            disabled={disabled}
                            required={required}
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