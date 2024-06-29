import React, { useState } from 'react';
import Globe3D from './Globe3D';
import SearchBar from './SearchBar';
import './GlobeView.css';

const GlobeView = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (term) => {
    setSearchTerm(term); // Actualiza el término de búsqueda cuando se presiona el botón
  };

  return (
    <div id='testing'>
      <h1><a href="/">Med Maps</a></h1>
      <div className='align'>
        <div className="search-bar-container">
          <SearchBar onSearch={handleSearch} />      
        </div>
      </div>
      <Globe3D searchTerm={searchTerm} /> {/* Pasar el término de búsqueda al componente del globo */}
    </div>
  );
};

export default GlobeView;
