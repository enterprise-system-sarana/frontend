import { useAuth } from "@/store/useAuth";

export const usePermission = () => {
    const { permissions } = useAuth();
    const Can = (permission: string) => permissions.includes(permission);
    const CanAny = (...permissionList: string[]) => permissionList.some(p => permissions.includes(p));
    const CanAll = (...permissionList: string[]) => permissionList.every(p => permissions.includes(p));

    return { Can, CanAny, CanAll };
};