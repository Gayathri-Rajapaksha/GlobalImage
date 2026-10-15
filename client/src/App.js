import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Portfolio from './pages/Portfolio';
import EventGallery from './pages/EventGallery';
import Booking from './pages/Booking';
import Contact from './pages/Contact';
import Team from './pages/Team';
import SignIn from './pages/SignIn';
import Register from './pages/Register';
import ServiceDetail from './pages/ServiceDetail';
import AdminDashboard from './pages/AdminDashboard';
import Feedback from './pages/Feedback';
import Staff from './pages/Staff';
import Client from './pages/Client';
import PortfolioAdmin from './pages/PortfolioAdmin';
import ServicesAdmin from './pages/ServicesAdmin';
import BookingsAdmin from './pages/BookingsAdmin';
import StaffAdmin from './pages/StaffAdmin';
import AllStaff from './pages/AllStaff';
import Profile from './pages/Profile';
import ClientsAdmin from './pages/ClientsAdmin';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import FeedbackAdmin from './pages/FeedbackAdmin';
import GalleryManagement from './pages/GalleryManagement';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/event-gallery/:id" element={<EventGallery />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/team" element={<Team />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/register" element={<Register />} />
          <Route path="/service/:id" element={<ServiceDetail />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/client" element={<Client />} />
          <Route path="/admin/portfolio" element={<PortfolioAdmin />} />
          <Route path="/admin/services" element={<ServicesAdmin />} />
                              <Route path="/admin/bookings" element={<BookingsAdmin />} />
                    <Route path="/admin/staff" element={<StaffAdmin />} />
                    <Route path="/admin/clients" element={<ClientsAdmin />} />
                    <Route path="/all-staff" element={<AllStaff />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/admin/feedback" element={<FeedbackAdmin />} />
                    <Route path="/gallery-management" element={<GalleryManagement />} />
                    {/* Add more routes here for other pages */}
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
