// src/components/common/ClientToaster.tsx
"use client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ClientToaster() {
    return (
        <ToastContainer
            containerId="app-toaster"   // <-- name the container
            position="top-right"
            autoClose={2500}
            limit={2}                  // optional: at most 2 visible
            newestOnTop
            closeOnClick
            pauseOnHover
            draggable
            style={{ zIndex: 10000 }}
            theme="light"
        />
    );
}
