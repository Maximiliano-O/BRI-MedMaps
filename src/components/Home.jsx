import SearchBar from './SearchBar';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div id='testing'>
      <h1><a href="/">Med Maps</a></h1>
      <div className="search-bar-container">
        <SearchBar color="theme" />
      </div>
    </div>
  );
};

export default Home;
