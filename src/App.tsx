import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppProvider } from "./data/AppProvider";
import { AuthGate } from "./features/auth/AuthGate";
import { Signup } from "./features/auth/Signup";
import { AppShell } from "./layout/AppShell";
import { DashboardPage } from "./features/sites/DashboardPage";
import { SchedulePage } from "./features/schedule/SchedulePage";
import { IssuesPage } from "./features/issues/IssuesPage";
import { TeamPage } from "./features/team/TeamPage";
import { ReportPage } from "./features/report/ReportPage";
import { SitesPage } from "./features/assets/SitesPage";
import { SiteDetailPage } from "./features/assets/SiteDetailPage";

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route element={<AuthGate />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/sites" element={<SitesPage />} />
            <Route path="/sites/:siteId" element={<SiteDetailPage />} />
            <Route path="/issues" element={<IssuesPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </AppProvider>
  );
}
