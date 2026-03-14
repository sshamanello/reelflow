import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Toast from "./Toast";
import { useToast } from "../hooks/useToast";
import { createContext, useContext } from "react";

const ToastContext = createContext(null);

export function useAppToast() {
  return useContext(ToastContext);
}

export default function Layout() {
  const toast = useToast();

  return (
    <ToastContext.Provider value={toast}>
      <div className="app-shell">
        <Sidebar />

        <div className="content-wrap">
          <main className="content">
            <Outlet />
          </main>
        </div>

        <Toast message={toast.message} />
      </div>
    </ToastContext.Provider>
  );
}
