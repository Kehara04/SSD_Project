import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import RegisterPatient from "./pages/RegisterPatient";
import RegisterDoctor from "./pages/RegisterDoctor";
import RegisterAdmin from "./pages/RegisterAdmin";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import DoctorDirectory from "./pages/DoctorDirectory";
import PatientAppointments from "./pages/PatientAppointments";
import DoctorAppointments from "./pages/DoctorAppointments";
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import TelemedicinePage from "./pages/TelemedicinePage";
import AppointmentPrescriptions from "./pages/AppointmentPrescriptions";
import PatientPrescriptions from "./pages/PatientPrescriptions";
import DoctorPrescriptions from "./pages/DoctorPrescriptions";
import AdminAppointments from "./pages/AdminAppointments";
import AdminPayments from "./pages/AdminPayments";
import AdminUsers from "./pages/AdminUsers";
import NotFound from "./pages/NotFound";
import SymptomChecker from "./pages/SymptomChecker";
import GoogleAuthSuccess from "./pages/GoogleAuthSuccess";

import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/google/success" element={<GoogleAuthSuccess />}/>
      <Route path="/register/patient" element={<RegisterPatient />} />
      <Route path="/register/doctor" element={<RegisterDoctor />} />
      <Route path="/register/admin" element={<RegisterAdmin />} />
      <Route path="/doctors" element={<DoctorDirectory />} />

      <Route
        path="/patient"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["patient"]}>
              <PatientDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["doctor"]}>
              <DoctorDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/appointments"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["admin"]}>
              <AdminAppointments />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/payments"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["admin"]}>
              <AdminPayments />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["admin"]}>
              <AdminUsers />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/appointments"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["patient"]}>
              <PatientAppointments />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/symptom-checker"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["patient"]}>
              <SymptomChecker />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/appointments"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["doctor"]}>
              <DoctorAppointments />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/prescriptions"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["doctor"]}>
              <DoctorPrescriptions />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/prescriptions/appointment/:appointmentId"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["doctor"]}>
              <AppointmentPrescriptions />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/prescriptions"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["patient"]}>
              <PatientPrescriptions />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment/:appointmentId"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["patient"]}>
              <PaymentPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment/success"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["patient"]}>
              <PaymentSuccess />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment/cancel"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["patient"]}>
              <PaymentCancel />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/telemedicine/:appointmentId"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["patient"]}>
              <TelemedicinePage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/telemedicine/:appointmentId"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["doctor"]}>
              <TelemedicinePage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;