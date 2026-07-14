import DashboardLayout from "@/components/layout/Dashboard";
import { CategoryPage, LoginPage } from "@/pages";
import PrivateRoute from "@/utils/privateRoute";
import { createBrowserRouter, Navigate } from "react-router-dom";

const router = createBrowserRouter([
    {
        path: "/login",
        element: <LoginPage />,
    },

    {
        element: <PrivateRoute />,
        children: [
            {
                path: "/",
                element: <DashboardLayout />,
                children: [
                    {
                        index: true,
                        element: <Navigate to="/category" replace />,
                    },
                    {
                        path: "category",
                        element: <CategoryPage />,
                    },
                    {
                        path: "categoryPage",
                        element: <CategoryPage />,
                    },
                ],
            },
        ],
    },
]);

export default router;