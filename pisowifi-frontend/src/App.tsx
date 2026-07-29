import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import UserSession from "./pages/UserSession";
import Sales from "./pages/Sales";
import Vouchers from "./pages/Vouchers";
import Network from "./pages/Network";
import Reset from "./pages/Reset";
import Portal from "./pages/Portal";
import CoinSimulator from "./components/CoinSimulator";   // ← added

export default function App() {
  return (
    <AuthProvider>
      <CoinSimulator />                                   {/* ← added */}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/portal" element={<Portal />} />

        {/* Everything below requires a signed-in user */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/sessions" element={<UserSession />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/vouchers" element={<Vouchers />} />
            <Route path="/network" element={<Network />} />
            <Route path="/reset" element={<Reset />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}