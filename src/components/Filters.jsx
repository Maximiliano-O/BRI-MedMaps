import React, { useState } from 'react';
import './Filters.css';

const CheckboxList  = () => {
  // Initial state with an array of items
  const [items, setItems] = useState([
    { id: 1, text: 'Dolor de cabeza', checked: false },
    { id: 2, text: 'Vomitos', checked: false },
    { id: 3, text: 'Hipoglucemia', checked: false },
    { id: 4, text: 'Toxicidad Renal', checked: false },
  ]);

  // Handler function to update the checked state of an item
  const handleCheckboxChange = (id) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  return (
    <div>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {items.map((item) => (
          <li key={item.id} style={{ marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => handleCheckboxChange(item.id)}
                className="custom-checkbox"
              />
              {item.text}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CheckboxList;