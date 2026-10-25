import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Github, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-border-subtle bg-surface text-text-secondary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-brand-black text-white flex items-center justify-center">
            <Car className="w-4 h-4" />
          </div>
          <span className="text-base font-bold text-brand-black">RideSync</span>
          <span className="text-xs text-text-secondary border-l border-neutral-300 pl-2.5 ml-1">
            Carpool & Ride Sharing Board
          </span>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <Link to="/" className="hover:text-text-primary transition-colors">
            Home
          </Link>
          <Link to="/find-rides" className="hover:text-text-primary transition-colors">
            Find Rides
          </Link>
          <Link to="/offer-ride" className="hover:text-text-primary transition-colors">
            Offer Ride
          </Link>
          <Link to="/history" className="hover:text-text-primary transition-colors">
            Ride History
          </Link>
        </div>

        <div className="text-xs text-text-secondary flex items-center gap-1">
          <span>Academic Demonstration Project</span>
          <span>&copy; {new Date().getFullYear()} RideSync</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
