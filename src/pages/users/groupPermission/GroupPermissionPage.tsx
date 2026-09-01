// import { useState } from "react";
// import { DataTable } from "@/components/ui/data-table";
// import { QueryBoundary } from "@/components/ui/query-boundary";
// import ConfirmDelete from "@/components/ui/confirmDelete";
// import type { GroupPermission } from "@/types/users/Group";
// import { useSearch } from "@/utils/useSearch";
// import { PageFilter } from "@/utils/PageFilter";
// import { useGroupPermission } from "@/hooks/users/useGroupPermision";
// import FormGroupPermission from "./GroupPermissionForm";
// import { GroupPermissionColumns } from "./GroupPermissionColumn";
// import { usePermission } from "@/utils/UsePermission";
// import { PERMISSION } from "@/constants/Permission";
// import { PageHeader } from "@/components/ui/page-header";
// import { AccessDenied } from "@/components/ui/access-denied";

// export const GroupPermissionPage = () => {
//     const { Can } = usePermission();
//     const canCreate = Can(PERMISSION.PERMISSION_GROUP.CREATE);
//     const canRead = Can(PERMISSION.PERMISSION_GROUP.READ);
//     const canUpdate = Can(PERMISSION.PERMISSION_GROUP.UPDATE);
//     const canDelete = Can(PERMISSION.PERMISSION_GROUP.DELETE);

//     const [open, setOpen] = useState(false);
//     const [group, setGroup] = useState<GroupPermission | null>(null);
//     const [page, setPage] = useState(1);
//     const [size, setSize] = useState(10);
//     const [search, setSearch] = useState("");
//     const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

//     const { data, isError, isLoading } = useGroupPermission.useGetAllGroupPermission({ page, size });
//     const { mutate: deleteGroupMutate } = useGroupPermission.useDeleteGroupPermission();

//     // const groupList: GroupPermission[] = Array.isArray(data?.payload?.data)
//     //     ? data.payload.data
//     //     : Array.isArray(data?.payload)
//     //     ? data.payload
//     //     : Array.isArray(data?.data)
//     //     ? data.data
//     //     : [];

//     // const filteredGroups = useSearch<GroupPermission>(
//     //     groupList,
//     //     search,
//     //     ["name", "code", "description"]
//     // );

//     const handleEdit = (g: GroupPermission) => {
//         setGroup(g);
//         setOpen(true);
//     };

//     const handleDelete = (id: number) => {
//         const selected = data?.payload?.data?.find((u: GroupPermission) => u.id === id);
//         if (selected) {
//             setGroup(selected);
//             setOpenConfirmDelete(true);
//         }
//     };

//     const confirmDelete = () => {
//         if (group?.id) {
//             deleteGroupMutate(group.id, {
//                 onSuccess: () => {
//                     setOpenConfirmDelete(false);
//                 }
//             });
//         }
//     };

//     if (!canRead) {
//         return <AccessDenied resource="permission groups" showBackButton />;
//     }

//     return (
//         <>
//             <div className="space-y-4">
//                 {/* Top Header */}
//                 <PageHeader
//                     title="Permission Groups"
//                     buttonLabel="Add Permission Group"
//                     onCreate={canCreate ? () => { setGroup(null); setOpen(true); } : undefined}
//                     hideButton={!canCreate}
//                 />

//                 <div className="rounded-2xl border border-border/60 bg-card shadow-2xs overflow-hidden">
//                     <div className="p-4 border-b border-border/60">
//                         <PageFilter
//                             search={search}
//                             onSearchChange={setSearch}
//                             searchPlaceholder="Search permission groups..."
//                             onReset={() => setSearch("")}
//                         />
//                     </div>

//                     <div className="px-0">
//                         <QueryBoundary isLoading={isLoading} isError={isError}>
//                             <DataTable
//                                 columns={GroupPermissionColumns({
//                                     onEdit: handleEdit,
//                                     onDelete: handleDelete,
//                                     canEdit: canUpdate,
//                                     canDelete: canDelete,
//                                 })}
//                                 data={filteredGroups}
//                                 pagination={data?.payload?.pagination ? {
//                                     currentPage: page,
//                                     pageSize: size,
//                                     totalElements: data?.payload?.pagination?.totalElements || 0,
//                                     totalPages: data?.payload?.pagination?.totalPages || 1,
//                                     onPageChange: setPage,
//                                     onPageSizeChange: setSize,
//                                 } : undefined}
//                             />
//                         </QueryBoundary>
//                     </div>
//                 </div>
//             </div>

//             <FormGroupPermission
//                 open={open}
//                 setOpen={setOpen}
//                 group={group}
//             />

//             <ConfirmDelete
//                 isOpen={openConfirmDelete}
//                 setIsOpen={setOpenConfirmDelete}
//                 entityName="Permission Group"
//                 confirmDelete={confirmDelete}
//             />
//         </>
//     );
// };

// export default GroupPermissionPage;
