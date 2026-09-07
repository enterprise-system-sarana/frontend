import DashboardLayout from "@/components/layout/Dashboard";
import {
  CategoryPage,
  BrandPage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ChangePasswordPage,
  PermissionPage,
  RolePage,
  UserPage,
  SupplierPage,
  StorePage,
  StoreForm,
  StockPage,
  BankPage,
  CurrencyPage,
  FileUploadPage,
  ModelPage,
  VariantTypePage,
  VariantValuePage,
  CustomerPage,
  ProductPage,
  ProductForm,
  ProductDetail,
  ExpensePage,
  ExpenseTypePage,
  PurchasePage,
  PurchaseForm,
  SalePage,
  SaleForm,
  NotFoundPage,
} from "@/pages";
import PrivateRoute from "@/utils/privateRoute";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ROUTERS } from "@/constants/Route";
import { HomePage } from "@/pages/home/Home";

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
            element: <HomePage />,
          },
          {
            path: ROUTERS.HOME,
            element: <Navigate to={ROUTERS.HOME} replace />,
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
            path: ROUTERS.PRODUCT_DETAIL,
            element: <ProductDetail />,
          },

          {
            path: ROUTERS.SUPPLIER,
            element: <SupplierPage />,
          },
          {
            path: ROUTERS.PURCHASE,
            element: <PurchasePage />,
          },
          {
            path: ROUTERS.PURCHASE_CREATE,
            element: <PurchaseForm />,
          },
          {
            path: ROUTERS.PURCHASE_EDIT,
            element: <PurchaseForm />,
          },

          {
            path: ROUTERS.STORE,
            element: <StorePage />,
          },
          {
            path: ROUTERS.STORE_CREATE,
            element: <StoreForm />,
          },
          {
            path: ROUTERS.STORE_EDIT,
            element: <StoreForm />,
          },
          {
            path: ROUTERS.STOCK,
            element: <StockPage />,
          },
          // sales
          { path: ROUTERS.SALE, element: <SalePage /> },
          { path: ROUTERS.SALE_CREATE, element: <SaleForm /> },
          { path: ROUTERS.SALE_EDIT, element: <SaleForm /> },
          {
            path: ROUTERS.CUSTOMER,
            element: <CustomerPage />,
          },
          {
            path: ROUTERS.SALE,
            element: <SalePage />,
          },
          {
            path: ROUTERS.SALE_CREATE,
            element: <SaleForm />,
          },
          {
            path: ROUTERS.SALE_EDIT,
            element: <SaleForm />,
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
            element: <PermissionPage />,
          },
          // finance
          {
            path: ROUTERS.BANK,
            element: <BankPage />,
          },
          {
            path: ROUTERS.CURRENCY,
            element: <CurrencyPage />,
          },
          // expenses
          {
            path: ROUTERS.EXPENSE,
            element: <ExpensePage />,
          },
          {
            path: ROUTERS.EXPENSE_TYPE,
            element: <ExpenseTypePage />,
          },
          {
            path: ROUTERS.CHANGE_PASSWORD,
            element: <ChangePasswordPage />,
          },
          {
            path: ROUTERS.FILE_UPLOAD,
            element: <FileUploadPage />,
          },
          {
            path: "*",
            element: <NotFoundPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;