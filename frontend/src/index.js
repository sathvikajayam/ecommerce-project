import React from "react";
import ReactDOM from "react-dom/client";
import "font-awesome/css/font-awesome.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./redux/store";

import {
  Home,
  Product,
  Products,
  CategoryProducts,
  BrandProducts,
  AllCategories,
  AllBrands,
  AboutPage,
  ContactPage,
  Cart,
  Login,
  ForgotPassword,
  ResetPassword,
  Register,
  Checkout,
  OrderSuccess,
  PageNotFound,
  SearchScreen,
  Profile,
  OrderHistory,
} from "./pages";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminForgotPassword from "./pages/admin/AdminForgotPassword";
import AdminResetPassword from "./pages/admin/AdminResetPassword";
import AdminRoute from "./pages/admin/AdminRoute";
import AdminPermissionRoute from "./pages/admin/AdminPermissionRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminAddProducts from "./pages/admin/AdminAddProducts";
import AdminEditProduct from "./pages/admin/AdminEditProduct";
import AdminBrands from "./pages/admin/AdminBrands";
import AddBrand from "./pages/admin/AddBrand";
import EditBrand from "./pages/admin/EditBrand";
import AdminCategories from "./pages/admin/AdminCategories";
import AddCategory from "./pages/admin/AddCategory";
import EditCategory from "./pages/admin/EditCategory";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAdmins from "./pages/admin/AdminAdmins";
import AdminAddUser from "./pages/admin/AdminAddUser";
import EditAdmin from "./pages/admin/EditAdmin";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminContactForms from "./pages/admin/AdminContactForms";
import AdminHomepage from "./pages/admin/AdminHomepage";

import ScrollToTop from "./components/ScrollToTop";
import { Toaster } from "react-hot-toast";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <ScrollToTop>
      <Provider store={store}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product" element={<Products />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/categories" element={<AllCategories />} />
          <Route path="/category/:categoryId" element={<CategoryProducts />} />
          <Route path="/brands" element={<AllBrands />} />
          <Route path="/brand/:brand" element={<BrandProducts />} />
          <Route path="/search" element={<SearchScreen />} />
          <Route path="/search/:keyword" element={<SearchScreen />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/order-history" element={<OrderHistory />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success/:orderId" element={<OrderSuccess />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
          <Route path="/admin/reset-password/:token" element={<AdminResetPassword />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route
              path="products"
              element={
                <AdminPermissionRoute
                  anyOf={[
                    { resource: "products", action: "view" },
                    { resource: "products", action: "create" },
                    { resource: "products", action: "edit" },
                    { resource: "products", action: "delete" },
                  ]}
                >
                  <AdminProducts />
                </AdminPermissionRoute>
              }
            />
            <Route
              path="products/add"
              element={
                <AdminPermissionRoute anyOf={[{ resource: "products", action: "create" }]}>
                  <AdminAddProducts />
                </AdminPermissionRoute>
              }
            />
            <Route
              path="products/edit/:id"
              element={
                <AdminPermissionRoute anyOf={[{ resource: "products", action: "edit" }]}>
                  <AdminEditProduct />
                </AdminPermissionRoute>
              }
            />
            <Route
              path="brands"
              element={
                <AdminPermissionRoute
                  anyOf={[
                    { resource: "brands", action: "view" },
                    { resource: "brands", action: "create" },
                    { resource: "brands", action: "edit" },
                    { resource: "brands", action: "delete" },
                  ]}
                >
                  <AdminBrands />
                </AdminPermissionRoute>
              }
            />
            <Route
              path="brands/add"
              element={
                <AdminPermissionRoute anyOf={[{ resource: "brands", action: "create" }]}>
                  <AddBrand />
                </AdminPermissionRoute>
              }
            />
            <Route
              path="brands/edit/:id"
              element={
                <AdminPermissionRoute anyOf={[{ resource: "brands", action: "edit" }]}>
                  <EditBrand />
                </AdminPermissionRoute>
              }
            />
            <Route
              path="categories"
              element={
                <AdminPermissionRoute
                  anyOf={[
                    { resource: "categories", action: "view" },
                    { resource: "categories", action: "create" },
                    { resource: "categories", action: "edit" },
                    { resource: "categories", action: "delete" },
                  ]}
                >
                  <AdminCategories />
                </AdminPermissionRoute>
              }
            />
            <Route
              path="categories/add"
              element={
                <AdminPermissionRoute anyOf={[{ resource: "categories", action: "create" }]}>
                  <AddCategory />
                </AdminPermissionRoute>
              }
            />
            <Route
              path="categories/edit/:id"
              element={
                <AdminPermissionRoute anyOf={[{ resource: "categories", action: "edit" }]}>
                  <EditCategory />
                </AdminPermissionRoute>
              }
            />
            <Route
              path="users"
              element={
                <AdminPermissionRoute
                  anyOf={[
                    { resource: "users", action: "view" },
                    { resource: "admin", action: "view" },
                  ]}
                >
                  <AdminUsers />
                </AdminPermissionRoute>
              }
            />
            <Route
              path="users/add"
              element={
                <AdminPermissionRoute anyOf={[{ resource: "admin", action: "create" }]}>
                  <AdminAddUser />
                </AdminPermissionRoute>
              }
            />
            <Route
              path="admins/add"
              element={
                <AdminPermissionRoute anyOf={[{ resource: "admin", action: "create" }]}>
                  <AdminAddUser />
                </AdminPermissionRoute>
              }
            />
            <Route
              path="admins"
              element={
                <AdminPermissionRoute anyOf={[{ resource: "admin", action: "view" }]}>
                  <AdminAdmins />
                </AdminPermissionRoute>
              }
            />
            <Route
              path="admins/edit/:id"
              element={
                <AdminPermissionRoute anyOf={[{ resource: "admin", action: "edit" }]}>
                  <EditAdmin />
                </AdminPermissionRoute>
              }
            />
            <Route
              path="orders"
              element={
                <AdminPermissionRoute anyOf={[{ resource: "orders", action: "view" }]}>
                  <AdminOrders />
                </AdminPermissionRoute>
              }
            />
            <Route
              path="coupons"
              element={
                <AdminPermissionRoute anyOf={[{ resource: "coupons", action: "view" }]}>
                  <AdminCoupons />
                </AdminPermissionRoute>
              }
            />
            <Route
              path="homepage"
              element={
                <AdminPermissionRoute
                  anyOf={[
                    { resource: "homepage", action: "view" },
                    { resource: "admin", action: "view" },
                  ]}
                >
                  <AdminHomepage />
                </AdminPermissionRoute>
              }
            />
            <Route
              path="contacts"
              element={
                <AdminPermissionRoute anyOf={[{ resource: "admin", action: "view" }]}>
                  <AdminContactForms />
                </AdminPermissionRoute>
              }
            />

          </Route>

          <Route path="*" element={<PageNotFound />} />
          <Route path="/product/*" element={<PageNotFound />} />
        </Routes>
      </Provider>
    </ScrollToTop>
    <Toaster />
  </BrowserRouter>
);
