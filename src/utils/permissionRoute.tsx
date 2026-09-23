import type { ReactNode } from "react";
import { AccessDenied } from "@/components/ui/access-denied";
import { usePermission } from "@/utils/UsePermission";

interface PermissionRouteProps {
    permission: string;
    children: ReactNode;
}

const PermissionRoute = ({ permission, children }: PermissionRouteProps) => {
    const { Can } = usePermission();

    return Can(permission) ? children : <AccessDenied showBackButton />;
};

export default PermissionRoute;
