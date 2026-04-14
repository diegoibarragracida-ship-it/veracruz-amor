import React from 'react';
import { NavLink } from 'react-router-dom';

const PrestadorDashboardNav = () => {
    return (
        <nav className="navbar">
            <ul className="navbar-list">
                <li>
                    <NavLink to="/home" className="navbar-item">Home</NavLink>
                </li>
                <li>
                    <NavLink to="/logout" className="navbar-item">Logout</NavLink>
                </li>
            </ul>
        </nav>
    );
};

export default PrestadorDashboardNav;