const express = require('express');
const neo4j = require('neo4j-driver');

const router = express.Router();

// Configuración del driver de Neo4j
process.env.EXPRESS_PORT
const uri = process.env.NEO4J_URL;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASS;

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

router.use(express.json());

router.post("/save_liked", async (req, res) => {
  const { username, title } = req.body;

  if (!username || !title) {
    return res.status(400).send("Faltan datos en la solicitud.");
  }

  try {
    const session = driver.session();

    await session.run(
      `
      MERGE (u:User {name: $username})
      MERGE (c:Cancion {titulo: $title})
      MERGE (u)-[:LIKED]->(c)
      `,
      { username, title }
    );

    res.status(200).send("Canción añadida a 'Liked' correctamente.");
  } catch (error) {
    console.error("Error guardando la canción en 'Liked':", error);
    res.status(500).send("Error al guardar la canción en 'Liked'.");
  }
});

router.post("/save_disliked", async (req, res) => {
  const { username, title } = req.body;

  if (!username || !title) {
    return res.status(400).send("Faltan datos en la solicitud.");
  }

  try {
    const session = driver.session();

    await session.run(
      `
      MERGE (u:User {name: $username})
      MERGE (c:Cancion {titulo: $title})
      MERGE (u)-[:DISLIKED]->(c)
      `,
      { username, title }
    );

    res.status(200).send("Canción añadida a 'Disliked' correctamente.");
  } catch (error) {
    console.error("Error guardando la canción en 'Disliked':", error);
    res.status(500).send("Error al guardar la canción en 'Disliked'.");
  }
});

router.get("/get/recommendation", async (req, res) => {
  console.log("Peticion de recomendacion");
  const { name } = req.query;

  if (!name) {
    return res.status(400).send("El nombre de usuario es requerido.");
  }

  try {
    const session = driver.session();

    // Consulta para obtener la recomendación
    const query = `
      MATCH (u:User {name: $name})
      OPTIONAL MATCH (u)-[:LIKED]->(:Cancion)-[:INTERPRETADA_POR]->(likedArtist:Artista)
      OPTIONAL MATCH (u)-[:DISLIKED]->(:Cancion)-[:INTERPRETADA_POR]->(dislikedArtist:Artista)
      OPTIONAL MATCH (likedArtist)<-[:INTERPRETADA_POR]-(similarSong:Cancion)
      WITH u, similarSong,
          COUNT(DISTINCT likedArtist) AS positiveScore,
          COUNT(DISTINCT dislikedArtist) * 0.5 AS weightedNegativeScore
      WITH similarSong, (positiveScore - weightedNegativeScore) AS finalScore
      WHERE NOT (u)-[:LIKED|DISLIKED]->(similarSong) // Evita canciones ya valoradas
      RETURN similarSong.titulo AS songTitle, similarSong.id AS songId, finalScore AS score
      ORDER BY score DESC
      LIMIT 1;
    `;

    const result = await session.run(query, { name });

    if (result.records.length > 0) {
      const record = result.records[0];
      const recommendation = {
        title: record.get("songTitle"),
      };
      res.status(200).json(recommendation);
    } else {
      res.status(404).send("No hay más canciones para recomendar.");
    }
  } catch (error) {
    console.error("Error obteniendo recomendación de Neo4j:", error);
    res.status(500).send("Error al obtener la recomendación.");
  }
});

// Endpoint para guardar datos
router.post('/save-data', async (req, res) => {
  const { yearSongs, monthSongs, weekSongs, yearArtistsSongs, monthArtistsSongs, weekArtistsSongs, userData } = req.body;

  if (!userData || !userData.display_name) {
    return res.status(400).send("Faltan datos del usuario.");
  }

  const username = userData.display_name;

  try {
    const session = driver.session();
    const queries = [];

    // Procesar los grupos para LIKED
    [yearSongs, monthSongs, weekSongs].forEach((songGroup, index) => {
      if (songGroup?.items) { // Asegurarse de que existe el campo 'tracks'
        songGroup.items.forEach((song) => {
          if (song.id && song.name) {
            queries.push({
              query: `
                MERGE (u:User {name: $username})
                MERGE (c:Cancion {id: $songId})
                ON CREATE SET c.titulo = $songName
                ON MATCH SET c.titulo = coalesce(c.titulo, $songName)
                MERGE (u)-[:LIKED]->(c)
              `,
              params: {
                username,
                songId: song.id,
                songName: song.name,
              },
            });
          }
        });
      }
    });

    // Procesar los grupos para LIKED_ARTISTS
    [yearArtistsSongs, monthArtistsSongs, weekArtistsSongs].forEach((songGroup, index) => {
      if (songGroup?.tracks) { // Asegurarse de que existe el campo 'tracks'
        songGroup.tracks.forEach((song) => {
          if (song.id && song.name) {
            queries.push({
              query: `
                MERGE (u:User {name: $username})
                MERGE (c:Cancion {id: $songId})
                ON CREATE SET c.titulo = $songName
                ON MATCH SET c.titulo = coalesce(c.titulo, $songName)
                MERGE (u)-[:LIKED_ARTISTS]->(c)
              `,
              params: {
                username,
                songId: song.id,
                songName: song.name,
              },
            });
          }
        });
      }
    });

    // Ejecutar todas las consultas en una transacción
    const tx = session.beginTransaction();

    for (const query of queries) {
      await tx.run(query.query, query.params);
    }

    await tx.commit();
    res.status(200).send("Datos guardados correctamente en la base de datos.");
  } catch (error) {
    console.error("Error al guardar datos en Neo4j:", error.message, error.stack);
    res.status(500).send("Error al guardar los datos en la base de datos.");
  }
});

process.on('exit', async () => {
  await driver.close();
});

module.exports = router;
