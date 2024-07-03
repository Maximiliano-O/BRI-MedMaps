import React, { useState, useEffect } from "react";
import { FiSearch } from "react-icons/fi";
import { IconContext } from "react-icons";
import { useNavigate } from "react-router-dom";
import './SearchBar.css';

const SearchBar = ({ initialQuery }) => {
  const [input, setInput] = useState(initialQuery || "");

  const navigate = useNavigate();

  const handleChange = (value) => {
    setInput(value);
  };

  const handleSearch = () => {
    navigate(`/globe?query=${input}`);
  };

  return (
    <div className="search-container">
      <div className='input-wrapper'>
        <IconContext.Provider value={{ color: "gray", size: "1.75em" }}>
          <FiSearch id="search-icon" />
        </IconContext.Provider>
        <input 
          placeholder="Type your query" 
          value={input} 
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>
      <button className='myButton' onClick={handleSearch}>Search</button>
    </div>
  );
};

export default SearchBar;
