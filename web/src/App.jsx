import { Routes, Route } from 'react-router-dom';
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { EchoProvider } from "./contexts/EchoContext";
import Login from './pages/Login';
import Register from './pages/Register';
import PharmacistLayout from './Pharmacist/PharmacistLayout';
import DashboardContent from './Pharmacist/Dashboard';
import NotificationsPage from './Pharmacist/NotificationsPage';
import RequestsPage from './Pharmacist/RequestsPage';
import OrdersPage from './Pharmacist/OrdersPage';
import AddDrugPage from './Pharmacist/AddDrugPage';
import AddPharmacyPage from './Pharmacist/AddPharmacyPage';
import EditPharmacyPage from './Pharmacist/EditPharmacyPage';
import StockManagement from './Pharmacist/StockManagement';
import EmployeesPage from './Pharmacist/EmployeesPage';
import AnalyticsPage from './Pharmacist/AnalyticsPage';
import SettingsPage from './Pharmacist/SettingsPage';
import MedicationsPage from './Pharmacist/MedicationsPage';
import PharmacySearchPage from './Pharmacist/PharmacySearchPage';
import ProtectedRoute from './components/ProtectedRoute';
import 'leaflet/dist/leaflet.css';

function App() {
  return (
    <AuthProvider>
      <EchoProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/Dashboard" element={<PharmacistLayout />}>
          <Route index element={<DashboardContent />} />
          <Route path="Notifications" element={<NotificationsPage />} />
          <Route path="Requests" element={<ProtectedRoute requiredPermissions={['orders_process']}><RequestsPage /></ProtectedRoute>} />
          <Route path="Orders" element={<ProtectedRoute requiredPermissions={['orders_process']}><OrdersPage /></ProtectedRoute>} />
          <Route path="AddDrugPage" element={<AddDrugPage />} />
          <Route path="AddPharmacy" element={<ProtectedRoute requiredPermissions={['pharmacy_manage']}><AddPharmacyPage /></ProtectedRoute>} />
          <Route path="EditPharmacy" element={<ProtectedRoute requiredPermissions={['pharmacy_manage', 'operating_hours_manage']}><EditPharmacyPage /></ProtectedRoute>} />
          <Route path="FindPharmacy" element={<PharmacySearchPage />} />
          <Route path="StockManagement" element={<ProtectedRoute requiredPermissions={['inventory_manage']}><StockManagement /></ProtectedRoute>} />
          <Route path="Employees" element={<ProtectedRoute requiredPermissions={['pharmacy_manage']}><EmployeesPage /></ProtectedRoute>} />
          <Route path="AnalyticsPage" element={<ProtectedRoute requiredPermissions={[]}><AnalyticsPage /></ProtectedRoute>} />
          <Route path="Settings" element={<SettingsPage />} />
          <Route path="Medications" element={<MedicationsPage />} />
        </Route>
      </Routes>
      </EchoProvider>
    </AuthProvider>
  );
}

export default App;
