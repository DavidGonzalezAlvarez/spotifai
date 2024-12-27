import RecommendedSongCard from '../utils/RecommendedSongCard';

export default function Recommender({ song, title, userData, updateRecommendation }) {

  console.log("Song: "+ song)

  if (!song) {
    return (
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ height: "100vh"}}
      >
        <h2 className="text-light">Cargando canción recomendada...</h2>
      </div>
    );
  }

  const formattedSong = {
    name: song.name,
    artists: song.artists.map((artist) => artist.name), // Obtener nombres de artistas
    album: song.album.name,
    duration: song.duration_ms, // Duración en milisegundos
    image: song.album.images[0]?.url, // URL de la imagen
    preview: song.external_urls["spotify"], // URL del audio
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
    >
      <RecommendedSongCard song={formattedSong} title={title} username={userData.display_name} updateRecommendation={updateRecommendation}/>
    </div>
  );
}
