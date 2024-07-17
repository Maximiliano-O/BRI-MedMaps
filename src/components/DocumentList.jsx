import React, { useState } from 'react';
import './DocumentList.css'; // Importa tu archivo de estilos CSS para DocumentList

const DocumentList = ({ documents, country }) => {
  const [expandedDoc, setExpandedDoc] = useState(null);

  const toggleExpand = (index) => {
    setExpandedDoc(expandedDoc === index ? null : index);
  };

  return (
    <div className="document-list-container">
      <h3>Documents of {country}</h3>
      {documents.length > 0 ? (
        <div className="document-cards">
          {documents.map((doc, index) => (
            <div className="document-card" key={index} onClick={() => toggleExpand(index)}>
              <p><strong>Title:</strong> {doc.titulo}</p>
              <p><strong>Country:</strong> {doc.pais}</p>
              {expandedDoc === index && (
                <>
                  <p><strong>Topic:</strong> {doc.topico}</p>
                  <p><strong>Tags:</strong> {doc.etiquetas.join(', ')}</p>
                  <div className="comments">
                    <h4>Comments:</h4>
                    {doc.comentarios && doc.comentarios.length > 0 ? (
                      <ul>
                        {doc.comentarios.map((comment, idx) => (
                          <li key={idx}>
                            <hr className="comment-divider" />
                            <p><strong>Country:</strong> {comment.pais}</p>
                            <p><strong>Content:</strong> {comment.contenido}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>There are no comments for this post.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>No posts found for this country.</p>
      )}
    </div>
  );
};

export default DocumentList;
