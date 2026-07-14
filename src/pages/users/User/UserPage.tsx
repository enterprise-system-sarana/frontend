import { useState } from "react";
import type { UserResponse } from "@/types/users/Users";
import { useUser, useDeleteUser } from "@/hooks/users/useUser";
import { DataTable } from "@/components/ui/data-table";
import { UserColumns } from "./UserColumn";
import { Button } from "@/components/ui/button";
import { QueryBoundary } from "@/components/ui/query-boundary";
import FormUser from "./FormUser";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { useSearch } from "@/utils/useSearch";
import { PageFilter } from "@/utils/PageFilter";

const UserPage = () => {
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
    const { data, isError, isLoading } = useUser({ page, size, });
    const { mutate: deleteUserMutate } = useDeleteUser();

    const filteredUsers = useSearch<UserResponse>(data?.payload?.data, search, ["username", "email"]);

    const handleEdit = (user: UserResponse) => {
        setUser(user);
        setOpen(true);
    };

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this user?")) {
            deleteUserMutate(id);
        }
    };

    // const handleFilterChange = (newFilters: Record<string, string>) => {
    //     setFilters(newFilters);
    //     setPage(1);
    // };

    // const searchFields = [
    //     { key: "username", label: "Username", placeholder: "Search by username..." },
    //     { key: "email", label: "Email", placeholder: "Search by email..." },
    // ];

    if (!canRead) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
                <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to view users.</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Users</h1>
                {canCreate && (
                    <Button onClick={() => { setUser(null); setOpen(true); }}>+ Add User</Button>
                )}
            </div>
            <PageFilter
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search users..."
                onReset={() => setSearch("")}
            />
            <QueryBoundary isLoading={isLoading} isError={isError}>
                <DataTable
                    columns={UserColumns({
                        onEdit: handleEdit,
                        onDelete: handleDelete,
                        canEdit: canUpdate,
                        canDelete: canDelete,
                    })}
                    data={filteredUsers}
                    pagination={{
                        currentPage: page,
                        pageSize: size,
                        totalElements: data?.payload?.pagination?.totalElements || 0,
                        totalPages: data?.payload?.pagination?.totalPages || 1,
                        onPageChange: setPage,
                        onPageSizeChange: setSize,
                    }}
                // searchFields={searchFields}
                // onFilterChange={handleFilterChange}
                />
            </QueryBoundary>

            <FormUser
                open={open}
                setOpen={setOpen}
                user={user}
            />
        </>
    );
};

export default UserPage;
