import "../styles/RecommendedSongCard.css";
import axios from "axios";
import { useState } from "react";

const RecommendedSongCard = ({ song, title, username, updateRecommendation }) => {
  const [feedbackSong, setFeedbackSong] = useState(null); // Estado para saber cuál se pulsó

  const likedSong = async () => {
    console.log("Liked:", title, username);

    try {
      const response = await axios.post("/api/save_liked", { username, title });

      if (response.status === 200) {
        console.log("Canción guardada como 'Liked'.");
        updateRecommendation();
      } else {
        console.error("Error al guardar la canción como 'Liked'.");
      }
    } catch (error) {
      console.error("Error en la llamada a /save_liked:", error);
    }
  };

  const dislikedSong = async () => {
    console.log("Disliked:", title, username);

    try {
      const response = await axios.post("/api/save_disliked", { username, title });

      if (response.status === 200) {
        console.log("Canción guardada como 'Disliked'.");
        updateRecommendation();
      } else {
        console.error("Error al guardar la canción como 'Disliked'.");
      }
    } catch (error) {
      console.error("Error en la llamada a /save_disliked:", error);
    }
  };

  const handleLike = () => {
    setFeedbackSong(true); // Like pulsado
    console.log(feedbackSong);
  };

  const handleDislike = () => {
    setFeedbackSong(false); // Dislike pulsado
    console.log(feedbackSong);
  };

  const handleFeedback = async () => {
    if (feedbackSong !== null) {
      if (feedbackSong) {
        likedSong();
      } else {
        dislikedSong();
      }
    }
  };

  return (
    <div className="recommended-card">
      <div className="recommended-card-top">
        <img
          src={song.image}
          alt={song.name}
          className="card-img-top recommended-card-img"
        />
        <div className="recommended-card-text">
          <h5 className="card-title recommended-card-title">{song.name}</h5>
          <p className="card-text">
            <strong>Artistas:</strong> {song.artists.join(", ")} <br />
            <strong>Álbum:</strong> {song.album} <br />
            <strong>Duración:</strong>{" "}
            {Math.floor(song.duration / 60000)}:
            {String(song.duration % 60000).padStart(2, "0").slice(0, 2)} minutos
          </p>
        </div>
      </div>
      <div className="recommended-card-body">
        <div className="recommended-card-container-listen">
          <a
            href={song.preview}
            target="_blank"
            rel="noopener noreferrer"
            className="btn recommended-card-listen"
          >
            Escuchar
          </a>
        </div>
        <p className="recommended-card-feedback-title">
          ¿Qué te ha parecido la canción?
        </p>
        <div className="mt-3 recommended-card-button-container">
          <button
            className={`btn recommended-card-feedback-button ${
              feedbackSong === true ? "selected" : ""
            }`}
            onClick={handleLike}
          >
            👍
          </button>
          <button
            className={`btn recommended-card-feedback-button ${
              feedbackSong === false ? "selected" : ""
            }`}
            onClick={handleDislike}
          >
            👎
          </button>
        </div>
        <div className="mt-3 recommended-card-feedback-container">
          <textarea
            type="text"
            className="recommended-card-feedback-text"
            placeholder="Introduce el feedback de la canción."
          ></textarea>
          <button
            className="btn recommended-card-feedback-send"
            onClick={handleFeedback}
          >
            Enviar feedback
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendedSongCard;
