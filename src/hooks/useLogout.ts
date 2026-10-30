import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/store/store";
import { logout } from "@/store/authSlice";
import { AuthService } from "@/services/auth/auth.service";
import { ROUTERS } from "@/constants/Route";

/** Logs out on the backend (best effort), clears auth state and returns to login. */
export function useLogout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return async () => {
    try {
      await AuthService.logout();
    } catch (err) {
      console.error("Failed to log out from backend:", err);
    }
    dispatch(logout());
    navigate(ROUTERS.LOGIN);
  };
}
