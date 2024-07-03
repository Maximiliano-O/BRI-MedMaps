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

  useEffect(() => {
    // Fetch country boundaries
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
        // Request to Elasticsearch to get frequency per country and tags
        const response = await axios.post('http://localhost:9200/posts/_search', {
          size: 10,
          query: {
            bool: {
              should: [
                {
                  multi_match: {
                    query: query,
                    fields: ["titulo", "topico", "etiquetas"],
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
            },
            tags: {
              terms: {
                field: "etiquetas"
              }
            }
          }
        });

        const countries = response.data.aggregations.countries.buckets.map(bucket => ({
          name: bucket.key,
          value: bucket.doc_count
        }));

        // Calculate max frequency
        const maxFrequency = Math.max(...countries.map(country => country.value));

        // Update landPolygons with frequency data
        const updatedPolygons = landPolygons.map(country => {
          const countryData = countries.find(c => c.name === country.properties.name);
          const freq = countryData ? countryData.value : 0;
          const normalizedFrequency = freq / maxFrequency;

          return {
            ...country,
            properties: {
              ...country.properties,
              freq: freq,
              normalizedFreq: normalizedFrequency // Store normalized frequency
            }
          };
        });

        setLandPolygons(updatedPolygons);
      } catch (error) {
        console.error('Error searching:', error);
      }
    };

    fetchData();
  }, [query]); // Dependency array only includes 'query'

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.pointOfView({ altitude: 1.2 });
    }
  }, []);

  // Function to calculate color based on normalized frequency
  const getColorByFrequency = (normalizedFreq) => {
    const darkRed = 0; // Hue for dark red
    const lightness =  normalizedFreq * 55; // Lightness decreases as frequency decreases
    return `hsl(${darkRed}, 100%, ${lightness}%)`;
  };

  return (
    <div className="globe-container">
      <div className="filters">
        <Filters query={query}/>
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
        />
      </div>
    </div>
  );
};

export default Globe3D;
