import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./LoginPage.jsx";
import App from "./App"; // هذا هو تطبيقك الرئيسي
import ProtectedRoute from "./ProtectedRoute";
import "./index.css";
import "./App.css";

// استخدام createRoot بشكل سليم
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("لم يتم العثور على عنصر root في ملف index.html");

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* حماية المسار الرئيسي */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          } 
        />
        
        {/* أي مسار آخر يتم توجيهه لصفحة الدخول */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
