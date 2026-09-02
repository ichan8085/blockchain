import React from "react";
import "./card.css";
import AOS from 'aos';
import 'aos/dist/aos.css';

AOS.init();

function CertificateCard({ title, subtitle, children, className = "" }) {
  return (
    <div className={`cardStyle ${className}`.trim()} data-aos="fade-up" data-aos-duration="1000">
      {title && <h3 className="cardTitle">{title}</h3>}
      {subtitle && <p className="cardSubtitle">{subtitle}</p>}
      <div className="cardBody">{children}</div>
    </div>
  );
}

export default CertificateCard;