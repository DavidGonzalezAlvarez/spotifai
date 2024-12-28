# SpotifAI

## Descripción del proyecto

**SpotifAI** es una aplicación que, mediante inteligencia artificial, te hace recomendaciones de música basadas en tus gustos de Spotify. La información ha sido obtenida de la página web [SpotifyCharts](https://charts.spotify.com/charts/view/regional-global-weekly/latest).

## Objetivos

El proyecto de **SpotifAI** tiene como principal objetivo facilitar a las personas el descubrimiento de música nueva que les pueda interesar. Por eso, me he centrado en crear una interfaz agradable y en añadir funcionalidades útiles para los usuarios.

### Componentes principales

1. **Frontend:**
   - Desarrollado en React con la ayuda de Bootstrap para la maquetación.

2. **Backend:**
   - Desarrollado en Express.

3. **Base de datos:**
   - Utiliza una base de datos principal en Neo4j para la relación de canciones y artistas, y una base de datos MariaDB para almacenar información detallada de las canciones en el futuro.

4. **Contenerización:**
   - Tanto el servidor web como las bases de datos están montados en Docker con comunicación entre contenedores.

## Instrucciones de instalación y despliegue

### Configuración del entorno

Antes de empezar, crea un archivo `.env` en la carpeta `app-web` con las variables de entorno configuradas:

```env
CLIENT_ID=dd045003585f48d990cc0dd0324d35f7
REDIRECT_URI=http://localhost:8888/callback
CLIENT_SECRET=646c374313f641d2a01ffb5c499e6125
PORT=3000
EXPRESS_PORT=8888
NEO4J_URL=bolt://neo4j-container:7687
NEO4J_USER=neo4j
NEO4J_PASS=password
REACT_APP_SERVER_URL=http://localhost:8888

```

### Pasos para configurar y desplegar

#### 1. Clonar el repositorio

Clona el repositorio del proyecto:

```bash
git clone https://github.com/spotifai
cd spotifai
```

#### 2. Configurar el archivo .env

Entra en la carpeta app-web y configura el archivo .env

```bash
cd app-web
```

#### 3. Iniciar la aplicación

Utiliza Docker Compose para levantar los contenedores, desde dentro de la carpeta de dockerizacion.

```bash
cd dockerization
docker-compose up -d
```

Esto iniciará los contenedores necesarios.

#### 4. Probar la aplicación

Con estos pasos ya deberia funcionar la aplicacion, ve al navegador y accede a la ruta `http://localhost:3000/`

## Video demostrativo

Por si no funciona la aplicacion después de intentar desplegarla hay un video en el que se explica todo el funcionamiento de la aplicación.
