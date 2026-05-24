# JASV ITO — Generador de Informes

## Cómo publicar en Netlify

1. Ve a https://app.netlify.com/drop
2. Arrastra esta carpeta completa (jasv-ito/)
3. Copia la URL que aparece (ej: jasv-ito-abc123.netlify.app)

## Estructura de archivos

```
jasv-ito/
├── index.html          ← Página principal
├── css/
│   └── estilos.css     ← Todos los estilos
├── js/
│   ├── global.js       ← Variables globales y navegación
│   ├── portada.js      ← Sección portada
│   ├── documentos.js   ← Estatus documentación
│   ├── proyectos.js    ← Estatus proyectos
│   ├── curvaS.js       ← Control Curva S
│   ├── situacion.js    ← Situación general
│   ├── layout.js       ← Lay Out + Fotografías
│   ├── anexos.js       ← Anexos
│   ├── historial.js    ← Guardar/restaurar estado
│   ├── backup.js       ← Auto-backup a archivo
│   ├── obras.js        ← Sistema de obras e informes
│   ├── ppt.js          ← Generación del PPT
│   ├── preview.js      ← Vista previa del informe
│   ├── ui.js           ← Toast y utilidades UI
│   └── init.js         ← Inicialización
└── assets/
    ├── logo_jasv.txt   ← Logo principal (base64)
    └── logo_pie.txt    ← Logo pie de página (base64)

## Para hacer cambios

Modifica el archivo JS correspondiente a la sección que quieres cambiar,
luego arrastra la carpeta actualizada a Netlify.
