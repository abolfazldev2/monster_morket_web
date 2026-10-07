import api from "./api";

export const gamesApi = {
  list: () => api.get("/games/"),
  detail: (slug) => api.get(`/games/${slug}/`),
};

export const productsApi = {
  list: (params) => api.get("/products/", { params }),
  detail: (slug) => api.get(`/products/${slug}/`),
};

export const sellerApi = {
  listings: () => api.get("/seller/listings/"),
  createListing: (payload) => api.post("/seller/listings/", payload),
  updateListing: (id, payload) => api.patch(`/seller/listings/${id}/`, payload),
  removeListing: (id) => api.delete(`/seller/listings/${id}/`),
  sales: () => api.get("/seller/sales/"),
  markDelivered: (id) => api.post(`/seller/sales/${id}/mark-delivered/`),
};

export const cartApi = {
  get: () => api.get("/cart/"),
  addItem: (payload) => api.post("/cart/items/", payload),
  updateItem: (itemId, quantity) => api.patch(`/cart/items/${itemId}/`, { quantity }),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}/`),
};

export const ordersApi = {
  list: () => api.get("/orders/"),
  detail: (orderNumber) => api.get(`/orders/${orderNumber}/`),
  create: (itemsCustomerData, couponCode) =>
    api.post("/orders/", { items_customer_data: itemsCustomerData, coupon_code: couponCode || "" }),
};

export const authApi = {
  register: (payload) => api.post("/users/register/", payload),
  login: (payload) => api.post("/auth/token/", payload),
  me: () => api.get("/users/me/"),
  stats: () => api.get("/users/me/stats/"),
};

export const steamApi = {
  beginConnect: () => api.post("/users/steam/connect/"),
  connection: () => api.get("/users/steam/connection/"),
  saveTradeUrl: (trade_url) => api.patch("/users/steam/connection/", { trade_url }),
  disconnect: () => api.delete("/users/steam/connection/"),
  inventory: (game) => api.get("/users/steam/inventory/", { params: { game } }),
};

export const wishlistApi = {
  list: () => api.get("/wishlist/"),
  addItem: (productId) => api.post("/wishlist/items/", { product_id: productId }),
  removeItem: (itemId) => api.delete(`/wishlist/items/${itemId}/`),
};

export const couponsApi = {
  validate: (code) => api.post("/coupons/validate/", { code }),
};

export const notificationsApi = {
  list: () => api.get("/notifications/"),
  markRead: (id) => api.post(`/notifications/${id}/mark_read/`),
  markAllRead: () => api.post("/notifications/mark-all-read/"),
};

export const adminFulfillmentApi = {
  list: (params) => api.get("/admin/fulfillment/", { params }),
  detail: (id) => api.get(`/admin/fulfillment/${id}/`),
  transition: (id, action) => api.post(`/admin/fulfillment/${id}/transition/`, { action }),
  addNote: (id, note) => api.post(`/admin/fulfillment/${id}/notes/`, { note }),
};

export const adminPaymentsApi = {
  confirm: (id, transactionReference, note) =>
    api.post(`/payments/${id}/confirm/`, { transaction_reference: transactionReference, note }),
};

export const adminOrdersApi = {
  cancelUnpaid: (orderNumber) => api.post(`/orders/${orderNumber}/cancel_unpaid/`),
};

export const adminProductsApi = {
  list: (params) => api.get("/admin/products/", { params }),
  detail: (id) => api.get(`/admin/products/${id}/`),
  create: (payload) => api.post("/admin/products/", payload),
  update: (id, payload) => api.patch(`/admin/products/${id}/`, payload),
  remove: (id) => api.delete(`/admin/products/${id}/`),
};

export const adminGamesApi = {
  list: () => api.get("/admin/games/"),
  create: (payload) => api.post("/admin/games/", payload),
  update: (id, payload) => api.patch(`/admin/games/${id}/`, payload),
  remove: (id) => api.delete(`/admin/games/${id}/`),
};

export const adminCategoriesApi = {
  list: (params) => api.get("/admin/games/categories/", { params }),
  create: (payload) => api.post("/admin/games/categories/", payload),
  remove: (id) => api.delete(`/admin/games/categories/${id}/`),
};

export const adminCouponsApi = {
  list: () => api.get("/admin/coupons/"),
  create: (payload) => api.post("/admin/coupons/", payload),
  update: (id, payload) => api.patch(`/admin/coupons/${id}/`, payload),
  remove: (id) => api.delete(`/admin/coupons/${id}/`),
};

export const adminReviewsApi = {
  list: (params) => api.get("/admin/reviews/", { params }),
  update: (id, payload) => api.patch(`/admin/reviews/${id}/`, payload),
  remove: (id) => api.delete(`/admin/reviews/${id}/`),
};

export const adminUsersApi = {
  list: (params) => api.get("/admin/users/", { params }),
  update: (id, payload) => api.patch(`/admin/users/${id}/`, payload),
};

export const adminAuditLogsApi = {
  list: (params) => api.get("/admin/audit-logs/", { params }),
};

export const adminReportsApi = {
  overview: () => api.get("/admin/reports/overview/"),
};
