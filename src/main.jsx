import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import LoginPage from "./LoginPage.jsx";
import "./index.css";
import "./App.css";

// دالة بسيطة للتأكد من حالة تسجيل الدخول (يمكنك تطويرها لاحقاً)
const ProtectedRoute = ({ children }) => {
  // هنا ستتحقق من Supabase إذا كان المستخدم مسجلاً
  const isAuthenticated = localStorage.getItem("sb-access-token"); // مثال بسيط
  return isAuthenticated ? children : <Navigate to="/login" />;
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
