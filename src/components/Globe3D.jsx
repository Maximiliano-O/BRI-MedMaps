import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { feature } from 'topojson-client';
import { easeCubic } from 'd3-ease';
import axios from 'axios';
import './Globe.css';
import Filters from './Filters';
import DocumentList from './DocumentList.jsx'; 

const globeMaterial = new THREE.MeshBasicMaterial();

const Globe3D = ({ query }) => {
  const globeEl = useRef(null);
  const [landPolygons, setLandPolygons] = useState([]);
  const [hoverD, setHoverD] = useState();
  const [countryFrequencies, setCountryFrequencies] = useState([]);
  const [countryWithMaxFrequency, setCountryWithMaxFrequency] = useState('');
  const [isLegendVisible, setIsLegendVisible] = useState(false);
  const [isInstructionsVisible, setIsInstructionsVisible] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [documentsByCountry, setDocumentsByCountry] = useState({});
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [documentsCountry, setDocumentsCountry] = useState('');

  const toggleLegend = () => {
    setIsLegendVisible(!isLegendVisible);
  };

  const toggleInstructions = () => {
    setIsInstructionsVisible(!isInstructionsVisible)
  };

  useEffect(() => {
    fetch('/countries.json')
      .then(res => res.json())
      .then(countryTopo => {
        const countries = feature(countryTopo, countryTopo.objects.countries).features;
        setLandPolygons(countries);
      })
      .catch(error => console.error('Error loading country data:', error));
  }, []);

  const fetchData = async (mainQuery, selectedTags) => {
    try {
      const shouldQueries = [];
      const filterQueries = [];
  
      // Consulta principal con should
      if (mainQuery) {
        shouldQueries.push({
          multi_match: {
            query: mainQuery || '',
            fields: ["titulo", "topico"],
            type: "phrase",
            slop: 10
          }
        });
  
        shouldQueries.push({
          nested: {
            path: "comentarios",
            query: {
              multi_match: {
                query: mainQuery || '',
                fields: ["comentarios.contenido"],
                type: "phrase",
                slop: 10
              }
            }
          }
        });
      }
  
      // Filtro por tags seleccionados
      if (selectedTags.length > 0) {
        const selectedTagNames = selectedTags.map(tag => tag.text);
        filterQueries.push({
          terms: {
            etiquetas: selectedTagNames
          }
        });
      }
  
      console.log('Consulta final a Elasticsearch:', shouldQueries, filterQueries);
  
      const response = await axios.post('http://localhost:9200/posts/_search', {
        size: 500,
        query: {
          bool: {
            should: shouldQueries,
            minimum_should_match: 1, // Al menos una de las consultas principales debe coincidir
            filter: filterQueries  // Agregar los filtros de tags aquí
          }
        },
        aggs: {
          countries: {
            terms: { field: 'pais' }
          }
        }
      });
  
      console.log('Respuesta de Elasticsearch:', response.data);
  
      const countries = response.data.aggregations.countries.buckets.map(bucket => ({
        name: bucket.key,
        value: bucket.doc_count
      }));
  
      setCountryFrequencies(countries);

      // Guardar los documentos por país
      const docsByCountry = {};
      response.data.hits.hits.forEach(hit => {
        const country = hit._source.pais;
        if (!docsByCountry[country]) {
          docsByCountry[country] = [];
        }
        docsByCountry[country].push(hit._source);
      });
  
      setDocumentsByCountry(docsByCountry);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  // Manejar click en polígono
  const handlePolygonClick = (polygon) => {
    const countryName = polygon.properties.name;
    setDocumentsCountry(countryName);
    const documents = documentsByCountry[countryName] || [];
    console.log('Documentos para', countryName, documents);
    setSelectedDocuments(documents);
    setIsSidebarVisible(true); // Mostrar la barra lateral
  };

  const closeSidebar = () => {
    setIsSidebarVisible(false);
  };
  
  // Función para manejar cambios en selectedTags
  const handleTagsChange = (newTags) => {
    setSelectedTags(newTags); // Actualizar los tags seleccionados en Globe3D
    setCountryFrequencies([]);
    fetchData(query, newTags); // Actualizar la consulta con los nuevos tags
  };
  
  useEffect(() => {
    fetchData(query, selectedTags); // Asegúrate de usar query y selectedTags aquí
  }, [query, selectedTags]);

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
  
        if (countryWithMaxFreqDetails.properties.name === 'France') {
          const franceCoordinates = countryWithMaxFreqDetails.geometry.coordinates;
          if (franceCoordinates && franceCoordinates.length > 0) {
            const centroid = findCentroid(franceCoordinates);
            [lon, lat] = centroid;
          }
        } else {
          const coordinates = countryWithMaxFreqDetails.geometry.coordinates;
          if (coordinates && coordinates.length > 0 && coordinates[0].length > 0) {
            [lon, lat] = coordinates[0][0][0];
          }
        }
        /*
        console.log('Country with max frequency:', {
          name: countryWithMaxFreqDetails.properties.name,
          lat: lat,
          lon: lon,
        });
        */
        if (globeEl.current) {
          globeEl.current.pointOfView({ lat: lat, lng: lon, altitude: 1.4 }, 2000, easeCubic);
        }
      }
    }
  }, [countryWithMaxFrequency, landPolygons]);
  
  // Funcion para el centroide de francia
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

  return (
    <div className="globe-container">
      <div>
        <div className="filters">
          <Filters query={query} onTagsChange={handleTagsChange} />
        </div>
        <div className="dropdown">
          <button onClick={toggleLegend} className='dropdown-button'>
            {isLegendVisible ? 'Hide Legend' : 'Show Legend'}
              </button>
                {isLegendVisible && (
                  <div>
                    <img src="/images/Legend.png" alt="Leyenda del mapa" />
                  </div>
                )}
              <button onClick={toggleInstructions} className='dropdown-button'>
                {isInstructionsVisible ? 'Hide Instructions' : 'Show Instructions'}
                  </button>
                  {isInstructionsVisible && (
                    <div className="instructions">
                      <p>The globe map that displays the info is interactive.</p>
                      <p>The globe updates every time a new query is made.</p>
                      <p>These are the controls:</p>
                      <ul>
                        <li>Hold left click on top of the globe and move the mouse to rotate it</li>
                        <li>Scroll with the mouse wheel on top of the map to adjust zoom</li>
                        <li>Hover with the mouse over a country to display its name and info</li>
                        <li>Click on a country to display the relevant documents</li>
                      </ul>
                    </div>
                  )}
        </div>
      </div>
      
      <div id="globe">
        <Globe
          width={1200}
          height={750}
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
          onPolygonClick={handlePolygonClick}
          polygonsTransitionDuration={300}
          polygonLabel={({ properties: d }) => `
            <div class="polygon-label">
              <b>${d.name}:</b> <br />
              Frequency: <i>${d.freq}</i>
            </div>
          `}
        />
        {isSidebarVisible && (
        <div className="sidebar">
          <button onClick={closeSidebar} className="dropdown-button">Close</button>
          <DocumentList documents={selectedDocuments} country={documentsCountry} />
        </div>
      )}
      </div>
    </div>
  );
};

export default Globe3D;
