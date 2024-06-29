import SearchBar from './SearchBar.jsx';
import { useState } from 'react';
import './Home.css';

const Home = () => {
  const [results, setResults] = useState([]);

  return (
    <div id='testing'>
      <h1><a href="/globe">Med Maps</a></h1>
        <div className="search-bar-container">
          <SearchBar setResults={setResults} color="theme"/>
        </div>
    </div>
  );
};

export default Home;
