import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout.tsx";
import Home from "./pages/Home";
import UserSession from "./pages/UserSession";
import Sales from "./pages/Sales";
import Vouchers from "./pages/Vouchers";
import Network from "./pages/Network";
import Reset from "./pages/Reset";

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/sessions" element={<UserSession />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/vouchers" element={<Vouchers />} />
        <Route path="/network" element={<Network />} />
        <Route path="/reset" element={<Reset />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
