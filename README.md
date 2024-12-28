# SpotifAI

## Descripción del proyecto

**SpotifAI** es una aplicacion que mediante inteligencia artificial te hace recomendaciones de musica basadas en tu gusto de Spotify. La informacion ha sido obtenida de la pagina web [SpotifyCharts](https://charts.spotify.com/charts/view/regional-global-weekly/latest)

## Objetivos

El proyecto de **SpotifAI** tiene como principal objetivo el facilitar a las personas a la hora de conocer musica nueva que les pueda llegar a interesar. Por eso me he centrado en hacer una interfaz agradable y  

- Desarrollar una aplicación móvil intuitiva y fácil de usar, con una interfaz moderna basada en Jetpack Compose y Material Design 3.
- Implementar un sistema de alertas en tiempo real para notificar a los usuarios sobre la proximidad de radares.
- Integrar un mapa interactivo que permita a los conductores visualizar radares y su ubicación exacta.
- Permitir la conexión automática con el vehículo mediante Bluetooth para activar notificaciones de forma sencilla.
- Asegurar la fiabilidad y disponibilidad de los datos mediante una arquitectura backend robusta y una base de datos actualizada.

## Arquitectura del sistema

El sistema **Speedshield** está diseñado con una arquitectura moderna que combina tecnologías robustas y prácticas de desarrollo eficientes para garantizar su fiabilidad, escalabilidad y facilidad de mantenimiento.

### Componentes principales

1. **Frontend:**

   - Desarrollado en **Kotlin** utilizando **Jetpack Compose** para construir una interfaz de usuario moderna y reactiva.
   - Basado en la arquitectura **MVVM** (Model-View-ViewModel) para un manejo eficiente del estado y la separación de responsabilidades.
   - **Mapbox** como biblioteca para mostrar mapas personalizables.

2. **Backend:**

   - Construido con **Go** y el framework **Echo**, proporcionando una API REST rápida y escalable.
   - Incluye un sistema de autenticación basado en **JWT** (JSON Web Tokens) y **Refresh Tokens**.
   - **sqlc** para generar código Go a partir de consultas SQL, facilitando la interacción con la base de datos.

3. **Base de datos:**

   - Utiliza **PostgreSQL** para almacenar los datos de radares, usuarios, alertas...

4. **Contenerización:**

   - Toda la API y la base de datos está contenida utilizando **Docker** y gestionada con **Docker Compose**, lo que facilita la configuración y el despliegue en diferentes entornos.

## Instrucciones de instalación y despliegue

Este apartado describe los pasos necesarios para configurar y poner en funcionamiento el sistema **Speedshield** en un entorno de producción. Se utilizará Docker Compose para desplegar el backend y la base de datos, y Android Studio para compilar y ejecutar la aplicación móvil.

### Requisitos previos

Antes de comenzar, asegúrate de tener instaladas las siguientes herramientas:

- **Docker**: [Instalar Docker](https://docs.docker.com/get-docker/)
- **Docker Compose**: Incluido en las versiones modernas de Docker.
- **Android Studio**: [Descargar Android Studio](https://developer.android.com/studio)
- **Git**: Para clonar el repositorio del proyecto.

### Configuración del entorno

Es necesario contar con un archivo `.env` en el directorio raíz con las siguientes variables de entorno configuradas (cambiar la variable `JWT_SECRET` por un valor aleatorio):

```env
API_PORT=8080
JWT_SECRET=0b14207211658c23fbde8323110721e3909b49e7fc1f8d28d947cff029dbsd02
DB_HOST=db
DB_PORT=5432
DB_USER=speedshield
DB_PASSWORD=speedshield
DB_NAME=speedshield
```

### Pasos para configurar y desplegar

#### 1. Clonar el repositorio

Clona el repositorio del proyecto en tu máquina local:

```bash
git clone https://github.com/tu-repositorio/speedshield.git
cd speedshield
```

#### 2. Configurar el archivo .env

Copia el archivo `.env.example` a `.env` y modifica las variables de entorno según sea necesario.

```bash
cp .env.example .env
```

#### 3. Iniciar el backend y la base de datos

Utiliza Docker Compose para levantar los servicios del backend y la base de datos:

```bash
docker-compose up --build -d
```

Esto iniciará los contenedores necesarios para el backend y la base de datos.

#### 4. Configurar la aplicación móvil

Abre el proyecto móvil en Android Studio.
Modifica el archivo `NetworkConstants.kt` para que apunte a la IP del backend en funcionamiento:

```kotlin
package com.dmarts05.speedshield.util

object NetworkConstants {
    const val BASE_URL = "http://<IP_DEL_SERVIDOR>:8080/"
    const val TIMEOUT_DURATION_SECONDS = 30L
}
```

Reemplaza `<IP_DEL_SERVIDOR>` con la dirección IP donde está funcionando la API.

#### 5. Compilar y ejecutar la aplicación móvil

Conecta un dispositivo Android o utiliza un emulador en Android Studio.
Compila y ejecuta la aplicación desde el IDE.

#### 6. Probar la aplicación

Con estos pasos, deberías tener el sistema Speedshield completamente funcional.

## Documentación de la API

Una vez que la API esté iniciada con Docker, podrás acceder a su documentación interactiva a través de Swagger en la siguiente ruta: `http://<IP_DEL_SERVIDOR>:8080/swagger/index.html`

Recuerda reemplazar `<IP_DEL_SERVIDOR>` con la dirección IP del servidor donde esté corriendo la API.

## Vídeo demostrativo

[![Speedshield Demo](https://markdown-videos-api.jorgenkh.no/url?url=https%3A%2F%2Fyoutube.com%2Fshorts%2FMqvcsZabisw)](https://youtube.com/shorts/MqvcsZabisw)
