import React, { useState } from "react";
import { FiSearch } from "react-icons/fi";
import { IconContext } from "react-icons";
import './SearchBar.css';

const SearchBar = ({ onSearch }) => {
  const [input, setInput] = useState("");

  const handleChange = (value) => {
    setInput(value);
  };

  const handleSearch = () => {
    onSearch(input); // Envía el término de búsqueda al componente padre (GlobeView) solo cuando se presiona el botón
  };

  return (
    <div className="search-container">
      <div className='input-wrapper'>
        <IconContext.Provider value={{ color: "gray", size: "1.75em" }}>
          <FiSearch id="search-icon" />
        </IconContext.Provider>
        <input 
          placeholder="Ingrese el medicamento" 
          value={input} 
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>
      <button className='myButton' onClick={handleSearch}>Buscar</button>
    </div>
  );
};

export default SearchBar;
