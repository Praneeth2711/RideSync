import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FindRides from './pages/FindRides';
import OfferRide from './pages/OfferRide';
import RideDetails from './pages/RideDetails';
import MyRides from './pages/MyRides';
import ManageRequests from './pages/ManageRequests';
import History from './pages/History';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-background text-text-primary">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/find-rides" element={<FindRides />} />
              <Route path="/rides/:id" element={<RideDetails />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/offer-ride"
                element={
                  <ProtectedRoute>
                    <OfferRide />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-rides"
                element={
                  <ProtectedRoute>
                    <MyRides />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-rides/:id/requests"
                element={
                  <ProtectedRoute>
                    <ManageRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <History />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
