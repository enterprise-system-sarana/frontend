import { useEffect, useRef } from "react";
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

import FormTextField, {
  FormRadioGroupField,
  FormTextareaField,
} from "@/components/ui/FormTextField";

import { RoleSchema } from "@/types/users/Role";
import type { RoleResponse, RoleRequest } from "@/types/users/Role";

import { Status, StatusOptions } from "@/types/enum/status";
import { useLanguage } from "@/i18n/LanguageContext";
import { useRole } from "@/hooks/users/useRole";

import { ShieldCheck } from "lucide-react";

type FormRoleProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  role: RoleResponse | null;
};

const getDefaultValues = (role: RoleResponse | null): RoleRequest => ({
  code: role?.code ?? "",
  name: role?.name ?? "",
  description: role?.description ?? "",
  status: role?.status ?? Status.ACTIVE,
});

const FormRole = ({ open, setOpen, role }: FormRoleProps) => {
  const { t } = useLanguage();

  const { mutate: createRoleMutate, isPending: isCreating } =
    useRole.CreateRole();

  const { mutate: updateRoleMutate, isPending: isUpdating } =
    useRole.UpdateRole();

  const isPending = isCreating || isUpdating;

  // Prevent duplicate submissions
  const submittingRef = useRef(false);

  const form = useForm({
    defaultValues: getDefaultValues(role),

    validators: {
      onSubmit: RoleSchema,
    },

    onSubmit: async ({ value }) => {
      if (submittingRef.current) return;

      submittingRef.current = true;

      const handleSuccess = () => {
        form.reset();
        setOpen(false);
      };

      const handleSettled = () => {
        submittingRef.current = false;
      };

      if (role) {
        updateRoleMutate(
          {
            id: role.id,
            req: value,
          },
          {
            onSuccess: handleSuccess,
            onSettled: handleSettled,
          },
        );
      } else {
        createRoleMutate(value, {
          onSuccess: handleSuccess,
          onSettled: handleSettled,
        });
      }
    },
  });

  // Reset form when opening or switching role
  useEffect(() => {
    if (!open) return;

    form.reset(getDefaultValues(role));
  }, [open, role]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending) return;

    if (!nextOpen) {
      form.reset(getDefaultValues(role));
    }

    setOpen(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-xl md:max-w-2xl flex flex-col p-0 gap-0 rounded-2xl border border-border/80 shadow-2xl overflow-hidden bg-card"
        onEscapeKeyDown={(event) => {
          if (isPending) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (isPending) event.preventDefault();
        }}
      >
        <DialogHeader className="px-6 py-5 border-b border-border/60 bg-muted/15 flex flex-row items-center gap-3.5 pr-12 text-left">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
              {role ? t("common.edit") : t("common.add")}{" "}
              {t("nav.role")}
            </DialogTitle>

           
          </div>
        </DialogHeader>

        <form
          id="role-form"
          className="px-6 sm:px-7 py-6 overflow-y-auto max-h-[calc(85vh-160px)]"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <FieldGroup className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormTextField
                form={form}
                name="code"
                label={t("common.code")}
                placeholder="e.g. ROLE_ADMIN"
                type="text"
                required
                autoComplete="off"
              />

              <FormTextField
                form={form}
                name="name"
                label={t("common.name")}
                placeholder="e.g. Admin"
                type="text"
                required
                autoComplete="off"
              />
            </div>

            <FormTextareaField
              form={form}
              name="description"
              label={t("common.description")}
              placeholder="Role description..."
            />

            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <FormRadioGroupField
                form={form}
                name="status"
                label={t("common.status", "Status")}
                required
                options={StatusOptions.filter(
                  (option) => option.value !== Status.DELETE,
                )}
              />
            </div>
          </FieldGroup>
        </form>

        <DialogFooter className="px-6 py-4 border-t border-border/60 bg-muted/10 flex items-center justify-end gap-3 shrink-0">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              className="h-10 px-5 rounded-xl border-border/80 font-medium"
            >
              {t("common.cancel")}
            </Button>
          </DialogClose>

          <Button
            type="submit"
            form="role-form"
            disabled={isPending}
            className="h-10 px-6 rounded-xl font-medium shadow-sm"
          >
            {isPending
              ? t("common.saving")
              : role
                ? t("common.save")
                : t("common.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormRole;
