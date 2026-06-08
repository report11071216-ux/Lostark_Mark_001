import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppProvider } from "./data/AppProvider";
import { AuthGate } from "./features/auth/AuthGate";
import { AppShell } from "./layout/AppShell";
import { DashboardPage } from "./features/sites/DashboardPage";
import { SchedulePage } from "./features/schedule/SchedulePage";
import { IssuesPage } from "./features/issues/IssuesPage";

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route element={<AuthGate />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/issues" element={<IssuesPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </AppProvider>
  );
}
