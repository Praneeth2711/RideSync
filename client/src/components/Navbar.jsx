import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Car, User, LogOut, PlusCircle, Search, Compass, LayoutDashboard } from 'lucide-react';
import Button from './Button';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-150 ${
      isActive ? 'text-brand-black font-semibold' : 'text-text-secondary hover:text-text-primary'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-md bg-brand-black text-white flex items-center justify-center transition-transform group-hover:scale-105">
            <Car className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-brand-black">
            Ride<span className="font-light">Sync</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7">
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/find-rides" className={navLinkClass}>
            Find Rides
          </NavLink>
          <NavLink to="/offer-ride" className={navLinkClass}>
            Offer Ride
          </NavLink>

          {isAuthenticated && (
            <>
              <NavLink to="/dashboard" className={navLinkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/my-rides" className={navLinkClass}>
                My Rides
              </NavLink>
              <NavLink to="/history" className={navLinkClass}>
                History
              </NavLink>
            </>
          )}
        </nav>

        {/* Desktop Auth Controls */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-2 py-1.5 px-3 rounded-md hover:bg-neutral-100 text-sm font-medium text-text-primary transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-800 flex items-center justify-center text-xs font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="max-w-[120px] truncate">{user?.name}</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                title="Log out"
                className="text-text-secondary hover:text-red-600"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-text-primary hover:bg-neutral-100 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border-subtle bg-white px-4 pt-3 pb-6 space-y-3">
          <NavLink
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-text-primary"
          >
            Home
          </NavLink>
          <NavLink
            to="/find-rides"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-text-primary"
          >
            Find Rides
          </NavLink>
          <NavLink
            to="/offer-ride"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-medium text-text-primary"
          >
            Offer Ride
          </NavLink>

          {isAuthenticated ? (
            <>
              <div className="border-t border-border-subtle pt-3" />
              <NavLink
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-text-primary"
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/my-rides"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-text-primary"
              >
                My Rides
              </NavLink>
              <NavLink
                to="/history"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-text-primary"
              >
                Booking History
              </NavLink>
              <NavLink
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-text-primary"
              >
                Profile ({user?.name})
              </NavLink>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full mt-2"
              >
                Log Out
              </Button>
            </>
          ) : (
            <div className="border-t border-border-subtle pt-3 flex flex-col gap-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  Login
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
