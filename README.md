# BRI-MedMaps
 Proyecto de búsqueda y recuperación de información, es un motor de búsqueda de efectos secundarios de medicamentos, el cual presenta la información como un mapa coroplético en 3d.

 Para correr el proyecto, se requiere:
 - Tener instalado elasticsearch o docker en su defecto para montar un contenedor de elasticsearch
 - Contar con npm
 - Postman o curl

 Instrucciones:
 - Primero es necesario cargar los datos, para esto se debe iniciar elastic en el puerto 9200, definir el índice "posts"
 y cargar los contenidos del documento "MedMapsData.json" que se encuentra en la carpeta "ElasticData"

 Se pueden correr los comandos siguientes desde visual studio code, o consola de elección estando en la carpeta "ElasticData":

    - Inicialización de índice, copiar los contenidos del archivo "Mapping.json" y hacer una consulta del tipo PUT a 
    localhost:9200, con curl: curl.exe -X PUT -H "Content-Type: application/json" --data-binary "@Mapping.json" "http://localhost:9200/posts"

    - En caso de querer limpiar el índice y cargar otros datos: curl.exe -X DELETE "http://localhost:9200/posts"

    - Para cargar los datos: curl.exe -X POST -H "Content-Type: application/json" --data-binary "@MedMapsData.json" "http://localhost:9200/posts/_bulk"

- Luego para correr el proyecto:
    
    - Comando "npm install" en la terminal de visual studio code o ide de elección.
    - Comando "npm run dev"

- Por último apretar en el link que dispone visual, el cual debe ser "localhost:5173"


