import React from "react";
import { Route, Routes } from "react-router-dom";

import AccountLayout from "./layouts/AccountLayout";
import AdminLayout from "./layouts/AdminLayout";
import PublicLayout from "./layouts/PublicLayout";

import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ProductDetails from "./pages/ProductDetails";
import Register from "./pages/Register";
import Shop from "./pages/Shop";

import Dashboard from "./pages/account/Dashboard";
import AccountOrderDetails from "./pages/account/OrderDetails";
import Orders from "./pages/account/Orders";
import Notifications from "./pages/account/Notifications";
import Profile from "./pages/account/Profile";
import Settings from "./pages/account/Settings";
import Wishlist from "./pages/account/Wishlist";

import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminFulfillment from "./pages/admin/AdminFulfillment";
import AdminGames from "./pages/admin/AdminGames";
import AdminOrderDetails from "./pages/admin/AdminOrderDetails";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminUsers from "./pages/admin/AdminUsers";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop/:gameSlug" element={<Shop />} />
        <Route path="/best-sellers" element={<Shop mode="best-sellers" />} />
        <Route path="/offers" element={<Shop mode="offers" />} />
        <Route path="/search" element={<Shop mode="search" />} />
        <Route path="/product/:slug" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route path="/account" element={<AccountLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:orderNumber" element={<AccountOrderDetails />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:orderNumber" element={<AdminOrderDetails />} />
        <Route path="fulfillment" element={<AdminFulfillment />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="games" element={<AdminGames />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
      </Route>
    </Routes>
  );
}
