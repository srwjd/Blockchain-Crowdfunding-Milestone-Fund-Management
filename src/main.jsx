import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
class ErrorBoundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>
        <h1>ไม่สามารถแสดงหน้านี้ได้</h1>
        <p>ลองรีเซ็ตข้อมูลสาธิตในเบราว์เซอร์แล้วเปิดใหม่</p>
        <button
          onClick={() => {
            localStorage.removeItem("innovatefund-demo-v1");
            location.hash = "dashboard";
            location.reload();
          }}
        >
          รีเซ็ตข้อมูลสาธิตและโหลดใหม่
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
