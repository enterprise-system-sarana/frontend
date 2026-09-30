import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Search, ShieldCheck, Save, X, ArrowLeft, KeyRound, LockKeyhole, Layers3 } from "lucide-react";
// import { useAllRoles, useRolePermissions, useUpdateRolePermissions } from "@/hooks/users/useRole";
import { usePermission } from "@/hooks/users/usePermission";
import { QueryBoundary } from "@/components/ui/query-boundary";
import { usePermission as useAppPermission } from "@/utils/UsePermission";
import { PERMISSION } from "@/constants/Permission";
import { ROUTERS } from "@/constants/Route";

import { AccessDenied } from "@/components/ui/access-denied";
import { PageHeader } from "@/components/ui/page-header";
import { useRole } from '@/hooks/users/useRole';

export const PermissionPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const roleIdParam = searchParams.get("roleId") || searchParams.get("role") || "";

    const { Can } = useAppPermission();
    const canRead = Can(PERMISSION.PERMISSION.READ) || Can(PERMISSION.ROLES.READ);
    const canUpdate = Can(PERMISSION.PERMISSION.UPDATE) || Can(PERMISSION.ROLES.UPDATE);

    const [selectedRoleId, setSelectedRoleId] = useState<string>(roleIdParam);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const { data: rolesData, isLoading: isLoadingRoles, isError: isErrorRoles } = useRole.GetAllRole({ page: 1, size: 200 });
    const { data: allPermissionsData, isLoading: isLoadingAllPerms, isError: isErrorAllPerms } = usePermission.useFindAll();
    const { data: rolePermissionsData, isLoading: isLoadingRolePerms, isError: isErrorRolePerms } = useRole.GetRolePermission(
        selectedRoleId ? Number(selectedRoleId) : null
    );
    const updatePermissionsMutation = useRole.UpdateRolePermissions();

    const roles = rolesData?.payload?.data || [];

    // Sync selectedRoleId from URL param or resolve by code/name
    useEffect(() => {
        if (!roleIdParam) return;
        if (!isNaN(Number(roleIdParam))) {
            setSelectedRoleId(roleIdParam);
        } else if (roles.length > 0) {
            const found = roles.find((r: any) =>
                r.code?.toLowerCase() === roleIdParam.toLowerCase() ||
                r.name?.toLowerCase() === roleIdParam.toLowerCase()
            );
            if (found) {
                setSelectedRoleId(found.id.toString());
            }
        }
    }, [roleIdParam, roles]);

    const handleRoleChange = (roleId: string) => {
        setSelectedRoleId(roleId);
        setSearchParams(roleId ? { roleId } : {});
    };

    const selectedRole = useMemo(() => {
        return roles.find((r: any) => r.id?.toString() === selectedRoleId);
    }, [roles, selectedRoleId]);
    const isLoading = isLoadingRoles || (selectedRoleId ? isLoadingRolePerms : isLoadingAllPerms);
    const isError = isErrorRoles || (selectedRoleId ? isErrorRolePerms : isErrorAllPerms);

    useEffect(() => {
        if (selectedRoleId) {
            if (rolePermissionsData?.payload) {
                setPermissions(rolePermissionsData.payload);
            }
        } else {
            if (allPermissionsData?.payload) {
                setPermissions(allPermissionsData.payload.map((p: any) => ({ ...p, checked: false })));
            } else {
                setPermissions([]);
            }
        }
    }, [selectedRoleId, rolePermissionsData, allPermissionsData]);

    const grouped = useMemo(() => {
        const groups: Record<string, any[]> = {};
        permissions.forEach((p) => {
            const groupName = p.groupName || "Other";
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(p);
        });
        return groups;
    }, [permissions]);

    const handleGroupToggle = (groupName: string, checked: boolean) => {
        setPermissions((prev) =>
            prev.map((p) => {
                if ((p.groupName || "Other") === groupName) {
                    return { ...p, checked };
                }
                return p;
            })
        );
    };

    const handleSingleToggle = (id: number) => {
        setPermissions((prev) =>
            prev.map((p) => {
                if (p.id === id) {
                    return { ...p, checked: !p.checked };
                }
                return p;
            })
        );
    };

    const handleSave = () => {
        if (!selectedRoleId) {
            toast.error("Please select a role first!");
            return;
        }
        const checkedIds = permissions.filter((p) => p.checked).map((p) => p.id);
        updatePermissionsMutation.mutate({
            id: Number(selectedRoleId),
            permissionIds: checkedIds,
        });
    };

    const filteredGroups = useMemo(() => {
        const result: Record<string, any[]> = {};
        Object.entries(grouped).forEach(([groupName, list]) => {
            const term = searchTerm.trim().toLowerCase();
            if (!term || groupName.toLowerCase().includes(term) || list.some((permission) => `${permission.name || ""} ${permission.code || ""}`.toLowerCase().includes(term))) {
                result[groupName] = list;
            }
        });
        return result;
    }, [grouped, searchTerm]);

    const checkedCount = permissions.filter((permission) => permission.checked).length;
    const moduleCount = Object.keys(grouped).length;

    if (!canRead) {
        return <AccessDenied resource="permissions" showBackButton />;
    }

    return (
        <div className="role-permissions-page space-y-5">
            {/* Header section */}
            <PageHeader
                title="Role Permissions"
                titleIcon={<span className="role-page-title-icon"><LockKeyhole className="h-5 w-5" /></span>}
                description={selectedRole
                    ? `Manage access for ${selectedRole.name} (${selectedRole.code}).`
                    : "Choose a role to review and assign access by module."}
                hideButton
                actions={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(ROUTERS.ROLE)}
                        className="gap-1.5 cursor-pointer"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Roles
                    </Button>
                }
            />

            <div className="role-overview-grid">
                <div className="role-overview-card"><span className="role-overview-icon blue"><ShieldCheck size={20} /></span><span><small>Selected role</small><strong className="role-overview-name">{selectedRole?.name || "No role selected"}</strong></span></div>
                <div className="role-overview-card"><span className="role-overview-icon green"><KeyRound size={20} /></span><span><small>Enabled permissions</small><strong>{checkedCount} <em>/ {permissions.length}</em></strong></span></div>
                <div className="role-overview-card"><span className="role-overview-icon orange"><Layers3 size={20} /></span><span><small>Modules</small><strong>{moduleCount}</strong></span></div>
            </div>

            <div className="role-permissions-card">
              <div className="role-permissions-card-heading"><div><h2>Access by module</h2><p>Choose a role, then select the actions it can perform.</p></div><span>{moduleCount} modules</span></div>
              {/* Selection and Filter toolbar */}
              <div className="role-permissions-toolbar flex flex-col sm:flex-row gap-4">
                {/* Role Selector */}
                <div className="flex flex-col gap-1.5 w-full sm:w-[260px]">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Select Role</span>
                    <Select value={selectedRoleId} onValueChange={handleRoleChange}>
                        <SelectTrigger className="w-full h-9 border-border/80 bg-background text-sm">
                            <SelectValue placeholder="Select Role..." />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map((role: any) => (
                                <SelectItem key={role.id} value={role.id.toString()}>
                                    {role.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Module Search Filter */}
                <div className="flex flex-col gap-1.5 flex-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filter Modules</span>
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            type="text"
                            className="pl-9 pr-8 h-9 border-border/80 rounded-lg focus-visible:ring-primary/20 bg-background"
                            placeholder="Search modules or permissions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm("")}
                                className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                                title="Clear search"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>
              </div>

            {/* Matrix Table */}
            <QueryBoundary isLoading={isLoading} isError={isError} fullScreen={false}>
                <Card className="role-permissions-matrix gap-0 border-0 rounded-none overflow-hidden py-0 shadow-none">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead className="border-b border-border/50">
                                <tr>
                                    <th className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase min-w-[200px]">Module Name</th>
                                    <th className="px-4 py-3.5 font-semibold text-xs tracking-wider uppercase text-center w-[100px]">READ</th>
                                    <th className="px-4 py-3.5 font-semibold text-xs tracking-wider uppercase text-center w-[100px]">CREATE</th>
                                    <th className="px-4 py-3.5 font-semibold text-xs tracking-wider uppercase text-center w-[100px]">UPDATE</th>
                                    <th className="px-4 py-3.5 font-semibold text-xs tracking-wider uppercase text-center w-[100px]">DELETE</th>
                                    <th className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase">Other Permissions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {Object.entries(filteredGroups).map(([groupName, groupPermissions]) => {
                                    // Extract standard CRUD permissions
                                    const viewPerm = groupPermissions.find(p => p.code.endsWith(':read') || p.code.endsWith(':view'));
                                    const addPerm = groupPermissions.find(p => p.code.endsWith(':create') || p.code.endsWith(':add'));
                                    const editPerm = groupPermissions.find(p => p.code.endsWith(':update') || p.code.endsWith(':edit'));
                                    const deletePerm = groupPermissions.find(p => p.code.endsWith(':delete') || p.code.endsWith(':remove'));

                                    // Gather custom / action permissions
                                    const otherPerms = groupPermissions.filter(
                                        p => p !== viewPerm && p !== addPerm && p !== editPerm && p !== deletePerm
                                    );

                                    // Check if all permissions inside this group are checked
                                    const allChecked = groupPermissions.every(p => p.checked);

                                    return (
                                        <tr key={groupName} className="hover:bg-muted/20 dark:hover:bg-muted/10 transition-colors">
                                            {/* Column 1: Module Name & Toggle Group Checkbox */}
                                            <td className="px-6 py-4 font-medium text-foreground">
                                                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                                    <Checkbox
                                                        checked={allChecked}
                                                        onChange={(e) => handleGroupToggle(groupName, e.target.checked)}
                                                        disabled={!canUpdate}
                                                    />
                                                    <span className="font-semibold text-foreground/90">{groupName}</span>
                                                    <span className="role-module-count">{groupPermissions.filter(p => p.checked).length}/{groupPermissions.length}</span>
                                                </label>
                                            </td>

                                            {/* Column 2: View (Read) */}
                                            <td className="px-4 py-4 text-center">
                                                {viewPerm ? (
                                                    <Checkbox
                                                        checked={viewPerm.checked}
                                                        onChange={() => handleSingleToggle(viewPerm.id)}
                                                        className="mx-auto"
                                                        disabled={!canUpdate}
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground/30 text-xs">—</span>
                                                )}
                                            </td>

                                            {/* Column 3: Add (Create) */}
                                            <td className="px-4 py-4 text-center">
                                                {addPerm ? (
                                                    <Checkbox
                                                        checked={addPerm.checked}
                                                        onChange={() => handleSingleToggle(addPerm.id)}
                                                        className="mx-auto"
                                                        disabled={!canUpdate}
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground/30 text-xs">—</span>
                                                )}
                                            </td>

                                            {/* Column 4: Edit (Update) */}
                                            <td className="px-4 py-4 text-center">
                                                {editPerm ? (
                                                    <Checkbox
                                                        checked={editPerm.checked}
                                                        onChange={() => handleSingleToggle(editPerm.id)}
                                                        className="mx-auto"
                                                        disabled={!canUpdate}
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground/30 text-xs">—</span>
                                                )}
                                            </td>

                                            {/* Column 5: Delete */}
                                            <td className="px-4 py-4 text-center">
                                                {deletePerm ? (
                                                    <Checkbox
                                                        checked={deletePerm.checked}
                                                        onChange={() => handleSingleToggle(deletePerm.id)}
                                                        className="mx-auto"
                                                        disabled={!canUpdate}
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground/30 text-xs">—</span>
                                                )}
                                            </td>

                                            {/* Column 6: Custom / Extra Permissions */}
                                            <td className="px-6 py-4">
                                                {otherPerms.length > 0 ? (
                                                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                                                        {otherPerms.map((perm) => (
                                                            <label
                                                                key={perm.id}
                                                                className="flex items-center gap-2 cursor-pointer group text-xs text-foreground/80 hover:text-primary transition-colors"
                                                            >
                                                                <Checkbox
                                                                    checked={perm.checked}
                                                                    onChange={() => handleSingleToggle(perm.id)}
                                                                    disabled={!canUpdate}
                                                                />
                                                                <span className="font-medium">{perm.name}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground/40 text-xs italic">No other actions</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {Object.keys(filteredGroups).length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">No modules match your search.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </QueryBoundary>

            {/* Bottom Actions footer */}
            <div className="role-permissions-footer flex items-center justify-between gap-4">
                <p>{selectedRole ? `Changes to ${selectedRole.name} take effect after saving.` : "Select a role to save permissions."}</p>
                <Button
                    onClick={handleSave}
                    disabled={!canUpdate || !selectedRoleId || updatePermissionsMutation.isPending}
                    size="default"
                    className="h-10 px-6 gap-1.5 font-semibold bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="h-4 w-4" />
                    {updatePermissionsMutation.isPending ? "Saving..." : "Save permissions"}
                </Button>
            </div>
            </div>
        </div>
    );
};
