import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { feature } from 'topojson-client';
import axios from 'axios';
import './Globe.css';
import Filters from './Filters';

const globeMaterial = new THREE.MeshBasicMaterial();

const Globe3D = ({ query }) => {
  const globeEl = useRef(null);
  const [landPolygons, setLandPolygons] = useState([]);
  const [hoverD, setHoverD] = useState();
  const [countryFrequencies, setCountryFrequencies] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true); 

  useEffect(() => {
    fetch('/countries.json')
      .then(res => res.json())
      .then(countryTopo => {
        const countries = feature(countryTopo, countryTopo.objects.countries).features;
        setLandPolygons(countries);
      })
      .catch(error => console.error('Error loading country data:', error));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!query) {
        return;
      }

      try {
        const response = await axios.post('http://localhost:9200/posts/_search', {
          size: 10,
          query: {
            bool: {
              should: [
                {
                  multi_match: {
                    query: query || '',
                    fields: ["titulo", "topico"],
                    type: "phrase",
                    slop: 10
                  }
                },
                {
                  nested: {
                    path: "comentarios",
                    query: {
                      multi_match: {
                        query: query,
                        fields: ["comentarios.contenido"],
                        type: "phrase",
                        slop: 10
                      }
                    }
                  }
                }
              ]
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

        setCountryFrequencies(countries);
      } catch (error) {
        console.error('Error searching:', error);
      }
    };

    if (initialLoad || query) {
      fetchData();
      setInitialLoad(false); 
    }
  }, [query, initialLoad]);

  useEffect(() => {
    if (countryFrequencies.length >= 0 && landPolygons.length > 0) {
      const maxFrequency = Math.max(...countryFrequencies.map(country => country.value));

      const updatedPolygons = landPolygons.map(country => {
        const countryData = countryFrequencies.find(c => c.name === country.properties.name);
        const freq = countryData ? countryData.value : 0;
        const normalizedFrequency = freq / maxFrequency;

        return {
          ...country,
          properties: {
            ...country.properties,
            freq: freq,
            normalizedFreq: normalizedFrequency
          }
        };
      });

      setLandPolygons(updatedPolygons);
    }
  }, [query, countryFrequencies]); 

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.pointOfView({ altitude: 1.2 });
    }
  }, []);

  // Computo de colores
  const getColorByFrequency = (normalizedFreq) => {
    const darkRed = 0; 
    const lightness = normalizedFreq * 55; 
    return `hsl(${darkRed}, 100%, ${lightness}%)`;
  };

  const handleQueryChange = (newQuery) => {
    setCountryFrequencies([]); 
    fetchData(newQuery); 
  };

  return (
    <div className="globe-container">
      <div className="filters">
        <Filters query={query} onQueryChange={handleQueryChange} />
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
          polygonCapMaterial={polygon => {
            const normalizedFreq = polygon.properties.normalizedFreq || 0;
            const color = getColorByFrequency(normalizedFreq);
            return new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });
          }}
          polygonSideColor={() => '#D3D3D3'}
          onPolygonHover={setHoverD}
          polygonsTransitionDuration={300}
          polygonLabel={({ properties: d }) => `
            <div class="polygon-label">
              <b>${d.name}:</b> <br />
              Frequency: <i>${d.freq}</i>
            </div>
          `}
        />
      </div>
    </div>
  );
};

export default Globe3D;
