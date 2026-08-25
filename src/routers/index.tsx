import DashboardLayout from "@/components/layout/Dashboard";
import {
    CategoryPage, BrandPage, LoginPage, RegisterPage, ForgotPasswordPage,
    ChangePasswordPage, PermissionPage, GroupPermissionPage, RolePage, UserPage,
    SupplierPage, StorePage, StockPage, BankPage, CurrencyPage, FileUploadPage,
    ModelPage, VariantTypePage, VariantValuePage, CustomerPage, ProductPage,
    ProductForm, ExpensePage, ExpenseTypePage
} from "@/pages";
import { PurchasePage } from "@/pages/purchases/purchase/PurchasePage";
import { PurchasePaymentPage } from "@/pages/purchases/purchase/PurchasePayment";
import PrivateRoute from "@/utils/privateRoute";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ROUTERS } from "@/constants/Route";

const router = createBrowserRouter([
    {
        path: ROUTERS.LOGIN,
        element: <LoginPage />,
    },
    {
        path: ROUTERS.REGISTER,
        element: <RegisterPage />,
    },
    {
        path: ROUTERS.FORGOT_PASSWORD,
        element: <ForgotPasswordPage />,
    },

    {
        element: <PrivateRoute />,
        children: [
            {
                path: ROUTERS.DASHBOARD,
                element: <DashboardLayout />,
                children: [
                    {
                        index: true,
                        element: <Navigate to={ROUTERS.CATEGORY} replace />,
                    },
                    {
                        path: ROUTERS.CATEGORY,
                        element: <CategoryPage />,
                    },
                    {
                        path: ROUTERS.BRAND,
                        element: <BrandPage />,
                    },
                    {
                        path: ROUTERS.MODEL,
                        element: <ModelPage />,
                    },
                    {
                        path: ROUTERS.VARIANT_TYPE,
                        element: <VariantTypePage />,
                    },
                    {
                        path: ROUTERS.VARIANT_VALUE,
                        element: <VariantValuePage />,
                    },
                    {
                        path: ROUTERS.PRODUCT,
                        element: <ProductPage />,
                    },
                    {
                        path: ROUTERS.PRODUCT_CREATE,
                        element: <ProductForm />,
                    },
                    {
                        path: ROUTERS.PRODUCT_EDIT,
                        element: <ProductForm />,
                    },

                    {
                        path: ROUTERS.SUPPLIER,
                        element: <SupplierPage />
                    },
                    {
                        path: ROUTERS.PURCHASE,
                        element: <PurchasePage />
                    },

                    {
                        path: ROUTERS.PURCHASE_PAYMENT,
                        element: <PurchasePaymentPage />
                    },
                    {
                        path: ROUTERS.STORE,
                        element: <StorePage />
                    },
                    {
                        path: ROUTERS.STOCK,
                        element: <StockPage />
                    },
                    // sales
                    {
                        path: ROUTERS.CUSTOMER,
                        element: <CustomerPage />
                    },
                    // role permission 
                    {
                        path: ROUTERS.ROLE,
                        element: <RolePage />,
                    },

                    {
                        path: ROUTERS.USER,
                        element: <UserPage />,
                    },
                    {
                        path: ROUTERS.ROLE_PERMISSIONS,
                        element: <PermissionPage />
                    },
                    {
                        path: ROUTERS.GROUP_PERMISSION,
                        element: <GroupPermissionPage />
                    },
                    // finance
                    {
                        path: ROUTERS.BANK,
                        element: <BankPage />
                    },
                    {
                        path: ROUTERS.CURRENCY,
                        element: <CurrencyPage />
                    },
                    // expenses
                    {
                        path: ROUTERS.EXPENSE,
                        element: <ExpensePage />
                    },
                    {
                        path: ROUTERS.EXPENSE_TYPE,
                        element: <ExpenseTypePage />
                    },
                    {
                        path: ROUTERS.CHANGE_PASSWORD,
                        element: <ChangePasswordPage />
                    },
                    {
                        path: ROUTERS.FILE_UPLOAD,
                        element: <FileUploadPage />
                    }
                ],
            },
        ],
    },
]);

export default router;