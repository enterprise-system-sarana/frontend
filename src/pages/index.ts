// Product 
export { default as CategoryPage } from "@/pages/product/category/CategoryPage";
export { default as BrandPage } from "@/pages/product/brand/BrandPage";
export { default as ModelPage } from "@/pages/product/model/ModelPage";
export { default as VariantTypePage } from "@/pages/product/variantType/VariantTypePage";
export { default as VariantValuePage } from "@/pages/product/variantValue/VariantValuePage";
export { default as ProductPage } from "@/pages/product/product/ProductPage";
export { default as ProductForm } from "@/pages/product/product/ProductForm";
export { default as ProductDetailModal } from "@/pages/product/product/ProductDetailModal";
export { HomePage as HhomePage } from "@/pages/home/Home";

export { default as PurchasePage } from "@/pages/purchases/purchase/PurchasePage";
export { default as PurchaseForm } from "@/pages/purchases/purchase/PurchaseForm";
export { PurchaseDetailModal } from "@/pages/purchases/purchase/PurchaseDetail";
export { default as PurchaseInvoice } from "@/pages/purchases/purchase/PurchaseInvoice";

export { default as QuotePage } from "@/pages/sales/quotes/QuotePage";
export { default as QuoteForm } from "@/pages/sales/quotes/QuoteForm";


// auth 

export { default as LoginPage } from "@/pages/auth/Login";
export { default as RegisterPage } from "@/pages/auth/Register";
export { default as ForgotPasswordPage } from "@/pages/auth/ForgotPassword";
export { default as ChangePasswordPage } from "@/pages/auth/ChangePassword";
export { default as ProfilePage } from "@/pages/profile/ProfilePage";



// User management
export { default as UserPage } from "@/pages/users/User/UserPage";
export { default as RolePage } from "@/pages/users/Role/Role";
export { PermissionPage as PermissionPage } from "@/pages/users/permission/Permission"
// export { default as GroupPermissionPage } from "@/pages/users/groupPermission/GroupPermissionPage";




// Inventory 
export { StorePage } from "@/pages/inventory/store/StorePage";
export { default as StoreForm } from "@/pages/inventory/store/StoreForm";
export { StockPage } from "@/pages/inventory/stock/StockPage";



// purchase 
export { SupplierPage } from "@/pages/purchases/supplier/SupplierPage"

// Finance
export { default as BankPage } from "@/pages/finance/bank/BankPage";
export { default as CurrencyPage } from "@/pages/finance/currency/CurrencyPage";

// Sales
export { default as CustomerPage } from "@/pages/sales/customers/CustomerPage";
export { default as SalePage } from "@/pages/sales/sale/SalePage";
export { default as SaleForm } from "@/pages/sales/sale/SaleForm";
export { default as SaleInvoicePage } from "@/pages/sales/sale/SaleInvoicePage";
export { default as PaymentPage } from "@/pages/sales/payment/PaymentPage";
// export { default as SaleDetail } from "@/pages/sales/sale/SaleDetail";
export { default as SaleDetailModal } from "@/pages/sales/sale/SaleDetailModal";

// Expenses
export { default as ExpensePage } from "@/pages/expenses/expense/ExpensePage";
export { default as ExpenseTypePage } from "@/pages/expenses/expenseType/ExpenseTypePage";
export { default as ReportPage } from "@/pages/reports/sale/ReportPage";
export { default as SalesItemReportPage } from "@/pages/reports/saleItem/SalesItemReportPage";
export { default as ExpenseReportPage } from "@/pages/reports/expense/ExpenseReportPage";
export { default as ProductSerialReportPage } from "@/pages/reports/productSerial/ProductSerialReportPage";
export { default as ProfitLossReportPage } from "@/pages/reports/finance/ProfitLossReportPage";

// File Upload Testing
export { default as FileUploadPage, FileUpload } from "@/pages/FileUpload";

// Error Pages
export { default as NotFoundPage } from "@/pages/error/NotFoundPage";