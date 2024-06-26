import './App.css';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import React from 'react';
import Home from './components/Home';
import GlobeView from './components/GlobeView';

function App() {
  return (
    <Router>
        <Routes>
          <Route path="/" element={<Home/>} />  
          <Route path="/globe" element={<GlobeView/>} />
        </Routes>
    </Router>
  );
}

export default App;
