import React from 'react';

const HotelCard = ({ hotel }) => {
    return (
        <div className="hotel-card">
            <h2>{hotel.name}</h2>
            <p>{hotel.description}</p>
            <p>Price: ${hotel.price}</p>
        </div>
    );
};

export default HotelCard;