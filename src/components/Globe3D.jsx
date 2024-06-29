import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { feature } from 'topojson-client';
import axios from 'axios'; // Importar axios para realizar solicitudes HTTP
import './Globe.css';
import Filters from './Filters';

const polygonsMaterial = new THREE.MeshLambertMaterial({ color: 'black', side: THREE.DoubleSide });
const globeMaterial = new THREE.MeshBasicMaterial();

const Globe3D = ({ searchTerm }) => {
  const globeEl = useRef(null);
  const [landPolygons, setLandPolygons] = useState([]);
  const [hoverD, setHoverD] = useState();

  useEffect(() => {
    // Fetch country boundaries
    fetch('/countries.json')
      .then(res => res.json())
      .then(countryTopo => {
        const countries = feature(countryTopo, countryTopo.objects.countries).features;
        setLandPolygons(countries); // Establecer los países como polígonos de tierra
      })
      .catch(error => console.error('Error loading country data:', error));
  }, []);

  useEffect(() => {
    // Asegurar que globeEl.current esté definido antes de acceder a pointOfView
    if (globeEl.current) {
      globeEl.current.pointOfView({ altitude: 1.2 }); // Establecer la altitud inicial
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!searchTerm) {
        return;
      }

      try {
        // Realizar la solicitud a Elasticsearch para obtener la frecuencia por país
        const response = await axios.post('http://localhost:9200/posts/_search', {
          size: 0,
          query: {
            match: { 
              titulo: searchTerm 
            }
          },
          aggs: {
            countries: {
              terms: { field: 'pais' }
            }
          }
        });

        const countries = response.data.aggregations.countries.buckets.map(bucket => ({
          name: bucket.key,
          value: bucket.doc_count
        }));

        // Actualizar landPolygons con los datos de frecuencia por país
        const updatedPolygons = landPolygons.map(country => {
          const countryData = countries.find(c => c.name === country.properties.name);
          return {
            ...country,
            properties: {
              ...country.properties,
              freq: countryData ? countryData.value : 0 // Asignar la frecuencia o 0 si no hay datos
            }
          };
        });

        setLandPolygons(updatedPolygons);
      } catch (error) {
        console.error('Error searching:', error);
      }
    };

    fetchData();
  }, [searchTerm]); // Dependencia solo incluye searchTerm para actualizar

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

export default Globe3D;
