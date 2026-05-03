Documento de Requerimientos Técnicos: PWA Offline-First
​1. Visión General
​Crear una Progressive Web App (PWA) estática para ser hospedada en GitHub Pages. La aplicación debe ser completamente funcional sin conexión a internet, evitar la App Store de Apple y garantizar la soberanía de los datos del usuario mediante respaldos manuales.
​2. Stack Tecnológico
​Frontend: HTML5, CSS3 y JavaScript Vanilla (o React/Next.js según preferencia).
​Gestión Offline: Service Workers con estrategia Cache-First.
​Base de Datos Local: IndexedDB (usando Dexie.js como wrapper para facilitar transacciones).
​Alojamiento: GitHub Pages (requiere soporte HTTPS nativo).
​3. Funcionalidades Core (Checklist para Copilot)
​A. Instalación y PWA (iOS Focus)
​[ ] Generar un archivo manifest.json con display: standalone.
​[ ] Incluir meta-tags específicos para iOS (apple-touch-icon, apple-mobile-web-app-capable).
​[ ] Implementar un Service Worker que cachee los archivos críticos (HTML, JS, CSS) en el evento install.
​B. Persistencia de Datos
​[ ] Configurar una base de datos local con Dexie.js.
​[ ] Implementar la función de "Almacenamiento Persistente" (navigator.storage.persist()) para mitigar la purga automática de iOS.
​C. Sistema de Respaldo Soberano (Bajo Demanda)
​[ ] Botón "Respaldar Datos":
​Extraer todos los registros de IndexedDB.
​Convertirlos a un objeto Blob tipo application/json.
​Disparar una descarga automática para que el usuario guarde el archivo en la app Archivos de su iPhone.
​[ ] Botón "Recuperar Datos":
​Trigger de un <input type="file">.
​Validación y parseo del archivo JSON.
​Limpieza e inserción masiva (bulkAdd) de los datos recuperados en IndexedDB.
​4. Flujo de Trabajo Offline
​El usuario abre la URL en Safari -> Compartir -> Agregar a Inicio.
​La app se abre como una app nativa (sin barras de navegación).
​Todas las acciones de escritura (CRUD) se realizan directamente en el dispositivo.
​Si el usuario borra el caché o cambia de teléfono, utiliza el archivo JSON generado previamente para restaurar su estado.
​5. Ejemplo de Prompts para Copilot
​Si quieres empezar a programar con Copilot, puedes usar estos comandos:
​Para el esqueleto: "Genera un archivo index.html y un manifest.json para una PWA compatible con iOS, incluyendo los iconos de Apple y colores de tema."
​Para el Service Worker: "Escribe un script de Service Worker que use el Cache Storage API para guardar todos los archivos locales y que funcione sin conexión."
​Para la base de datos: "Usa la librería Dexie.js para crear una base de datos local que maneje [X tipo de datos] y crea las funciones para exportar esa base de datos a un archivo JSON descargable."
​Nota para el desarrollo: Al usar GitHub Pages, recuerda que la ruta del manifest.json y el sw.js debe ser relativa a la raíz del repositorio para que no haya errores 404 al cargar los recursos.