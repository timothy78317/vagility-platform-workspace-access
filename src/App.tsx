import { Routes, Route, Navigate } from "react-router-dom";
import IdentityPage from "./pages/Identity";
import SessionsPage from "./pages/Sessions";
import DevicesPage from "./pages/Devices";
import PinVerify from "./components/auth/PinVerify";
import NotFound from "./pages/NotFound";
import { LifecycleWrapper } from "./components/layout/LifecycleWrapper";
import "./index.css";

/**
 * Workspace Access Hub
 * 
 * This module is the secure gateway for all platform members.
 * It manages:
 * 1. Identity Verification (PIN)
 * 2. Onboarding Task Execution (User-side)
 * 3. Offboarding Task Execution (User-side)
 * 4. Active Profile & Device Management
 */
function App() {
  return (
    <Routes>
      {/* 
        Secure Lifecycle Management 
        The LifecycleWrapper handles the Security Gates (PIN, Onboarding Checklist) 
        automatically based on the user's current platform status.
      */}
      <Route path="/*" element={
        <LifecycleWrapper>
          <Routes>
            <Route index element={<Navigate to="identity" replace />} />
            <Route path="identity" element={<IdentityPage />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="devices" element={<DevicesPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </LifecycleWrapper>
      } />
    </Routes>
  );
}

export default App;
