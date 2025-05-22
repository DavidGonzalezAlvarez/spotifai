const express = require('express');
const neo4j = require('neo4j-driver');
const axios = require('axios')

const router = express.Router();

// Configuración del driver de Neo4j
process.env.EXPRESS_PORT
const uri = process.env.NEO4J_URL;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASS;

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

router.use(express.json());

router.post("/save-user", async (req, res) => {
  console.log("PETICION /save-user");
  const session = driver.session();

  try {
    const user = req.body;

    if (!user.id || !user.display_name || !user.country) {
      return res.status(400).json({ error: "Datos de usuario incompletos" });
    }
    const spotifyId = user.id;
    const nombre = user.display_name;
    const pais = user.country;
    const imagen = user.images?.[0]?.url || null;

    const query = `
      MERGE (u:Usuario {spotify_id: $spotifyId})
      ON CREATE SET u.isAdmin = false
      SET u.nombre = $nombre,
          u.pais = $pais,
          u.imagen = $imagen
      RETURN u
    `;

    const result = await session.run(query, { spotifyId, nombre, pais, imagen });

    const node = result.records[0].get("u").properties;

    res.status(200).json({ message: "Usuario guardado correctamente", usuario: node });

  } catch (error) {
    console.error("Error guardando usuario:", error);
    res.status(500).json({ error: "Error guardando usuario" });
  } finally {
    await session.close();
  }
});

router.post("/save_liked", async (req, res) => {
  const { userId, id } = req.body;

  if (!userId || !id) {
    return res.status(400).send("Faltan datos en la solicitud.");
  }

  try {
    const session = driver.session();

    await session.run(
      `
      MERGE (u:Usuario {spotify_id: $userId})
      MERGE (c:Cancion {spotify_id: $id})
      MERGE (u)-[:LIKED_RECOMMENDATION]->(c)
      `,
      { userId, id }
    );

    res.status(200).send("Canción añadida a 'Liked' correctamente.");
  } catch (error) {
    console.error("Error guardando la canción en 'Liked':", error);
    res.status(500).send("Error al guardar la canción en 'Liked'.");
  }
});

router.post("/save_disliked", async (req, res) => {
  const { userId, id } = req.body;

  if (!userId || !id) {
    return res.status(400).send("Faltan datos en la solicitud.");
  }

  try {
    const session = driver.session();

    await session.run(
      `
      MERGE (u:Usuario {spotify_id: $userId})
      MERGE (c:Cancion {spotify_id: $id})
      MERGE (u)-[:DISLIKED_RECOMMENDATION]->(c)
      `,
      { userId, id }
    );

    res.status(200).send("Canción añadida a 'Disliked' correctamente.");
  } catch (error) {
    console.error("Error guardando la canción en 'Disliked':", error);
    res.status(500).send("Error al guardar la canción en 'Disliked'.");
  }
});

async function getPreferenceStats(userId) {
  const session = driver.session();

  try {
    const query = `
      MATCH (u:Usuario {spotify_id: $id})-[r:LIKED|LIKED_ARTIST|LIKED_RECOMMENDATION|DISLIKED_RECOMMENDATION]->(c:Cancion)
      WITH
        CASE
          WHEN type(r) = 'LIKED' OR type(r) = 'LIKED_RECOMMENDATION' THEN 1.0
          WHEN type(r) = 'LIKED_ARTIST' THEN 0.5
          WHEN type(r) = 'DISLIKED_RECOMMENDATION' THEN -0.5
          ELSE 0.0
        END AS peso,
        c
      WITH
        collect({
          peso: peso,
          bpm: c.bpm,
          danceability: c.danceability,
          loudness: c.loudness,
          chords_strength: c.chords_strength,
          dissonance: c.dissonance,
          tonal_entropy: c.tonal_entropy,
          spectral_centroid: c.spectral_centroid,
          pitch_salience: c.pitch_salience,
          chords_change_rate: c.chords_change_rate,
          spectral_complexity: c.spectral_complexity
        }) AS canciones,
        collect(distinct c.genero) AS generosList
      UNWIND generosList AS lista
      UNWIND lista AS generoPlano
      RETURN canciones, collect(generoPlano) AS generosCrudos
    `;

    const result = await session.run(query, { id: userId });
    const data = result.records[0].get("canciones");
    const generosCrudos = result.records[0].get("generosCrudos"); // Esto será un array de arrays

    if (!data || data.length === 0) return null;

    const fields = Object.keys(data[0]).filter(k => k !== "peso");
    const arrays = Object.fromEntries(fields.map(f => [f, []]));

    data.forEach(cancion => {
      fields.forEach(field => {
        arrays[field].push({ valor: cancion[field], peso: cancion.peso });
      });
    });

    function mediaPonderada(values) {
      const sum = values.reduce((acc, val) => acc + val.valor * val.peso, 0);
      const totalPeso = values.reduce((acc, val) => acc + Math.abs(val.peso), 0); // ✅ Seguro incluso con pesos negativos
      return sum / totalPeso;
    }

    const resultado = {};
    for (const field of fields) {
      resultado[field] = mediaPonderada(arrays[field]);
    }

    // Aplanar la lista de listas
    const allGenres = generosCrudos.filter(Boolean);

    // Contar ocurrencias
    const genreCounts = {};
    allGenres.forEach(g => {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });

    // Obtener los más frecuentes (top 5 por ejemplo)
    const generosFavoritos = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genero]) => genero);

    return {resultado, generosFavoritos};

  } catch (error) {
    console.error("Error calculando preferencias:", error);
    throw error;
  } finally {
    await session.close();
  }
}

router.get('/get/recommendation', async (req, res) => {
  const userId = req.query.id;
  if (!userId) {
    return res.status(400).json({ error: 'Falta el ID del usuario' });
  }

  try {
    const { resultado: prefs, generosFavoritos } = await getPreferenceStats(userId);
    if (!prefs) return res.status(404).json({ error: 'No se encontraron estadísticas de preferencias' });

    const session = driver.session();

    const result = await session.run(
      `
      MATCH (u:Usuario {spotify_id: $userId})-[:LIKED|LIKED_RECOMMENDATION]->(c1:Cancion)<-[:INTERPRETADA_POR]-(a:Artista)
      WITH u, collect(DISTINCT a) AS artistasFavoritos

      MATCH (a2:Artista)-[:INTERPRETADA_POR]->(c:Cancion)
      WHERE NOT (c)<-[:LIKED|LIKED_ARTIST|LIKED_RECOMMENDATION|DISLIKED_RECOMMENDATION]-(u)
        AND (
          any(g IN c.genero WHERE g IN $generosFavoritos)
          OR a2 IN artistasFavoritos
        )

      WITH u, c, a2, artistasFavoritos,
          (c.bpm - $prefs.bpm)^2 +
          (c.danceability - $prefs.danceability)^2 +
          (c.chords_strength - $prefs.chords_strength)^2 +
          (c.dissonance - $prefs.dissonance)^2 +
          (c.pitch_salience - $prefs.pitch_salience)^2 +
          (c.loudness - $prefs.loudness)^2 +
          (c.spectral_centroid - $prefs.spectral_centroid)^2 +
          (c.spectral_complexity - $prefs.spectral_complexity)^2 +
          (c.chords_change_rate - $prefs.chords_change_rate)^2 +
          (c.tonal_entropy - $prefs.tonal_entropy)^2 AS distanciaOriginal,
          a2 IN artistasFavoritos AS artistaConocido,
          any(g in c.genero WHERE g IN $generosFavoritos) AS generoCoincidente

      WITH c, distanciaOriginal,
          CASE
            WHEN artistaConocido AND generoCoincidente THEN distanciaOriginal * 0.5
            WHEN artistaConocido THEN distanciaOriginal * 0.7
            WHEN generoCoincidente THEN distanciaOriginal * 0.8
            ELSE distanciaOriginal
          END AS distancia
      RETURN c { .id, .titulo, .spotify_id, .genero } AS cancion, distancia
      ORDER BY distancia ASC
      LIMIT 10
      `,
      {
        userId,
        prefs,
        generosFavoritos
      }
    );

    const recomendaciones = result.records.map(record => ({
      ...record.get('cancion'),
      distancia: record.get('distancia')
    }));

    res.status(200).json({ recomendaciones });

  } catch (error) {
    console.error('Error generando recomendaciones:', error);
    res.status(500).json({ error: 'Error generando recomendaciones' });
  }
});

router.post("/process-and-save", async (req, res) => {
  console.log("PETICION /process-and-save")
  const { canciones, user } = req.body;
  const session = driver.session();

  if (!Array.isArray(canciones)) {
    return res.status(400).json({ error: "Formato inválido de canciones" });
  }

  const resultados = [];

  for (const cancion of canciones) {
    const songId = cancion.id;
    const name = cancion.name;
    const artistas = cancion.artists.map(a => a.name).join(", ");
    const artistasEncoded = encodeURIComponent(artistas);
    const nombreEncoded = encodeURIComponent(name);

    const esCancionArtista = cancion.desdeArtista; // lo marcas en front
    const relacion = esCancionArtista ? "LIKED_ARTIST" : "LIKED";
    
    try {
      // 1. Comprobar si la canción ya existe en la base
      const resultExist = await session.run(
        "MATCH (s:Cancion {spotify_id: $songId}) RETURN s",
        { songId }
      );

      const existe = resultExist.records.length > 0;

      if (existe) {
        // 3. Si existe, solo crear la relación (sin procesar)
        const cypherRelacion = `
          MATCH (u:Usuario {spotify_id: $userId}), (s:Cancion {spotify_id: $songId})
          MERGE (u)-[:${relacion}]->(s)
        `;

        await session.run(cypherRelacion, {
          userId: user.id,
          songId
        });

        resultados.push({ ...cancion, status: "Existente, relación creada" });
      }
    } catch (err) {
      console.error(`❌ Error con ${name}:`, err.message);
      resultados.push({ error: `Falló ${name}`, detalle: err.message });
    }
  }

  for (const cancion of canciones) {
    const songId = cancion.id;
    const name = cancion.name;
    const artistas = cancion.artists.map(a => a.name).join(", ");
    const artistasEncoded = encodeURIComponent(artistas);
    const nombreEncoded = encodeURIComponent(name);

    const esCancionArtista = cancion.desdeArtista; // lo marcas en front
    const relacion = esCancionArtista ? "LIKED_ARTIST" : "LIKED";
    
    try {
      // 1. Comprobar si la canción ya existe en la base
      const resultExist = await session.run(
        "MATCH (s:Cancion {spotify_id: $songId}) RETURN s",
        { songId }
      );

      const existe = resultExist.records.length > 0;

      if (!existe) {
        try {
          const response = await axios.get(`http://localhost:5000/procesar?cancion=${nombreEncoded}&artista=${artistasEncoded}`);
          const datosAnalisis = response.data.caracteristicas;
          console.log(datosAnalisis);
          // Extraer datos básicos de Spotify desde la estructura que has dado
          const genero = cancion.genero || "Desconocido";
          const popularidad = cancion.popularity || 0;
          const duracion = cancion.duration_ms || 0;
          const uri = cancion.uri || "";
          const artistas = cancion.artists || []; // lista de artistas

          // Crear nodo Cancion
          const crearCancion = `
            MERGE (c:Cancion {spotify_id: $songId})
            ON CREATE SET c.titulo = $titulo, c.genero = $genero, c.popularidad = $popularidad,
                          c.duracion = $duracion, c.bpm = $bpm, c.danceability = $danceability,
                          c.loudness = $loudness, c.dissonance = $dissonance, c.pitch_salience = $pitch_salience,
                          c.chords_changes_rate = $chords_changes_rate, c.chords_strength = $chords_strength,
                          c.spectral_centroid = $spectral_centroid, c.tonal_entropy = $tonal_entropy,
                          c.spectral_complexity = $spectral_complexity, c.uri = $uri
          `;

          await session.run(crearCancion, {
            songId,
            titulo: name,
            genero,
            popularidad,
            duracion,
            uri,
            ...datosAnalisis
          });

          // Crear nodos Artista y relaciones INTERPRETADA_POR
          for (const artista of artistas) {
            const crearArtistaYRelacion = `
              MERGE (a:Artista {spotify_id: $artista_id})
              ON CREATE SET a.nombre = $artista_nombre
              WITH a
              MATCH (c:Cancion {spotify_id: $songId})
              MERGE (a)-[:INTERPRETADA_POR]->(c)
            `;

            await session.run(crearArtistaYRelacion, {
              artista_id: artista.id,
              artista_nombre: artista.name,
              songId
            });
          }

          // Relación con el usuario
          const cypherRelacion = `
            MATCH (u:Usuario {spotify_id: $userId}), (c:Cancion {spotify_id: $songId})
            MERGE (u)-[:${relacion}]->(c)
          `;

          await session.run(cypherRelacion, {
            userId: user.id,
            songId
          });

          resultados.push({ ...cancion, ...datosAnalisis, status: "Procesada y guardada" });
          console.log(`✅ Procesada y guardada: ${name}`);
        } catch (error) {
          console.error(`❌ Error procesando nueva canción ${name}:`, error.message);
          resultados.push({ error: `Falló ${name}`, detalle: error.message });
        }
      }

    } catch (err) {
      console.error(`❌ Error con ${name}:`, err.message);
      resultados.push({ error: `Falló ${name}`, detalle: err.message });
    }
  }

  res.json({ procesadas: resultados.length, resultados });
});

router.get("/get/admin", async (req, res) => {
  console.log("Peticion recibida /get/admin");
  const id = req.query.id;
  try {
    const session = driver.session();
    const result = await session.run(
      `MATCH (u:Usuario {spotify_id: $id}) 
      RETURN u.isAdmin AS isAdmin`,
      { id }
    );
    const users = result.records.map(r => ({
      isAdmin: r.get("isAdmin"),
    }));
    res.status(200).json(users);
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    res.status(500).send("Error interno al obtener usuarios.");
  }
});

router.get("/get/users", async (req, res) => {
  console.log("Peticion recibida /get/users")
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  try {
    const session = driver.session();
    const result = await session.run(
      `MATCH (u:Usuario) 
      RETURN u.nombre AS name, u.pais AS pais, u.spotify_id AS id, u.imagen AS imagen
      SKIP $skip LIMIT $limit`,
      { skip: neo4j.int(skip), limit: neo4j.int(limit) }
    );
    const users = result.records.map(r => ({
      name: r.get("name"),
      pais: r.get("pais"),
      imagen: r.get("imagen"),
      id: r.get("id")
    }));
    res.status(200).json(users);
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    res.status(500).send("Error interno al obtener usuarios.");
  }
});

router.get("/get/users/count", async (req, res) => {
  console.log("Peticion recibida /get/users/count")
  const pais = req.query.pais;
  try {
    const session = driver.session();
    let result;
    if (pais) {
      result = await session.run(
        `MATCH (u:Usuario) 
        WHERE u.pais = $pais 
        RETURN count(u) AS total`, 
        { pais }
      );
    } else {
      result = await session.run(`MATCH (u:Usuario) RETURN count(u) AS total`);
    }
    const total = result.records[0].get("total").toNumber();
    res.status(200).json({ total });
  } catch (err) {
    res.status(500).send("Error al contar usuarios.");
  }
});

router.get("/get/users/:pais", async (req, res) => {
  console.log("Peticion recibida /get/users/:pais");
  const { pais } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  try {
    const session = driver.session();
    const result = await session.run(
      `MATCH (u:Usuario) 
      WHERE u.pais = $pais
      RETURN u.nombre AS name, u.pais AS pais, u.spotify_id AS id, u.imagen AS imagen
      SKIP $skip LIMIT $limit`,
      { pais, skip: neo4j.int(skip), limit: neo4j.int(limit) }
    );

    const users = result.records.map(r => ({
      name: r.get("name"),
      pais: r.get("pais"),
      imagen: r.get("imagen"),
      id: r.get("id")
    }));

    res.status(200).json(users);
  } catch (err) {
    console.error("Error al obtener usuarios por país:", err);
    res.status(500).send("Error interno al obtener usuarios.");
  }
});

router.get("/get/songs", async (req, res) => {
  console.log("Peticion recibida /get/songs")
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const session = driver.session();
    const result = await session.run(
      `MATCH (c:Cancion)
       RETURN c.titulo AS title, c.spotify_id AS id
       SKIP $skip LIMIT $limit`,
      { skip: neo4j.int(skip), limit: neo4j.int(limit) }
    );

    const songs = result.records.map(r => ({
      title: r.get("title"),
      id: r.get("id")
    }));

    res.status(200).json(songs);
  } catch (err) {
    console.error("Error al obtener canciones paginadas:", err);
    res.status(500).send("Error al obtener canciones.");
  }
});


router.get("/get/artists", async (req, res) => {
  console.log("Peticion recibida /get/artists")
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const session = driver.session();
    const result = await session.run(
      `MATCH (a:Artista)
       RETURN a.nombre AS name, a.spotify_id AS id
       SKIP $skip LIMIT $limit`,
      { skip: neo4j.int(skip), limit: neo4j.int(limit) }
    );

    const artists = result.records.map(r => ({
      name: r.get("name"),
      id: r.get("id")
    }));

    res.status(200).json(artists);
  } catch (err) {
    console.error("Error al obtener artistas paginados:", err);
    res.status(500).send("Error al obtener artistas.");
  }
});

router.get("/get/songs/count", async (req, res) => {
  console.log("Peticion recibida /get/songs/count");
  const genre = req.query.genre;

  try {
    const session = driver.session();
    let result;

    if (genre) {
      result = await session.run(
        `MATCH (c:Cancion)
         WHERE ANY(g IN c.genero WHERE toLower(g) CONTAINS toLower($genre))
         RETURN count(c) AS total`,
        { genre }
      );
    } else {
      result = await session.run(
        `MATCH (c:Cancion)
         RETURN count(c) AS total`
      );
    }

    const total = result.records[0].get("total").toNumber();
    res.status(200).json({ 
      total,
      genero: genre || null
     });
  } catch (err) {
    console.error("Error al contar canciones:", err);
    res.status(500).send("Error al contar canciones.");
  }
});

router.get("/get/artists/count", async (req, res) => {
  try {
    const session = driver.session();
    const result = await session.run(`MATCH (a:Artista) RETURN count(a) AS total`);
    const total = result.records[0].get("total").toNumber();
    res.status(200).json({ total });
  } catch (err) {
    res.status(500).send("Error al contar artistas.");
  }
});


router.get('/search/songs', async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ error: 'Falta el parámetro de búsqueda (q)' });
    }

    try {
        const session = driver.session();
        const result = await session.run(
            `MATCH (c:Cancion) WHERE toLower(c.titulo) CONTAINS toLower($q) RETURN c.titulo AS title, c.id AS id LIMIT 20`,
            { q }
        );

        const songs = result.records.map(r => ({
            title: r.get("title"),
            id: r.get("id")
        }));

        res.status(200).json(songs);
    } catch (err) {
        console.error('Error al buscar canciones:', err);
        res.status(500).json({ error: 'Error al buscar canciones en Neo4j' });
    }
});


router.get('/search/users', async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ error: 'Falta el parámetro de búsqueda (q)' });
    }

    try {
        const session = driver.session();
        const result = await session.run(
            `MATCH (u:Usuario) WHERE toLower(u.nombre) CONTAINS toLower($q) RETURN u.nombre AS name, u.pais AS pais, u.spotify_id AS id , u.imagen AS imagen LIMIT 20`,
            { q }
        );
      const users = result.records.map(r => ({
        name: r.get("name"),
        pais: r.get("pais"),
        imagen: r.get("imagen"),
        id: r.get("id")
      }));
      res.status(200).json(users);
    } catch (err) {
        console.error('Error al buscar usuarios:', err);
        res.status(500).json({ error: 'Error al buscar usuarios en Neo4j' });
    }
});

router.get('/search/artists', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Falta el parámetro de búsqueda (q)' });
  }

  try {
    const session = driver.session();
    const result = await session.run(
      `MATCH (a:Artista) WHERE toLower(a.nombre) CONTAINS toLower($q) RETURN a.nombre AS name, a.spotify_id AS id LIMIT 20`,
      { q }
    );

    const artists = result.records.map(r => ({
      name: r.get("name"),
      id: r.get("id")
    }));

    res.status(200).json(artists);
  } catch (err) {
    console.error('Error al buscar artistas:', err);
    res.status(500).json({ error: 'Error al buscar artistas en Neo4j' });
  }
});

router.delete("/delete/song/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).send("Falta el ID de la canción.");
  }

  try {
    const session = driver.session();

    await session.run(
      `
      MATCH (c:Cancion {spotify_id: $id})
      DETACH DELETE c
      `,
      { id }
    );

    res.status(200).send(`Canción con ID ${id} eliminada correctamente.`);
  } catch (error) {
    console.error("Error al eliminar canción:", error);
    res.status(500).send("Error al eliminar la canción.");
  }
});

router.delete("/delete/artists/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).send("Falta el ID del artista.");
  }

  try {
    const session = driver.session();

    await session.run(
      `
      MATCH (a:Artista {spotify_id: $id})
      DETACH DELETE a
      `,
      { id }
    );

    res.status(200).send(`Artista con ID ${id} eliminado correctamente.`);
  } catch (error) {
    console.error("Error al eliminar el artista:", error);
    res.status(500).send("Error al eliminar el artista.");
  }
});



router.delete("/delete/users/:id", async (req, res) => {
  console.log("Peticion recibida /delete/users");
  const { id } = req.params;

  if (!id) {
    return res.status(400).send("Falta el ID del usuario.");
  }

  try {
    const session = driver.session();

    await session.run(
      `
      MATCH (u:Usuario {spotify_id: $id})
      DETACH DELETE u
      `,
      { id }
    );

    res.status(200).send(`Usuario con ID ${id} eliminado correctamente.`);
  } catch (error) {
    console.error("Error al eliminar el usuario:", error);
    res.status(500).send("Error al eliminar el usuario.");
  }
});

router.get('/get/genres', async (req, res) => {
    try {
        const session = driver.session();
        const result = await session.run(`
            MATCH (c:Cancion)
            UNWIND c.genero AS genero
            RETURN DISTINCT genero ORDER BY genero
        `);

        const genres = result.records.map(record => record.get('genero'));
        res.json(genres);
    } catch (err) {
        console.error('Error al obtener géneros:', err);
        res.status(500).json({ error: 'Error al obtener géneros desde Neo4j' });
    }
});

router.get('/get/paises', async (req, res) => {
    try {
        const session = driver.session();
        const result = await session.run(`
            MATCH (u:Usuario)
            UNWIND u.pais AS pais
            RETURN DISTINCT pais ORDER BY pais
        `);

        const pais = result.records.map(record => record.get('pais'));
        res.json(pais);
    } catch (err) {
        console.error('Error al obtener paises:', err);
        res.status(500).json({ error: 'Error al obtener paises desde Neo4j' });
    }
});

router.get("/get/songs/:genre", async (req, res) => {
  console.log("PETICION /get/songs/:genre")
  const genre = req.params.genre;
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const session = driver.session();
    const result = await session.run(
      `MATCH (c:Cancion)
       WHERE ANY(g IN c.genero WHERE toLower(g) CONTAINS toLower($genre))
       RETURN c.titulo AS title, c.id AS id
       SKIP $skip LIMIT $limit`,
      {
        genre,
        skip: neo4j.int(skip),
        limit: neo4j.int(limit)
      }
    );

    const songs = result.records.map(r => ({
      title: r.get("title"),
      id: r.get("id")
    }));

    res.status(200).json(songs);
  } catch (err) {
    console.error("Error al obtener canciones por género:", err);
    res.status(500).send("Error al obtener canciones por género.");
  }
});



process.on('exit', async () => {
  await driver.close();
});

module.exports = router;
