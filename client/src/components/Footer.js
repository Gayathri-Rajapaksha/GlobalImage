import React from 'react';
import logo from '../GI_logo.png';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brand">
          <img src={logo} alt="Global Image Logo" className="footer-logo" />
          <span className="footer-brand-name">Global Image</span>
          <div className="footer-tagline">Capturing Your Moments, Creating Memories</div>
        </div>
        <div className="footer-links">
          <div className="footer-link-title">Quick Links</div>
          <a href="/" className="footer-link">Home</a>
          <a href="/about" className="footer-link">About Us</a>
          <a href="/services" className="footer-link">Services</a>
          <a href="/portfolio" className="footer-link">Portfolio</a>
          <a href="/contact" className="footer-link">Contact</a>
        </div>
        <div className="footer-contact">
          <div className="footer-link-title">Contact</div>
          <div className="footer-contact-item"><span role="img" aria-label="Location">📍</span> 171/1/1, EL Senanayake Street, Kandy</div>
          <div className="footer-contact-item"><span role="img" aria-label="Phone">📞</span> 077-7155653</div>
          <div className="footer-contact-item"><span role="img" aria-label="Email">✉️</span> <a href="mailto:globalimagelanka@gmail.com" className="footer-link">globalimagelanka@gmail.com</a></div>
        </div>
        <div className="footer-social">
          <div className="footer-link-title">Follow Us</div>
          <a href="https://facebook.com/yourpage" className="footer-social-icon" aria-label="Facebook" target="_blank" rel="noopener noreferrer">🌐</a>
          <a href="https://instagram.com/yourpage" className="footer-social-icon" aria-label="Instagram" target="_blank" rel="noopener noreferrer">📸</a>
        </div>
      </div>
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} Global Image. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer; 