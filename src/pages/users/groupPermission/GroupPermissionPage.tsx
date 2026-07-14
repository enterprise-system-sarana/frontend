import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import ConfirmDelete from "@/components/ui/confirmDelete";
import type { GroupPermission } from "@/types/users/Group";
import { useSearch } from "@/utils/useSearch";
import PageHeader from "@/components/ui/page-header";
import { PageFilter } from "@/utils/PageFilter";
import { useGroupPermission } from "@/hooks/users/useGroupPermision";
import FormGroupPermission from "./GroupPermissionForm";
import { GroupPermissionColumns } from "./GroupPermissionColumn";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";

export const GroupPermissionPage = () => {
    const { Can } = usePermission();
    const canCreate = Can(PERMISSION.PERMISSION_GROUP.CREATE);
    const canRead = Can(PERMISSION.PERMISSION_GROUP.READ);
    const canUpdate = Can(PERMISSION.PERMISSION_GROUP.UPDATE);
    const canDelete = Can(PERMISSION.PERMISSION_GROUP.DELETE);

    const [open, setOpen] = useState(false);
    const [group, setGroup] = useState<GroupPermission | null>(null);
    const [search, setSearch] = useState("");

    // Backend doesn't support pagination directly in GroupPermissionController, it returns a List
    const { data, isError, isLoading } = useGroupPermission.useFindAll();
    const { mutate: deleteGroupMutate } = useGroupPermission.useDelete();
    const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

    // Filter using search utility
    const filteredGroups = useSearch<GroupPermission>(
        data?.payload || [], 
        search, 
        ["name", "code", "description"]
    );

    const handleEdit = (group: GroupPermission) => {
        setGroup(group);
        setOpen(true);
    };

    const handleDelete = (id: number) => {
        const selected = data?.payload?.find((g: GroupPermission) => g.id === id);
        if (selected) {
            setGroup(selected);
            setOpenConfirmDelete(true);
        }
    };

    const confirmDelete = () => {
        if (group?.id) {
            deleteGroupMutate(group.id, {
                onSuccess: () => {
                    setOpenConfirmDelete(false);
                }
            });
        }
    };

    if (!canRead) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
                <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to view permission groups.</p>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Permission Groups"
                buttonText={canCreate ? "Add Permission Group" : undefined}
                onButtonClick={canCreate ? () => { setGroup(null); setOpen(true); } : undefined}
            />
            <PageFilter
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search permission groups..."
                onReset={() => setSearch("")}
            />

            <QueryBoundary isLoading={isLoading} isError={isError}>
                <DataTable
                    columns={GroupPermissionColumns({
                        onEdit: handleEdit,
                        onDelete: handleDelete,
                        canEdit: canUpdate,
                        canDelete: canDelete,
                    })}
                    data={filteredGroups}
                />
            </QueryBoundary>

            <FormGroupPermission
                open={open}
                setOpen={setOpen}
                group={group}
            />

            <ConfirmDelete
                isOpen={openConfirmDelete}
                setIsOpen={setOpenConfirmDelete}
                entityName="Permission Group"
                confirmDelete={confirmDelete}
            />
        </>
    );
};

export default GroupPermissionPage;
