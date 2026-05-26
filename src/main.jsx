import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./LoginPage.jsx";
import "./index.css";
import "./App.css";

// استخدام createRoot بشكل سليم
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("لم يتم العثور على عنصر root في ملف index.html");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* صفحة تسجيل الدخول هي المسار الرئيسي الآن */}
        <Route path="/" element={<LoginPage />} />
        
        {/* أي مسار آخر يتم توجيهه لصفحة الدخول */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
