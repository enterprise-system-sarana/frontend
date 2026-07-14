import { useAppSelector } from "@/store/store";

export const useAuth = () => {

    const user = useAppSelector(state => state.auth.user);
    const permissions = user?.permissions ?? [];
    const roles = user?.roles ?? [];
    return { user, permissions, roles };
};

