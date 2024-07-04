import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Filters.css';

const Filters = ({ query }) => {
  const [tags, setTags] = useState([]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        if (!query) {
          return;
        }

        const response = await axios.post('http://localhost:9200/posts/_search', {
          size: 0, 
          query: {
            bool: {
              should: [
                {
                  multi_match: {
                    query: query,
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
            tags: {
              terms: { field: "etiquetas" }
            }
          }
        });

        const tagBuckets = response.data.aggregations.tags.buckets;
        const tagList = tagBuckets.map(bucket => ({
          id: bucket.key,
          text: bucket.key,
          count: bucket.doc_count,
          checked: false 
        }));

        setTags(tagList);
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };

    fetchTags();
  }, [query]);

  const handleCheckboxChange = (id) => {
    setTags(prevTags =>
      prevTags.map(tag =>
        tag.id === id ? { ...tag, checked: !tag.checked } : tag
      )
    );
  };

  return (
    <div className="filters-container">
      <h2>Filters</h2>
      <ul className="filters-list">
        {tags.map(tag => (
          <li key={tag.id} className="filter-item">
            <label className="filter-label">
              <input
                type="checkbox"
                checked={tag.checked}
                onChange={() => handleCheckboxChange(tag.id)}
                className="custom-checkbox"
              />
              {tag.text} ({tag.count})
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Filters;
