import { useState } from "react";
import { NavLink } from "react-router-dom";
import { FaBars, FaTimes, Fa500Px } from "react-icons/fa";
import "./navbar.css";

function Navbar({ label }) {

    const [menuOpen,setMenuOpen]=useState(false);

    return (

        <nav className="navbar">
            <div className="navbarTop">
            <div className="logo">
                <Fa500Px/>
                <h2>{label}</h2>
            </div>

              <button
                  className="menuButton"
                  onClick={()=>setMenuOpen(!menuOpen)}
              >
                  {menuOpen ? <FaTimes/> : <FaBars/>}
              </button>
            </div>
            <div className={`navLinks ${menuOpen ? "active":""}`}>

                <NavLink to="/" onClick={()=>setMenuOpen(false)} className={({ isActive }) =>
                    isActive ? "activeLink" : ""
                  }>
                    Verifikasi Data
                </NavLink>

                <NavLink to="/operator" onClick={()=>setMenuOpen(false)} className={({ isActive }) =>
                    isActive ? "activeLink" : ""
                  }>
                    Operator
                </NavLink>

                <NavLink to="/list" onClick={()=>setMenuOpen(false)} className={({ isActive }) =>
                    isActive ? "activeLink" : ""
                  }>
                    Daftar Data
                </NavLink>

            </div>

        </nav>

    );
}

export default Navbar;