import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            &copy; {currentYear} Simple &amp; Plain AI by Nedex Education. Designed and created by Zoran Nedelkovski.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link to="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
            <Link to="/refund" className="hover:text-gray-600 transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
