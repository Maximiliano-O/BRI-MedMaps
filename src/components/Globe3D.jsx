import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { feature } from 'topojson-client';
import { easeCubic } from 'd3-ease';
import axios from 'axios';
import './Globe.css';
import Filters from './Filters';

const globeMaterial = new THREE.MeshBasicMaterial();

const Globe3D = ({ query }) => {
  const globeEl = useRef(null);
  const [landPolygons, setLandPolygons] = useState([]);
  const [hoverD, setHoverD] = useState();
  const [countryFrequencies, setCountryFrequencies] = useState([]);
  const [countryWithMaxFrequency, setCountryWithMaxFrequency] = useState('');

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

    fetchData();

  }, [query]);

  useEffect(() => {
    if (countryFrequencies.length > 0) {
      const maxFrequency = Math.max(...countryFrequencies.map(country => country.value));
      const countryData = countryFrequencies.find(country => country.value === maxFrequency);
  
      if (countryData) {
        setCountryWithMaxFrequency(countryData.name);
      }
    }
  }, [countryFrequencies]);
  
  useEffect(() => {
    console.log('Update de landPolygons');
    if (countryFrequencies.length >= 0 && landPolygons.length >= 0) {
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

      setLandPolygons(prevPolygons => {
        if (JSON.stringify(prevPolygons) !== JSON.stringify(updatedPolygons)) {
          return updatedPolygons;
        }
        return prevPolygons;
      });
    }
  }, [countryFrequencies, landPolygons]);

  useEffect(() => {
    
    if (countryWithMaxFrequency) {
      
      const countryWithMaxFreqDetails = landPolygons.find(
        country => country.properties.name === countryWithMaxFrequency
      );
  
      if (countryWithMaxFreqDetails) {

        let lat = null;
        let lon = null;
  
        // Find appropriate coordinates for the country
        if (countryWithMaxFreqDetails.properties.name === 'France') {
          // Look for coordinates specifically for mainland France
          const franceCoordinates = countryWithMaxFreqDetails.geometry.coordinates;
          if (franceCoordinates && franceCoordinates.length > 0) {
            // Find a centroid point for mainland France
            const centroid = findCentroid(franceCoordinates);
            [lon, lat] = centroid;
          }
        } else {
          // For other countries, use the first point of the first polygon
          const coordinates = countryWithMaxFreqDetails.geometry.coordinates;
          if (coordinates && coordinates.length > 0 && coordinates[0].length > 0) {
            [lon, lat] = coordinates[0][0][0];
          }
        }
  
        console.log('Country with max frequency:', {
          name: countryWithMaxFreqDetails.properties.name,
          lat: lat,
          lon: lon,
        });
  
        if (globeEl.current) {
          globeEl.current.pointOfView({ lat: lat, lng: lon, altitude: 1.4 }, 2000, easeCubic);
        }
      }
    }
  }, [countryWithMaxFrequency, landPolygons]);
  
  // Function to find centroid of coordinates
  function findCentroid(coordinates) {
    let totalLat = 0;
    let totalLon = 0;
    let numPoints = 0;
  
    coordinates.forEach(polygon => {
      polygon.forEach(ring => {
        ring.forEach(point => {
          totalLon += point[0];
          totalLat += point[1];
          numPoints++;
        });
      });
    });
  
    return [totalLon / numPoints, totalLat / numPoints];
  }
  
  

  // Computo de colores
  const getColorByFrequency = (normalizedFreq) => {
    const darkRed = 213;
    const lightness = ((1 - normalizedFreq) * 70) + 20; 
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
          polygonAltitude={d => d === hoverD ? 0.04 : 0.01}
          polygonStrokeColor={() => '#000'}
          polygonCapMaterial={polygon => {
            const normalizedFreq = polygon.properties.normalizedFreq || 0;
            const color = getColorByFrequency(normalizedFreq);
            return new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });
          }}
          polygonSideColor={() => '#000'}
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
