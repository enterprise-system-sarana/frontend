import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { VisibilityState } from "@tanstack/react-table";
import {
  DataTable,
  exportTableToCsv,
  exportTableToPdf,
  printTable,
  getColumnsForVisibility,
} from "@/components/ui/data-table";
import { QueryBoundary } from "@/components/ui/query-boundary";
import ConfirmDelete from "@/components/ui/confirmDelete";
import { PageHeader } from "@/components/ui/page-header";
import { useSearch } from "@/utils/useSearch";
import { PageFilter, type FilterGroup } from "@/utils/PageFilter";

import { Status } from "@/types/enum/status";
import type { RoleResponse } from "@/types/users/Role";
import { useRole } from "@/hooks/users/useRole";
import { ROUTERS } from "@/constants/Route";
import { RoleColumns } from "./RoleColumn";
import FormRole from "./RoleForm";
import { usePermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { AccessDenied } from "@/components/ui/access-denied";


const RolePage = () => {
  const { Can } = usePermission();
  const canCreate = Can(PERMISSION.ROLES.CREATE);
  const canRead = Can(PERMISSION.ROLES.READ);
  const canUpdate = Can(PERMISSION.ROLES.UPDATE);
  const canDelete = Can(PERMISSION.ROLES.DELETE);

  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<RoleResponse>();
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

  const { data, isError, isLoading } = useRole.GetAllRole({
    page,
    size,
  });

  console.log("data", data)
  const { mutate: deleteRoleMutate } = useRole.DeleteRole();

  // Filter Groups for Filter +
  const filterGroups: FilterGroup[] = [
    {
      key: "status",
      label: "Status",
      options: [
        { label: "Active", value: Status.ACTIVE },
        { label: "Inactive", value: Status.INACTIVE },
      ],
    },
  ];

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
  };

  const handleReset = () => {
    setSearch("");
    setFilterValues({});
  };

  const searchRole = useSearch<RoleResponse>(
    data?.payload?.data,
    search,
    ["name", "status"],
  );

  const filteredRole = useMemo(() => {
    return searchRole?.filter((item) => {
      if (filterValues.status && item.status !== filterValues.status) {
        return false;
      }
      return true;
    });
  }, [searchRole, filterValues]);

  const handleEdit = (r: RoleResponse) => {
    if (!canUpdate) return;
    setRole(r);
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!canDelete) return;
    const selected = data?.payload?.data?.find(
      (u: RoleResponse) => u.id === id,
    );
    if (selected) {
      setRole(selected);
      setOpenConfirmDelete(true);
    }
  };

  const confirmDelete = () => {
    if (role?.id) {
      deleteRoleMutate(
        { id: role.id },
        {
          onSuccess: () => {
            setOpenConfirmDelete(false);
          },
        },
      );
    }
  };

  const handleViewPermissions = (r: RoleResponse) => {
    navigate(`${ROUTERS.ROLE_PERMISSIONS}?roleId=${r.id}`);
  };

  const columns = useMemo(
    () =>
      RoleColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onViewPermissions: handleViewPermissions,
      }),
    [],
  );

  const handleExportCsv = () => {
    exportTableToCsv(filteredRole, columns, "Roles");
  };

  const handleDownloadPdf = () => {
    exportTableToPdf(
      filteredRole,
      columns,
      "Roles",
      "Roles List",
    );
  };

  const handlePrintPdf = () => {
    printTable("Roles List");
  };

  if (!canRead) return <AccessDenied resource="roles" showBackButton />;

  return (
    <>
      <div className="space-y-4">
        {/* Top Header */}
        <PageHeader
          title="Roles"
          featureName="Role"
          onCreate={canCreate ? () => {
            setRole(null);
            setOpen(true);
          } : undefined}
          hideButton={!canCreate}
        />

        {/* Main Card with Toolbar & Table */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-2xs overflow-hidden">
          {/* Toolbar row with Search, Filter+, Columns, Print, CSV */}
          <div className="p-4 border-b border-border/60">
            <PageFilter
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search categories..."
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
                data={filteredRole}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                pagination={{
                  currentPage: page,
                  pageSize: size,
                  totalElements:
                    data?.payload?.pagination?.totalElements ||
                    filteredRole.length,
                  totalPages: data?.payload?.pagination?.totalPages || 1,
                  onPageChange: setPage,
                  onPageSizeChange: setSize,
                }}
              />
            </QueryBoundary>
          </div>
        </div>
      </div>

      <FormRole open={open} setOpen={setOpen} role={role} />

      <ConfirmDelete
        isOpen={openConfirmDelete}
        setIsOpen={setOpenConfirmDelete}
        entityName={"Role"}
        confirmDelete={confirmDelete}
      />
    </>
  );
};

export default RolePage;
