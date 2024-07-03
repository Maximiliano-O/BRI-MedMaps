import React from 'react';
import Globe3D from './Globe3D';
import SearchBar from './SearchBar';
import { useSearchParams } from 'react-router-dom';
import './GlobeView.css';

const GlobeView = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || '';

  return (
    <div id='testing'>
      <div className="header">
        <h1><a href="/">Med Maps</a></h1>
        <div className="search-bar-container">
          <SearchBar initialQuery={query} />      
        </div>
      </div>
      <div className="globe-container">
        <Globe3D query={query} />
      </div>
    </div>
  );
};

export default GlobeView;
