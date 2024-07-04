import SearchBar from './SearchBar';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  const handleSearch = (query) => {
    // Redirección a la vista del globo
    navigate(`/globe?query=${encodeURIComponent(query)}`);
  };

  return (
    <div id='testing'>
      <h1><a href="/">Med Maps</a></h1>
      <div className="search-bar-container">
        <SearchBar onSearch={handleSearch} color="theme" />
      </div>
    </div>
  );
};

export default Home;
