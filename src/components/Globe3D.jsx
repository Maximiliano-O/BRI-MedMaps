import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { feature } from 'topojson-client';
import './Globe.css';
import Filters from './Filters';

const polygonsMaterial = new THREE.MeshLambertMaterial({ color: 'black', side: THREE.DoubleSide });
const globeMaterial = new THREE.MeshBasicMaterial();

const Globe3D = () => {
  const globeEl = useRef(null);
  const [landPolygons, setLandPolygons] = useState([]);
  const [hoverD, setHoverD] = useState();
  

  useEffect(() => {
    // Fetch country boundaries
    fetch('/countries.json')
      .then(res => res.json())
      .then(countryTopo => {
        const countries = feature(countryTopo, countryTopo.objects.countries).features;
        setLandPolygons(countries); // Set the countries as the land polygons
      })
      .catch(error => console.error('Error loading country data:', error));
  }, []);

  useEffect(() => {
    // Ensure globeEl.current is defined before accessing pointOfView
    if (globeEl.current) {
      globeEl.current.pointOfView({ altitude: 1.2 }); // Set initial altitude
    }
  }, []);

  return (
    <div className="globe-container">
      <div className="filters">
        <h2>Filters</h2>
          <Filters />
      </div>
      <div id="globe">
        <Globe
          width={1200}
          height={900}
          ref={globeEl}
          backgroundColor="rgba(0,0,0,0)"

          showGlobe={true}
          globeMaterial={globeMaterial}
          //globeImageUrl={bg2}
          //backgroundImageUrl={bg2}

          showAtmosphere={true}
          atmosphereColor="black"
          atmosphereAltitude={0.03}

          polygonsData={landPolygons}
          polygonAltitude={d => d === hoverD ? 0.034 : 0.007}
          polygonStrokeColor={() => '#D3D3D3'}
          polygonCapMaterial={polygonsMaterial}
          polygonSideColor={() => '#D3D3D3'}

          onPolygonHover={setHoverD}
          polygonsTransitionDuration={300}
        />
      </div>
    </div>
  );
};

ReactDOM.render(<Globe3D />, document.getElementById('root'));

export default Globe3D;
