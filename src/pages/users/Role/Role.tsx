import { useMemo, useState } from "react";
import type { VisibilityState } from "@tanstack/react-table";
import type { RoleResponse } from "@/types/users/Role";
import { useRole, useDeleteRole } from "@/hooks/users/useRole";
import { DataTable, exportTableToCsv, exportTableToPdf, printTable, getColumnsForVisibility } from "@/components/ui/data-table";
import { RoleColumns } from "./RoleColumn";
import { QueryBoundary } from "@/components/ui/query-boundary";
import FormRole from "./FormRole";
import ConfirmDelete from "@/components/ui/confirmDelete";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { useSearch } from "@/utils/useSearch";
import { PageFilter } from "@/utils/PageFilter";
import { PageHeader } from "@/components/ui/page-header";
import { AccessDenied } from "@/components/ui/access-denied";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

const RolePage = () => {
    const { t } = useLanguage();
    const { Can } = usePermission();
    const canCreate = Can(PERMISSION.ROLES.CREATE);
    const canRead = Can(PERMISSION.ROLES.READ);
    const canUpdate = Can(PERMISSION.ROLES.UPDATE);
    const canDelete = Can(PERMISSION.ROLES.DELETE);

    const [open, setOpen] = useState(false);
    const [role, setRole] = useState<RoleResponse | null>(null);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState("");
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

    const { data, isError, isLoading } = useRole({ page, size });
    const { mutate: deleteRoleMutate } = useDeleteRole();

    const handleColumnToggle = (columnId: string) => {
        setColumnVisibility((prev) => ({
            ...prev,
            [columnId]: prev[columnId] === false ? true : false,
        }));
    };

    const handleReset = () => {
        setSearch("");
        setPage(1);
    };

    const searchedRoles = useSearch<RoleResponse>(
        data?.payload?.data,
        search,
        ["name", "code", "description"]
    );

    const handleEdit = (r: RoleResponse) => {
        setRole(r);
        setOpen(true);
    };

    const handleDelete = (id: number) => {
        const selected = data?.payload?.data?.find((r: RoleResponse) => r.id === id);
        if (selected) {
            setRole(selected);
            setOpenConfirmDelete(true);
        }
    };

    const confirmDelete = () => {
        if (role?.id) {
            deleteRoleMutate(role.id, {
                onSuccess: () => {
                    toast.success("Role deleted successfully");
                    setOpenConfirmDelete(false);
                    setRole(null);
                },
                onError: (err: any) => {
                    toast.error(err?.message || "Failed to delete role");
                },
            });
        }
    };

    const columns = useMemo(
        () =>
            RoleColumns({
                onEdit: handleEdit,
                onDelete: handleDelete,
                canEdit: canUpdate,
                canDelete: canDelete,
                t,
            }),
        [canUpdate, canDelete, t]
    );

    const handleExportCsv = () => {
        exportTableToCsv(searchedRoles, columns, "roles");
    };

    const handleDownloadPdf = () => {
        exportTableToPdf(searchedRoles, columns, "roles", "Roles List");
    };

    const handlePrintPdf = () => {
        printTable("Roles List");
    };

    if (!canRead) {
        return <AccessDenied resource="roles" showBackButton />;
    }

    return (
        <>
            <div className="space-y-4">
                {/* Top Header */}
                <PageHeader
                    title={t("nav.role")}
                    featureName={t("nav.role")}
                    onCreate={canCreate ? () => { setRole(null); setOpen(true); } : undefined}
                    hideButton={!canCreate}
                />

                {/* Main Card with Toolbar & Table */}
                <div className="rounded-2xl border border-border/60 bg-card shadow-2xs overflow-hidden">
                    {/* Toolbar row with Search, Columns, Print, CSV */}
                    <div className="p-4 border-b border-border/60">
                        <PageFilter
                            search={search}
                            onSearchChange={setSearch}
                            searchPlaceholder="Search roles by name, code, description..."
                            columns={getColumnsForVisibility(columns, columnVisibility)}
                            onColumnToggle={handleColumnToggle}
                            onPrintPdf={handlePrintPdf}
                            onDownloadPdf={handleDownloadPdf}
                            onDownloadCsv={handleExportCsv}
                            onReset={handleReset}
                        />
                    </div>

                    {/* Table View */}
                    <div className="px-0">
                        <QueryBoundary isLoading={isLoading} isError={isError}>
                            <DataTable
                                columns={columns}
                                data={searchedRoles}
                                columnVisibility={columnVisibility}
                                onColumnVisibilityChange={setColumnVisibility}
                                pagination={{
                                    currentPage: page,
                                    pageSize: size,
                                    totalElements: data?.payload?.pagination?.totalElements || searchedRoles.length,
                                    totalPages: data?.payload?.pagination?.totalPages || 1,
                                    onPageChange: setPage,
                                    onPageSizeChange: setSize,
                                }}
                            />
                        </QueryBoundary>
                    </div>
                </div>
            </div>

            <FormRole
                open={open}
                setOpen={setOpen}
                role={role}
            />

            <ConfirmDelete
                isOpen={openConfirmDelete}
                setIsOpen={setOpenConfirmDelete}
                entityName="Role"
                confirmDelete={confirmDelete}
            />
        </>
    );
};

export default RolePage;
