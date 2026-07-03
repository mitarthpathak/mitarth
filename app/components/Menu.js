"use client";

import { useState } from "react";

export default function Menu() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState("main"); // "main" | "contact"

  const toggleMenu = () => {
    if (isOpen) {
      setIsOpen(false);
      // Reset view after animation finishes
      setTimeout(() => setView("main"), 500);
    } else {
      setIsOpen(true);
    }
  };

  const handleHomeClick = (e) => {
    e.stopPropagation();
    window.scrollTo({ top: 0, behavior: "smooth" });
    toggleMenu();
  };

  const handleWorksClick = (e) => {
    e.stopPropagation();
    const target = document.getElementById("projects-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
    toggleMenu();
  };

  const handleContactClick = (e) => {
    e.stopPropagation();
    setView("contact");
  };

  const handleBackClick = (e) => {
    e.stopPropagation();
    setView("main");
  };

  return (
    <div
      className={`menu-wrapper ${isOpen ? "open" : ""} ${view === "contact" ? "contact-open" : ""}`}
      onClick={!isOpen ? toggleMenu : undefined}
    >
      <div className="menu-inner">
        {view === "main" ? (
          <div className="menu-links">
            <span className="menu-link" onClick={handleHomeClick}>HOME</span>
            <span className="menu-link" onClick={handleWorksClick}>WORKS</span>
            <span className="menu-link" onClick={handleContactClick}>CONTACT</span>
          </div>
        ) : (
          <div className="menu-contact-view">
            <h3 className="contact-header">if you wanna contact me (ONLY IF)</h3>
            <ul className="contact-list">
              <li>Email: mpathak6207@gmail.com</li>
              <li>Mobile number: 9587507407</li>
            </ul>
            <button className="contact-back-btn" onClick={handleBackClick}>Back</button>
          </div>
        )}
        <div className="menu-footer" onClick={isOpen ? toggleMenu : undefined}>
          <span className="menu-text">{view === "contact" ? "Contact" : "Menu"}</span>
          <span className="menu-icon">{isOpen ? "×" : "="}</span>
        </div>
      </div>
    </div>
  );
}
