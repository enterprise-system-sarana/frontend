import { useMemo, useState } from "react";
import type { VisibilityState } from "@tanstack/react-table";
import type { UserResponse } from "@/types/users/Users";
import { useUser, useDeleteUser } from "@/hooks/users/useUser";
import { DataTable, exportTableToCsv, exportTableToPdf, printTable, getColumnsForVisibility } from "@/components/ui/data-table";
import { UserColumns } from "./UserColumn";
import { PageHeader } from "@/components/ui/page-header";
import { QueryBoundary } from "@/components/ui/query-boundary";
import FormUser from "./userForm";
import ConfirmDelete from "@/components/ui/confirmDelete";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { useSearch } from "@/utils/useSearch";
import { PageFilter, type FilterGroup } from "@/utils/PageFilter";
import { AccessDenied } from "@/components/ui/access-denied";
import { Status } from "@/types/enum/status";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

const UserPage = () => {
    const { t } = useLanguage();
    const { Can } = usePermission();
    const canCreate = Can(PERMISSION.USERS.CREATE);
    const canRead = Can(PERMISSION.USERS.READ);
    const canUpdate = Can(PERMISSION.USERS.UPDATE);
    const canDelete = Can(PERMISSION.USERS.DELETE);

    const [open, setOpen] = useState(false);
    const [user, setUser] = useState<UserResponse | null>(null);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState("");
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

    const { data, isError, isLoading } = useUser({ page, size });
    const { mutate: deleteUserMutate } = useDeleteUser();

    // Filter Groups for Filter +
    const filterGroups: FilterGroup[] = useMemo(() => [
        {
            key: "status",
            label: t("common.status"),
            options: [
                { label: t("common.active"), value: Status.ACTIVE },
                { label: t("common.inactive"), value: Status.INACTIVE },
            ],
        },
    ], [t]);

    const handleColumnToggle = (columnId: string) => {
        setColumnVisibility((prev) => ({
            ...prev,
            [columnId]: prev[columnId] === false ? true : false,
        }));
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilterValues((prev) => {
            const next = { ...prev };
            if (!value) {
                delete next[key];
            } else {
                next[key] = value;
            }
            return next;
        });
        setPage(1);
    };

    const handleReset = () => {
        setSearch("");
        setFilterValues({});
        setPage(1);
    };

    const searchedUsers = useSearch<UserResponse>(
        data?.payload?.data,
        search,
        ["username", "email", "storeName"]
    );

    const filteredUsers = useMemo(() => {
        return searchedUsers.filter((item) => {
            if (filterValues.status) {
                const itemStatus =
                    item.isActive === "ACT" || item.isActive === "ACTIVE" || item.isActive === "true" || (item.isActive as any) === true
                        ? Status.ACTIVE
                        : Status.INACTIVE;
                if (itemStatus !== filterValues.status) {
                    return false;
                }
            }
            return true;
        });
    }, [searchedUsers, filterValues]);

    const handleEdit = (u: UserResponse) => {
        setUser(u);
        setOpen(true);
    };

    const handleDelete = (id: number) => {
        const selected = data?.payload?.data?.find((u: UserResponse) => u.id === id);
        if (selected) {
            setUser(selected);
            setOpenConfirmDelete(true);
        }
    };

    const confirmDelete = () => {
        if (user?.id) {
            deleteUserMutate(user.id, {
                onSuccess: () => {
                    toast.success("User deleted successfully");
                    setOpenConfirmDelete(false);
                    setUser(null);
                },
                onError: (err: any) => {
                    toast.error(err?.message || "Failed to delete user");
                },
            });
        }
    };

    const columns = useMemo(
        () =>
            UserColumns({
                onEdit: handleEdit,
                onDelete: handleDelete,
                canEdit: canUpdate,
                canDelete: canDelete,
                t,
            }),
        [canUpdate, canDelete, t]
    );

    const handleExportCsv = () => {
        exportTableToCsv(filteredUsers, columns, "users");
    };

    const handleDownloadPdf = () => {
        exportTableToPdf(filteredUsers, columns, "users", "Users List");
    };

    const handlePrintPdf = () => {
        printTable("Users List");
    };

    if (!canRead) {
        return <AccessDenied resource="users" showBackButton />;
    }

    return (
        <>
            <div className="space-y-4">
                {/* Top Header */}
                <PageHeader
                    title={t("nav.user")}
                    featureName={t("nav.user")}
                    onCreate={canCreate ? () => { setUser(null); setOpen(true); } : undefined}
                    hideButton={!canCreate}
                />

                {/* Main Card with Toolbar & Table */}
                <div className="rounded-2xl border border-border/60 bg-card shadow-2xs overflow-hidden">
                    {/* Toolbar row with Search, Filter+, Columns, Print, CSV */}
                    <div className="p-4 border-b border-border/60">
                        <PageFilter
                            search={search}
                            onSearchChange={setSearch}
                            searchPlaceholder="Search users by name, email..."
                            filterGroups={filterGroups}
                            filterValues={filterValues}
                            onFilterChange={handleFilterChange}
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
                                data={filteredUsers}
                                columnVisibility={columnVisibility}
                                onColumnVisibilityChange={setColumnVisibility}
                                pagination={{
                                    currentPage: page,
                                    pageSize: size,
                                    totalElements: data?.payload?.pagination?.totalElements || filteredUsers.length,
                                    totalPages: data?.payload?.pagination?.totalPages || 1,
                                    onPageChange: setPage,
                                    onPageSizeChange: setSize,
                                }}
                            />
                        </QueryBoundary>
                    </div>
                </div>
            </div>

            <FormUser
                open={open}
                setOpen={setOpen}
                user={user}
            />

            <ConfirmDelete
                isOpen={openConfirmDelete}
                setIsOpen={setOpenConfirmDelete}
                entityName="User"
                confirmDelete={confirmDelete}
            />
        </>
    );
};

export default UserPage;
