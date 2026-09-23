export const PERMISSION = {
  // ==================== finance ========================
  BANK: {
    READ: "bank:read",
    CREATE: "bank:create",
    UPDATE: "bank:update",
    DELETE: "bank:delete",
  },
  CURRENCY: {
    READ: "currency:read",
    CREATE: "currency:create",
    UPDATE: "currency:update",
    DELETE: "currency:delete",
  },

  // ============== START PERMISSION PRODUCT ==============
  PRODUCT: {
    READ: "product:read",
    CREATE: "product:create",
    UPDATE: "product:update",
    DELETE: "product:delete",
  },
  CATEGORY: {
    READ: "category:read",
    CREATE: "category:create",
    UPDATE: "category:update",
    DELETE: "category:delete",
  },
  BRAND: {
    READ: "brand:read",
    CREATE: "brand:create",
    UPDATE: "brand:update",
    DELETE: "brand:delete",
  },
  MODEL: {
    READ: "model:read",
    CREATE: "model:create",
    UPDATE: "model:update",
    DELETE: "model:delete",
  },
  VARIANT_TYPE: {
    READ: "variantType:read",
    CREATE: "variantType:create",
    UPDATE: "variantType:update",
    DELETE: "variantType:delete",
  },
  VARIANT_VALUE: {
    READ: "variantValue:read",
    CREATE: "variantValue:create",
    UPDATE: "variantValue:update",
    DELETE: "variantValue:delete",
  },
  SUBCATEGORY: {
    READ: "subCategory:read",
    CREATE: "subCategory:create",
    UPDATE: "subCategory:update",
    DELETE: "subCategory:delete",
  },
  UNIT: {
    READ: "unit:read",
    CREATE: "unit:create",
    UPDATE: "unit:update",
    DELETE: "unit:delete",
  },

  // ================== PERMISSION PURCHASES =====================
  SUPPLIER: {
    READ: "supplier:read",
    CREATE: "supplier:create",
    UPDATE: "supplier:update",
    DELETE: "supplier:delete",
  },
  PURCHASE: {
    READ: "purchase:read",
    CREATE: "purchase:create",
    UPDATE: "purchase:update",
    DELETE: "purchase:delete",
    APPROVE: "purchase:approve",
    COMPLETED: "purchase:completed",
    CANCEL: "purchase:cancel",
  },
  EXPENSES_TYPE: {
    READ: "expensesType:read",
    CREATE: "expensesType:create",
    UPDATE: "expensesType:update",
    DELETE: "expensesType:delete",
  },
  EXPENSE: {
    READ: "expense:read",
    CREATE: "expense:create",
    UPDATE: "expense:update",
    DELETE: "expense:delete",
  },
  ORDER_ITEM: {
    READ: "orderItem:read",
    CREATE: "orderItem:create",
    UPDATE: "orderItem:update",
    DELETE: "orderItem:delete",
  },

  // ================= INVENTORY PERMISSION ==========================
  ADJUSTMENT: {
    READ: "adjustment:read",
    CREATE: "adjustment:create",
    UPDATE: "adjustment:update",
    DELETE: "adjustment:delete",
  },
  STOCK: {
    READ: "stock:read",
    CREATE: "stock:create",
    UPDATE: "stock:update",
    DELETE: "stock:delete",
  },
  STORE: {
    READ: "store:read",
    CREATE: "store:create",
    UPDATE: "store:update",
    DELETE: "store:delete",
  },
  TRANSFER: {
    READ: "transfer:read",
    CREATE: "transfer:create",
    UPDATE: "transfer:update",
    DELETE: "transfer:delete",
    APPROVE: "transfer:approve",
    COMPLETED: "transfer:completed",
    CANCEL: "transfer:cancel",
  },

  // ================== PERMISSION SALES ==========================
  CUSTOMER: {
    READ: "customer:read",
    CREATE: "customer:create",
    UPDATE: "customer:update",
    DELETE: "customer:delete",
  },
  SALE: {
    READ: "sale:read",
    CREATE: "sale:create",
    UPDATE: "sale:update",
    DELETE: "sale:delete",
  },
  PAYMENT: {
    READ: "payment:read",
    CREATE: "payment:create",
    UPDATE: "payment:update",
    DELETE: "payment:delete",
  },
  GROUP: {
    READ: "group:read",
    CREATE: "group:create",
    UPDATE: "group:update",
    DELETE: "group:delete",
  },
  OPTION: {
    READ: "option:read",
    CREATE: "option:create",
    UPDATE: "option:update",
    DELETE: "option:delete",
  },
  TABLE: {
    READ: "table:read",
    CREATE: "table:create",
    UPDATE: "table:update",
    DELETE: "table:delete",
  },
  SELLER: {
    READ: "seller:read",
    CREATE: "seller:create",
    UPDATE: "seller:update",
    DELETE: "seller:delete",
  },
  SELLERS: {
    READ: "seller:read",
    CREATE: "seller:create",
    UPDATE: "seller:update",
    DELETE: "seller:delete",
  },

  // ================== REPORT ==========================
  REPORT: {
    READ: "report:read",
  },

  //=============== USER =========================
  USERS: {
    READ: "user:read",
    CREATE: "user:create",
    UPDATE: "user:update",
    DELETE: "user:delete",
  },
  USER: {
    READ: "user:read",
    CREATE: "user:create",
    UPDATE: "user:update",
    DELETE: "user:delete",
  },
  ROLES: {
    READ: "role:read",
    CREATE: "role:create",
    UPDATE: "role:update",
    DELETE: "role:delete",
  },
  ROLE: {
    READ: "role:read",
    CREATE: "role:create",
    UPDATE: "role:update",
    DELETE: "role:delete",
  },
  PERMISSION: {
    READ: "permission:read",
    CREATE: "permission:create",
    UPDATE: "permission:update",
    DELETE: "permission:delete",
  },
  GROUPPERMISSION: {
    READ: "permissionGroup:read",
    CREATE: "permissionGroup:create",
    UPDATE: "permissionGroup:update",
    DELETE: "permissionGroup:delete",
  },
  PERMISSION_GROUP: {
    READ: "permissionGroup:read",
    CREATE: "permissionGroup:create",
    UPDATE: "permissionGroup:update",
    DELETE: "permissionGroup:delete",
  },
};