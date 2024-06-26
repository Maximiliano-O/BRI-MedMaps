import Globe3D from './Globe3D';
import { SearchBar } from './SearchBar.jsx';
import { SearchResultsList } from './SearchResultsList.jsx'
import { useState } from 'react';
import './GlobeView.css';

const GlobeView = () => {
  const [results, setResults] = useState([]);
    return (
      <div id='testing'>
        <h1> <a href="/">Med Maps</a></h1>
          <div className='align'>
            <div className="search-bar-container">
              <SearchBar setResults={setResults} color="theme"/>
              <SearchResultsList results={results}/>        
            </div>
          </div>
          <Globe3D/>
      </div>
    );
  };
  
  export default GlobeView;
  