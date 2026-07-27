import DashboardLayout from "@/components/layout/Dashboard";
import { CategoryPage, LoginPage, PermissionPage, GroupPermissionPage, ProductPage, ProductForm, RolePage, SubCategoryPage, UnitPage, UserPage, SupplierPage, StorePage, BankPage, CurrencyPage } from "@/pages";
import PurchaseForm from "@/pages/purchases/purchase/PurchaseForm";
import { PurchasePage } from "@/pages/purchases/purchase/PurchasePage";
import {PurchasePaymentPage} from "@/pages/purchases/purchase/PurchasePayment";
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
                        path: "sub-category",
                        element: <SubCategoryPage />,
                    },
                    {
                        path: "unit",
                        element: <UnitPage />
                    },
                    {
                        path: "product",
                        element: <ProductPage />
                    },
                    {
                        path: "product/create",
                        element: <ProductForm />
                    },
                    {
                        path: "product/edit/:id",
                        element: <ProductForm />
                    },
                    //  inventory 
                    {
                        path: "supplier",
                        element: <SupplierPage />
                    },
                    {
                        path: "purchase",
                        element: <PurchasePage />
                    },
                    {
                        path: "purchase/create",
                        element: <PurchaseForm /> 
                    },
                    {
                        path: "purchase/edit/:id",
                        element: <PurchaseForm />
                    },
                    {
                        path: "purchase/payment",
                        element: <PurchasePaymentPage/>
                    },
                    {
                        path: "store",
                        element: <StorePage />
                    },
                    // role permission 
                    {
                        path: "roles",
                        element: <RolePage />,
                    },

                    {
                        path: "users",
                        element: <UserPage />,
                    },
                    {
                        path: "role-permissions",
                        element: <PermissionPage />
                    },
                    {
                        path: "permission-groups",
                        element: <GroupPermissionPage />
                    },
                    // finance
                    {
                        path: "bank",
                        element: <BankPage />
                    },
                    {
                        path: "currency",
                        element: <CurrencyPage />
                    }
                ],
            },
        ],
    },
]);

export default router;