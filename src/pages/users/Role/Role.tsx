import { useState } from "react";
import type { RoleResponse } from "@/types/users/Role";
import { useRole, useDeleteRole } from "@/hooks/users/useRole";
import { DataTable } from "@/components/ui/data-table";
import { RoleColumns } from "./RoleColumn";
import { Button } from "@/components/ui/button";
import { QueryBoundary } from "@/components/ui/query-boundary";
import FormRole from "./FormRole";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { useSearch } from "@/utils/useSearch";
import { PageFilter } from "@/utils/PageFilter";

const RolePage = () => {
    const { Can } = usePermission();
    const canCreate = Can(PERMISSION.ROLES.CREATE);
    const canRead = Can(PERMISSION.ROLES.READ);
    const canUpdate = Can(PERMISSION.ROLES.UPDATE);
    const canDelete = Can(PERMISSION.ROLES.DELETE);

    const [open, setOpen] = useState(false);
    const [role, setRole] = useState<RoleResponse | null>(null);
    const [search, setSearch] = useState("");
    const { data, isError, isLoading } = useRole({ page: 1, size: 10 });
    const { mutate: deleteRoleMutate } = useDeleteRole();

    const filteredRoles = useSearch<RoleResponse>(data?.payload, search, ["name", "code", "description"]);

    const handleEdit = (role: RoleResponse) => {
        setRole(role);
        setOpen(true);
    };

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this role?")) {
            deleteRoleMutate(id);
        }
    };

    if (!canRead) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
                <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to view roles.</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Roles</h1>
                {canCreate && (
                    <Button onClick={() => { setRole(null); setOpen(true); }}>+ Add Role</Button>
                )}
            </div>
            <PageFilter
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search roles..."
                onReset={() => setSearch("")}
            />
            <QueryBoundary isLoading={isLoading} isError={isError}>
                <DataTable
                    columns={RoleColumns({
                        onEdit: handleEdit,
                        onDelete: handleDelete,
                        canEdit: canUpdate,
                        canDelete: canDelete,
                    })}
                    data={filteredRoles}
                />
            </QueryBoundary>

            <FormRole
                open={open}
                setOpen={setOpen}
                role={role}
            />
        </>
    );
};

export default RolePage;
