import DashboardLayout from "@/components/layout/Dashboard";
import {
  CategoryPage,
  BrandPage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ChangePasswordPage,
  ProfilePage,
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
  ExpensePage,
  ExpenseTypePage,
  PurchasePage,
  PurchaseForm,
  PurchaseInvoice,
  SalePage,
  SaleForm,
  SaleInvoicePage,
  PaymentPage,
  // SaleDetail,
  ReportPage,
  SalesItemReportPage,
  ExpenseReportPage,
  ProductSerialReportPage,
  NotFoundPage,
  QuotePage,
  QuoteForm,
} from "@/pages";
import PrivateRoute from "@/utils/privateRoute";
import PermissionRoute from "@/utils/permissionRoute";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ROUTERS } from "@/constants/Route";
import { PERMISSION } from "@/constants/Permission";
import { HomePage } from "@/pages/home/Home";
import { PurchasePaymentPage } from "@/pages/purchases/purchase/PurchasePayment";

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
    path: ROUTERS.SALE_CREATE,
    element: (
      <PermissionRoute permission={PERMISSION.SALE.CREATE}>
        <SaleForm />
      </PermissionRoute>
    ),
  },
  {
    path: ROUTERS.SALE_INVOICE,
    element: <SaleInvoicePage />,
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
            element: (
              <PermissionRoute permission={PERMISSION.PRODUCT.CREATE}>
                <ProductForm />
              </PermissionRoute>
            ),
          },
          {
            path: ROUTERS.PRODUCT_EDIT,
            element: <ProductForm />,
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
            element: (
              <PermissionRoute permission={PERMISSION.PURCHASE.CREATE}>
                <PurchaseForm />
              </PermissionRoute>
            ),
          },
          {
            path: ROUTERS.PURCHASE_EDIT,
            element: <PurchaseForm />,
          },
          {
            path: ROUTERS.PURCHASE_PAYMENT,
            element: <PurchasePaymentPage />,
          },
          {
            path: ROUTERS.STORE,
            element: <StorePage />,
          },
          {
            path: ROUTERS.STOCK,
            element: <StockPage />,
          },
          // sales
          {
            path: ROUTERS.CUSTOMER,
            element: <CustomerPage />,
          },
          {
            path: ROUTERS.QUOTE,
            element: <QuotePage />,
          },
          {
            path: ROUTERS.QUOTE_CREATE,
            element: <QuoteForm />,
          },
          {
            path: ROUTERS.QUOTE_EDIT,
            element: <QuoteForm />,
          },
          // role permission
          {
            path: ROUTERS.ROLE,
            element: <RolePage />,
          },

          {
            path: ROUTERS.STORE,
            element: <StorePage />,
          },
          {
            path: ROUTERS.STORE_CREATE,
            element: (
              <PermissionRoute permission={PERMISSION.STORE.CREATE}>
                <StoreForm />
              </PermissionRoute>
            ),
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
          // { path: ROUTERS.SALE_DETAIL, element: <SaleDetail /> },
          {
            path: ROUTERS.SALE_EDIT,
            element: (
              <PermissionRoute permission={PERMISSION.SALE.UPDATE}>
                <SaleForm />
              </PermissionRoute>
            ),
          },

          { path: ROUTERS.PAYMENT, element: <PaymentPage /> },
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
            element: (
              <PermissionRoute permission={PERMISSION.SALE.CREATE}>
                <SaleForm />
              </PermissionRoute>
            ),
          },
          {
            path: ROUTERS.SALE_EDIT,
            element: (
              <PermissionRoute permission={PERMISSION.SALE.UPDATE}>
                <SaleForm />
              </PermissionRoute>
            ),
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
            path: ROUTERS.PROFILE,
            element: <ProfilePage />,
          },
          {
            path: ROUTERS.REPORT_SALES,
            element: <ReportPage />,
          },
          {
            path: ROUTERS.REPORT_SALES_ITEMS,
            element: <SalesItemReportPage />,
          },
          {
            path: ROUTERS.REPORT_EXPENSES,
            element: <ExpenseReportPage />,
          },
          {
            path: ROUTERS.REPORT_PRODUCT_SERIALS,
            element: <ProductSerialReportPage />,
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