import React, { useState } from "react";
import { FiSearch } from "react-icons/fi";
import { IconContext } from "react-icons";
import './SearchBar.css';

export const SearchBar = ({ setResults }) => {
  const [input, setInput] = useState("");

  const fetchData = (value) => {
    fetch("https://jsonplaceholder.typicode.com/users")
      .then((response) => response.json())
      .then((json) => {
        const results = json.filter((user) => {
          return (
            value &&
            user && 
            user.name && 
            user.name.toLowerCase().includes(value)
          );
        });
        setResults(results);
      });
  };

  const handleChange = (value) => {
    setInput(value);
    fetchData(value);
  }

  return (
    <div className="search-container">
      <div className='input-wrapper'>
        <IconContext.Provider value={{color:"gray", size:"1.75em"}}>
          <FiSearch id="search-icon" />
        </IconContext.Provider>
        <input 
          placeholder="Ingrese el medicamento" 
          value={input} 
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>
      <button className='myButton'>Buscar</button>
    </div>
  );
};
