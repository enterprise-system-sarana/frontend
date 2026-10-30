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
import { KeyRound, ShieldCheck, UsersRound } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";


const RolePage = () => {
  const { t } = useLanguage();
  const { Can } = usePermission();
  const canCreate = Can(PERMISSION.ROLES.CREATE);
  const canRead = Can(PERMISSION.ROLES.READ);
  const canUpdate = Can(PERMISSION.ROLES.UPDATE);
  const canDelete = Can(PERMISSION.ROLES.DELETE);

  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<RoleResponse | null>(null);
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

  const { mutate: deleteRoleMutate } = useRole.DeleteRole();

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
        canEdit: canUpdate,
        canDelete,
        t,
      }),
    [handleEdit, handleDelete, handleViewPermissions, canUpdate, canDelete, t]
  );

  const pageRoles: RoleResponse[] = data?.payload?.data || [];
  const totalRoles = data?.payload?.pagination?.totalElements ?? pageRoles.length;
  const activeRoles = pageRoles.filter((item) => item.status?.toUpperCase() === "ACTIVE").length;
  const permissionCount = pageRoles.reduce((count, item) => count + (item.permissionIds?.length || 0), 0);

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
      <div className="role-page space-y-5">
        {/* Top Header */}
        <PageHeader
          title={t("role.title", "Roles")}
          description={t("role.set_details", "Create roles and manage what each role can access.")}
          titleIcon={<span className="role-page-title-icon"><ShieldCheck className="h-5 w-5" /></span>}
          featureName={t("nav.role", "Role")}
          onCreate={canCreate ? () => {
            setRole(null);
            setOpen(true);
          } : undefined}
          hideButton={!canCreate}
        />

        <KpiGrid>
          <KpiCard
            featured
            icon={UsersRound}
            title={`${t("common.total", "Total")} ${t("role.title", "Roles")}`}
            value={totalRoles}
            caption={`${activeRoles} ${t("common.active", "Active")}`}
            splits={[
              { label: t("common.active", "Active"), value: activeRoles, color: "#4ade80" },
              { label: t("common.inactive", "Inactive"), value: pageRoles.length - activeRoles, color: "#fbbf24" },
            ]}
          />
          <KpiCard
            tone="green"
            icon={ShieldCheck}
            title={t("common.active", "Active")}
            subtitle={t("role.active_roles_desc", "Roles currently in use")}
            value={activeRoles}
            caption={`/ ${pageRoles.length} ${t("role.title", "Roles")}`}
            percent={pageRoles.length > 0 ? (activeRoles / pageRoles.length) * 100 : 0}
          />
          <KpiCard
            tone="purple"
            icon={KeyRound}
            title={t("role.permissions", "Permissions")}
            subtitle={t("role.assigned_permissions_desc", "Assigned across listed roles")}
            value={permissionCount}
          />
        </KpiGrid>

        {/* Main Card with Toolbar & Table */}
        <div className="role-table-card rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="role-table-heading"><div><h2>{t("role.title", "Role directory")}</h2><p>{t("role.choose_role", "Search roles, review access, and manage permissions.")}</p></div><span>{totalRoles} {t("common.total", "total")}</span></div>
          {/* Toolbar row with Search, Filter+, Columns, Print, CSV */}
          <div className="px-5 py-4 border-b border-border">
            <PageFilter
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder={t("role.search_placeholder", "Search roles...")}
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
        entityName={t("nav.role", "Role")}
        confirmDelete={confirmDelete}
      />
    </>
  );
};

export default RolePage;
