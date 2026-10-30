import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { useRef, useMemo, useEffect } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
type FormTextFieldProps = {
  form: any;
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number" | "email" | "password" | "date";
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  step?: string | number;
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
  className,
  step = "any",
}: FormTextFieldProps) => {
  return (
    <form.Field
      name={name}
      children={(field: any) => {
        const isInvalid =
          (field.state.meta.isTouched || form.state.submissionAttempts > 0) &&
          !field.state.meta.isValid;

        return (
          <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>
              {label}
              {required && <span className="text-destructive"> *</span>}
            </FieldLabel>

            {type === "date" ? (
              <DatePicker
                id={field.name}
                value={field.state.value ?? ""}
                onBlur={field.handleBlur}
                onChange={(value) => field.handleChange(value)}
                aria-invalid={isInvalid}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                className={className}
              />
            ) : type === "number" ? (
              <Input
                id={field.name}
                name={field.name}
                type="number"
                step={step}
                autoComplete={autoComplete}
                value={field.state.value ?? ""}
                onBlur={field.handleBlur}
                onChange={(e) => {
                  const value = e.target.value;
                  field.handleChange(value === "" ? "" : Number(value));
                }}
                aria-invalid={isInvalid}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                className={className}
              />
            ) : (
              <Input
                id={field.name}
                name={field.name}
                type={type}
                autoComplete={autoComplete}
                value={field.state.value ?? ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                className={className}
              />
            )}

            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }}
    />
  );
};

type FormImageUploadProps = {
  form: any;
  name: string;
  label: string;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  required?: boolean;
};

const ImageUploadInner = ({
  field,
  label,
  name,
  accept,
  maxSize,
  disabled,
  inputRef,
  required,
  isSubmitted,
}: {
  field: any;
  label: string;
  name: string;
  accept: string;
  maxSize: number;
  disabled: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  required: boolean;
  isSubmitted: boolean;
}) => {
  const isInvalid =
    (field.state.meta.isTouched || isSubmitted) && !field.state.meta.isValid;

  const value = field.state.value;

  // Handle preview URL generation safely
  const previewSrc = useMemo(() => {
    if (value instanceof File) {
      return URL.createObjectURL(value);
    }
    return value || "";
  }, [value]);

  // Cleanup object URL when previewSrc changes to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewSrc && previewSrc.startsWith("blob:")) {
        URL.revokeObjectURL(previewSrc);
      }
    };
  }, [previewSrc]);

  const handleFile = (file?: File) => {
    if (!file) return;

    if (file.size > maxSize) {
      alert("Image size must be less than 5MB");
      return;
    }

    field.handleChange(file);
  };

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>

      {!value ? (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          className="flex h-20 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed hover:bg-muted"
        >
          <Upload className="mb-2 h-6 w-6" />

          <p className="text-sm text-muted-foreground">Click to upload</p>

          <input
            ref={inputRef}
            hidden
            type="file"
            accept={accept}
            disabled={disabled}
            required={required}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      ) : (
        <div className="relative inline-block">
          <img
            src={previewSrc}
            alt="Preview"
            className="h-40 w-40 rounded-md border object-cover"
          />

          <Button
            size="icon"
            variant="destructive"
            className="absolute right-2 top-2 h-7 w-7 rounded-md"
            onClick={() => field.handleChange("")}
            type="button"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
};

export const FormImageUpload = ({
  form,
  name,
  label,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024,
  disabled = false,
  required = false,
}: FormImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form.Field
      name={name}
      children={(field: any) => (
        <ImageUploadInner
          field={field}
          label={label}
          name={name}
          accept={accept}
          maxSize={maxSize}
          disabled={disabled}
          inputRef={inputRef}
          required={required}
          isSubmitted={form.state.submissionAttempts > 0}
        />
      )}
    />
  );
};

type Option = {
  label: string;
  value: string;
};

type FormSelectFieldProps = {
  form: any;
  name: string;
  label: string;
  placeholder?: string;
  options: Option[];
  disabled?: boolean;
  required?: boolean;
  className?: string;
  size?: "sm" | "default" | "lg";
  onAdd?: () => void;
  onValueChange?: (value: string) => void;
};

export const FormSelectField = ({
  form,
  name,
  label,
  placeholder = "Select an option",
  options = [],
  disabled = false,
  required = false,
  className,
  size = "default",
  onAdd,
  onValueChange,
}: FormSelectFieldProps) => {
  return (
    <form.Field
      name={name}
      children={(field: any) => {
        const isInvalid =
          (field.state.meta.isTouched || form.state.submissionAttempts > 0) &&
          !field.state.meta.isValid;

        return (
          <Field data-invalid={isInvalid} className="w-full min-w-0">
            <FieldLabel htmlFor={name} className="flex items-center gap-1.5">
              <span>
                {label}
                {required && <span className="text-destructive"> *</span>}
              </span>
              {onAdd && (
                <button
                  type="button"
                  onClick={onAdd}
                  className="inline-flex items-center justify-center size-4 rounded-[2px] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  title={`Add new ${label}`}
                >
                  <span className="text-[11px] font-bold leading-none">+</span>
                </button>
              )}
            </FieldLabel>

            <Select
              value={
                field.state.value !== undefined &&
                  field.state.value !== null &&
                  field.state.value !== 0 &&
                  field.state.value !== "0" &&
                  field.state.value !== ""
                  ? String(field.state.value)
                  : ""
              }
              onValueChange={(value) => {
                const nextValue = name.toLowerCase().endsWith("id")
                  ? Number(value)
                  : value;

                field.handleChange(nextValue);
                onValueChange?.(value);
              }}
              disabled={disabled}
              required={required}
            >
              <SelectTrigger
                id={name}
                size={size}
                aria-invalid={isInvalid}
                onBlur={field.handleBlur}
                className={cn("w-full min-w-0", className)}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>

              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }}
    />
  );
};

type FormTextareaFieldProps = {
  form: any;
  name: string;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
};

import { Textarea } from "@/components/ui/textarea";

export const FormTextareaField = ({
  form,
  name,
  label,
  placeholder = "",
  disabled = false,
  required = false,
}: FormTextareaFieldProps) => {
  return (
    <form.Field
      name={name}
      children={(field: any) => {
        const isInvalid =
          (field.state.meta.isTouched || form.state.submissionAttempts > 0) &&
          !field.state.meta.isValid;

        return (
          <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>
              {label}
              {required && <span className="text-destructive"> *</span>}
            </FieldLabel>

            <Textarea
              id={field.name}
              name={field.name}
              value={field.state.value ?? ""}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              aria-invalid={isInvalid}
              placeholder={placeholder}
              disabled={disabled}
              required={required}
            />

            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }}
    />
  );
};

type FormRadioGroupFieldProps = {
  form: any;
  name: string;
  label: string;
  options: { label: string; value: string }[];
  disabled?: boolean;
  required?: boolean;
};

export const FormRadioGroupField = ({
  form,
  name,
  label,
  options = [],
  disabled = false,
  required = false,
}: FormRadioGroupFieldProps) => {
  return (
    <form.Field
      name={name}
      children={(field: any) => {
        const isInvalid =
          (field.state.meta.isTouched || form.state.submissionAttempts > 0) &&
          !field.state.meta.isValid;

        return (
          <Field data-invalid={isInvalid}>
            <FieldLabel>
              {label}
              {required && <span className="text-destructive"> *</span>}
            </FieldLabel>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              {options.map((option) => {
                const isSelected = field.state.value === option.value;
                return (
                  <label
                    key={option.value}
                    className={`flex items-center gap-2 cursor-pointer select-none text-xs font-medium px-3.5 py-2 rounded-md border transition-all ${isSelected
                      ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                      : "border-border/60 bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <input
                      type="radio"
                      name={name}
                      value={option.value}
                      checked={isSelected}
                      disabled={disabled}
                      onChange={() => field.handleChange(option.value)}
                      onBlur={field.handleBlur}
                      className="h-4 w-4 accent-primary cursor-pointer"
                    />
                    <span>{option.label}</span>
                  </label>
                );
              })}
            </div>

            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }}
    />
  );
};

type FormSwitchFieldProps = {
  form: any;
  name: string;
  label: string;
  topLabel?: string;
  description?: string;
  activeDescription?: string;
  inactiveDescription?: string;
  activeLabel?: string;
  inactiveLabel?: string;
  disabled?: boolean;
  className?: string;
  alignWithInput?: boolean;
};

export const FormSwitchField = ({
  form,
  name,
  label,
  topLabel,
  description,
  activeDescription,
  inactiveDescription,
  activeLabel,
  inactiveLabel,
  disabled = false,
  className,
  alignWithInput = true,
}: FormSwitchFieldProps) => {
  return (
    <form.Field
      name={name}
      children={(field: any) => {
        const isChecked = field.state.value !== false;
        const currentDesc = isChecked
          ? (activeDescription ?? description)
          : (inactiveDescription ?? description);

        return (
          <Field className={cn(alignWithInput && "justify-end")}>
            {topLabel ? (
              <FieldLabel htmlFor={name}>{topLabel}</FieldLabel>
            ) : alignWithInput ? (
              <span className="hidden sm:block text-sm font-medium opacity-0 select-none pointer-events-none leading-snug">
                &nbsp;
              </span>
            ) : null}

            <div
              onClick={() => {
                if (!disabled) field.handleChange(!isChecked);
              }}
              className={cn(
                "flex h-11 w-full items-center justify-between rounded-md border border-border/70 bg-background px-3.5 py-2 transition-all hover:bg-muted/20 cursor-pointer select-none",
                disabled && "opacity-50 cursor-not-allowed",
                className
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {label}
                </span>
                {(activeLabel || inactiveLabel) && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold transition-colors",
                      isChecked
                        ? "bg-primary/15 text-primary border border-primary/25"
                        : "bg-muted text-muted-foreground border border-border"
                    )}
                  >
                    {isChecked ? activeLabel : inactiveLabel}
                  </span>
                )}
              </div>

              <div onClick={(e) => e.stopPropagation()}>
                <Switch
                  id={name}
                  checked={isChecked}
                  disabled={disabled}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                />
              </div>
            </div>

            {currentDesc && (
              <p className="text-xs text-muted-foreground">{currentDesc}</p>
            )}
          </Field>
        );
      }}
    />
  );
};

export default FormTextField;
