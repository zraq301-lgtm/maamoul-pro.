import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import LoginPage from "./LoginPage.jsx";
import "./index.css";
import "./App.css";

// مكوّن حماية المسارات
const ProtectedRoute = ({ children }) => {
  // التحقق من حالة تسجيل الدخول
  const isAuthenticated = localStorage.getItem("sb-access-token");
  
  if (!isAuthenticated) {
    // إذا لم يكن مسجلاً، نرسله لصفحة الدخول
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// استخدام createRoot بشكل سليم
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("لم يتم العثور على عنصر root في ملف index.html");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* مسار تسجيل الدخول */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* المسارات المحمية */}
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          } 
        />
        
        {/* إعادة توجيه أي مسار غير موجود للرئيسية */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
