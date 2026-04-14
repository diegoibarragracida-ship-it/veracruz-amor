import React from 'react';
import { Link } from 'react-router-dom';

const PrestadorNavbar = () => {
  const handleLogout = () => {
    // Logic for logging out
    console.log("User logged out");
  };

  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <button onClick={handleLogout}>Logout</button>
        </li>
      </ul>
    </nav>
  );
};

export default PrestadorNavbar;