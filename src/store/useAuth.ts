import { useAppSelector } from "@/store/store";

export const useAuth = () => {
    const user = useAppSelector((state) => state.auth.user);
    const firstName = user?.firstName || "";
    const lastName = user?.lastName || "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || user?.username || "";
    const email = user?.email || "";
    const storeId = user?.storeId ?? null;
    const profileImage = user?.profileImage || "";
    const permissions = user?.permissions ?? [];
    const roles = user?.roles ?? [];

    return {
        user,
        permissions,
        roles,
        profileImage,
        fullName,
        firstName,
        lastName,
        email,
        storeId,
    };
};
