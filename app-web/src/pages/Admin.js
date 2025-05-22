import React, { useState, useEffect } from 'react';
import '../styles/Admin.css';
import trash from "../assets/trash.svg";
import axios from "axios";
import rightArrow from "../assets/rightArrow.svg"
import leftArrow from "../assets/leftArrow.svg"
import { Bar } from 'react-chartjs-2';
import {Chart as ChartJS,CategoryScale,LinearScale,BarElement,Title,Tooltip,Legend} from 'chart.js';

const server_url = process.env.REACT_APP_SERVER_URL;

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Admin() {
  const [activeButton, setActiveButton] = useState(null);
  const [fetchedSongs, setFetchedSongs] = useState(false);
  const [fetchedArtists, setFetchedArtists] = useState(false);
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [users, setUsers] = useState([]);
  const [pageSongs, setPageSongs] = useState(1);
  const [pageArtists, setPageArtists] = useState(1);
  const [pageUsers, setPageUsers] = useState(1);
  const [totalSongs, setTotalSongs] = useState(0);
  const [totalArtists, setTotalArtists] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationDisabled, setPaginationDisabled] = useState(false);
  const [searchTermSongs, setSearchTermSongs] = useState("");
  const [searchTermArtists, setSearchTermArtists] = useState("");
  const [searchTermUsers, setSearchTermUsers] = useState("");
  const [searchTermGenre, setSearchTermGenre] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [genres, setGenres] = useState([]);
  const [searchTermCountry, setSearchTermCountry] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [country, setCountry] = useState([]);
  const [usuariosPorPais, setUsuariosPorPais] = useState();
  const [cancionesPorGenero, setCancionesPorGenero] = useState();
  const limit = 10;

  const chartOptions = (title) => ({
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: 'white',
        },
      },
      title: {
        display: true,
        text: title,
        color: 'white',
        font: { size: 18 }
      }
    },
    scales: {
      x: {
        ticks: {
          color: 'white',
          maxRotation: 30,
          minRotation: 0,
          autoSkip: false,
          font: {
            size: 12, // Tamaño de fuente mayor
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)' // Líneas de guía suaves
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: 'white',
          font: {
            size: 12,
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  });


    const formatFollowers = (followers) => {
        return new Intl.NumberFormat().format(followers);
    };

    const formatDuration = (durationMs) => {
        const totalSeconds = Math.round(durationMs / 1000); // Convertir a segundos
        const minutes = Math.floor(totalSeconds / 60); // Obtener los minutos
        const seconds = totalSeconds % 60; // Obtener los segundos restantes
        return `${minutes}:${seconds.toString().padStart(2, '0')}`; // Formato "minutos:segundos"
    };

    const formatGenres = (genres) => {
    if (!genres || genres.length === 0) {
        return "Sin géneros"; // Si no tiene géneros
    }
    
    if (genres.length > 3) {
        return `${genres.slice(0, 3).join(", ")}...`; // Si tiene más de 3 géneros, mostrar los 3 primeros y '...'
    }

    return genres.join(", "); // Si tiene 3 o menos géneros, mostramos todos
};

  const pressed = (button) => {
    setActiveButton(prev => (prev === button ? null : button));
  };

  useEffect(() => {
    const fetchSpotifyData = async () => {
      setLoading(true); // Inicia el loading mientras enriquecemos las canciones con datos de Spotify

      const enrichedSongs = await Promise.all(songs.map(async (song) => {
        if (!song.spotify) { // Verificamos si la canción ya tiene datos de Spotify
          try {
            const response = await axios.get(`${server_url}/get/songInfoName?songName=${encodeURIComponent(song.title)}`, {
              withCredentials: true
            });
            const track = response.data.track;
            return { ...song, spotify: track };
          } catch (err) {
            return { ...song, spotify: null };
          }
        }
        return song; // Si ya tiene datos de Spotify, la retornamos tal cual
      }));
        setLoading(false); 
        setSongs(enrichedSongs);
        setFetchedSongs(false)
    };

    if (activeButton === "songs" && fetchedSongs) {
        fetchSpotifyData();
    }
  }, [fetchedSongs]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Empieza la carga de canciones

      if (activeButton === "songs") {
        try {
          let songsResponse
          let totalSongsResponse
          if (selectedGenre === "") {
            songsResponse = await axios.get(`${server_url}/api/get/songs?page=${pageSongs}&limit=${limit}`);
            totalSongsResponse = await axios.get(`${server_url}/api/get/songs/count`);
          } else {
            songsResponse = await axios.get(`${server_url}/api/get/songs/${selectedGenre}?page=${pageSongs}&limit=${limit}`);
            totalSongsResponse = await axios.get(`${server_url}/api/get/songs/count?genre=${selectedGenre}`);
          }
          setSongs(songsResponse.data);
          setTotalSongs(totalSongsResponse.data.total);
        } catch (error) {
          console.error('Error fetching songs data:', error);
        }
      }
        setFetchedSongs(true);
        setLoading(false); // Finaliza la carga de canciones
    };

    if (activeButton === "songs" && !paginationDisabled) {
      fetchData();
    }
  }, [activeButton, pageSongs, paginationDisabled, selectedGenre]);

  useEffect(() => {
    const fetchSpotifyData = async () => {
        setLoading(true); // Inicia el loading mientras enriquecemos los artistas con datos de Spotify
        const enrichedArtists = await Promise.all(artists.map(async (artist) => {
        if (!artist.spotify) { // Verificamos si el artista ya tiene datos de Spotify
            try {
            const response = await axios.get(`${server_url}/get/artistInfo?artistName=${encodeURIComponent(artist.name)}`, {
                withCredentials: true
            });
            const artistData = response.data;
            return { ...artist, spotify: artistData };
            } catch (err) {
            return { ...artist, spotify: null }; // Si hay un error, retornamos el artista sin datos de Spotify
            }
        }
        return artist; // Si ya tiene datos de Spotify, lo retornamos tal cual
        }));

        setLoading(false);
        setArtists(enrichedArtists); // Actualizamos el estado con los artistas enriquecidos
        setFetchedArtists(false);
    };

    if (activeButton === "artists" && fetchedArtists) {
        fetchSpotifyData();
    }
    }, [fetchedArtists]); // El efecto se ejecutará cuando 'fetchedArtists' cambie

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Empieza la carga de canciones

      if (activeButton === "artists") {
        try {
          const artistsResponse = await axios.get(`${server_url}/api/get/artists?page=${pageArtists}&limit=${limit}`);
          const totalArtistsResponse = await axios.get(`${server_url}/api/get/artists/count`);
          setArtists(artistsResponse.data);
          setTotalArtists(totalArtistsResponse.data.total);
        } catch (error) {
          console.error('Error fetching artists data:', error);
        }
      }

        setFetchedArtists(true);
        setLoading(false); // Finaliza la carga de canciones
    };

    if (activeButton === "artists" && !paginationDisabled) {
      fetchData();
    }
  }, [activeButton, pageArtists, paginationDisabled]);

  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Empieza la carga de canciones

      if (activeButton === "users") {
        try {
          let usersResponse;
          let totalUsersResponse;
          if (selectedCountry === "") {
            usersResponse = await axios.get(`${server_url}/api/get/users?page=${pageUsers}&limit=${limit}`);
            totalUsersResponse = await axios.get(`${server_url}/api/get/users/count`);
          } else {
            usersResponse = await axios.get(`${server_url}/api/get/users/${obtenerCodigoPais(selectedCountry)}?page=${pageUsers}&limit=${limit}`);
            totalUsersResponse = await axios.get(`${server_url}/api/get/users/count?pais=${obtenerCodigoPais(selectedCountry)}`);
          }
          setUsers(usersResponse.data);
          setTotalUsers(totalUsersResponse.data.total);
        } catch (error) {
          console.error('Error fetching artists data:', error);
        }
      }

        setLoading(false); // Finaliza la carga de canciones
    };

    if (activeButton === "users" && !paginationDisabled) {
      fetchData();
    }
  }, [activeButton, pageUsers, paginationDisabled, selectedCountry]);

  useEffect(() => {
    axios.get(server_url+"/api/get/genres").then(res => {
      setGenres(res.data)
    });
  }, []);

  useEffect(() => {
    axios.get(server_url+"/api/get/paises").then(res => {
      const paisesTraducidos = res.data.map(codigo => traducirCodigoPais(codigo));
      setCountry(paisesTraducidos);
    });
  }, []);

  useEffect(() => {
    const hayDatos = activeButton === "graphs" && country.length > 0 && genres.length > 0;
    if (!hayDatos) return;

    setLoading(true);

    const peticionesUsuarios = country.map((pais) =>
      axios.get(`${server_url}/api/get/users/count?pais=${obtenerCodigoPais(pais)}`)
    );

    const peticionesGeneros = genres.map((genero) =>
      axios.get(`${server_url}/api/get/songs/count?genre=${genero}`)
    );

    Promise.all([
      Promise.all(peticionesUsuarios),
      Promise.all(peticionesGeneros)
    ])
      .then(([resUsuarios, resGeneros]) => {
        const datosUsuarios = resUsuarios.map((res) => res.data.total);
        console.log(resGeneros)
        const datosGeneros = resGeneros
          .filter(res => res.data.total > 1000)
          .map(res => ({
            genero: res.data.genero,
            total: res.data.total
          }));

        const labelsGeneros = datosGeneros.map(d => d.genero);
        const datosTotales = datosGeneros.map(d => d.total);

        console.log(labelsGeneros)
        console.log(datosTotales)

        setUsuariosPorPais({
          labels: country,
          datasets: [
            {
              label: 'Usuarios',
              data: datosUsuarios,
              backgroundColor: ['#4CAF50', '#2196F3', '#FF9800'],
            },
          ],
        });

        setCancionesPorGenero({
          labels: labelsGeneros,
          datasets: [
            {
              label: 'Canciones',
              data: datosTotales,
              backgroundColor: ['#9C27B0', '#E91E63', '#FFC107', '#00BCD4'],
            },
          ],
        });
      })
      .catch((err) => {
        console.error("Error al cargar datos:", err);
      })
      .finally(() => {
        setLoading(false);
      });

  }, [activeButton, country, genres]);



  const searchArtists = async (query) => {
        try {
            const response = await axios.get(`/api/search/artists`, {
            params: { q: query },
            });
            setArtists(response.data)
            setFetchedArtists(true)
        } catch (error) {
            console.error('Error al buscar artistas:', error);
            return [];
        }
    };

    const searchSongs = async (query) => {
        try {
            const response = await axios.get(server_url+`/api/search/songs`, {
            params: { q: query },
            });
            setSongs(response.data)
            setFetchedSongs(true)
        } catch (error) {
            console.error('Error al buscar canciones:', error);
            return [];
        }
    };

    const searchUsers = async (query) => {
        try {
            const response = await axios.get(server_url+`/api/search/users`, {
            params: { q: query },
            });
            setUsers(response.data)
        } catch (error) {
            console.error('Error al buscar canciones:', error);
            return [];
        }
    };

    const handleSearchArtists = () => {
        if (searchTermArtists === ""){
            setPaginationDisabled(false)
        } else {
            searchArtists(searchTermArtists)
            setPaginationDisabled(true)
        }
    }

    const handleSearchSongs = () => {
        if (searchTermSongs === ""){
            setPaginationDisabled(false)
        } else {
            searchSongs(searchTermSongs)
            setPaginationDisabled(true)
        }
    }

    const handleSearchSongsGenre = () => {
      setSelectedGenre(searchTermGenre)
    }

    const handleSearchUsers = () => {
        if (searchTermUsers === ""){
            setPaginationDisabled(false)
        } else {
            searchUsers(searchTermUsers)
            setPaginationDisabled(true)
        }
    }

    const handleSearchUsersContry = () => {
      setSelectedCountry(searchTermCountry)
    }

    const handleDeleteSong = async (id) => {
      if (!window.confirm("¿Estás seguro de que quieres eliminar esta canción?")) return;
      try {
        await axios.delete(server_url+`/api/delete/song/${id}`);
        setSongs((prev) => prev.filter((song) => song.id !== id));
      } catch (err) {
        console.error("Error al eliminar canción:", err);
        alert("Error al eliminar la canción.");
      }
  };

  const handleDeleteAdmin = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este artista?")) return;
      try {
        await axios.delete(server_url+`/api/delete/artists/${id}`);
        setArtists((prev) => prev.filter((artist) => artist.id !== id));
      } catch (err) {
        console.error("Error al eliminar el artista:", err);
        alert("Error al eliminar la artista.");
      }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este usuario?")) return;
      try {
        await axios.delete(server_url+`/api/delete/users/${id}`);
        setUsers((prev) => prev.filter((user) => user.id !== id));
      } catch (err) {
        console.error("Error al eliminar el Usuario:", err);
        alert("Error al eliminar la artista.");
      }
  };

  function traducirCodigoPais(codigoIso) {
    const regionNames = new Intl.DisplayNames(['es'], { type: 'region' });
    return regionNames.of(codigoIso.toUpperCase());
  }

  function obtenerCodigoPais(nombrePais) {
    const regionNames = new Intl.DisplayNames(['es'], { type: 'region' });
    const codigos = [];
    for (let i = 65; i <= 90; i++) {
      for (let j = 65; j <= 90; j++) {
        const codigo = String.fromCharCode(i) + String.fromCharCode(j);
        const nombre = regionNames.of(codigo);
        if (nombre) {
          codigos.push({ codigo, nombre });
        }
      }
    }
    const normalizar = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const nombreNormalizado = normalizar(nombrePais);

    const resultado = codigos.find(p => normalizar(p.nombre) === nombreNormalizado);
    return resultado ? resultado.codigo : null;
  }

  const renderPagination = (currentPage, total, onPageChange) => {
    const totalPages = Math.ceil(total / limit);
    return (
      <div className="pagination">
        <button className='pagination-button' disabled={currentPage === 1 || paginationDisabled} onClick={() => onPageChange(currentPage - 1)}><img src={leftArrow}></img></button>
        <span className='pagination-text'>Página {currentPage} de {totalPages}</span>
        <button className='pagination-button' disabled={currentPage === totalPages || paginationDisabled} onClick={() => onPageChange(currentPage + 1)}><img src={rightArrow}></img></button>
      </div>
    );
  };

  return (
    <div className="admin-container">
      <aside className="sidebar">
        <button
          onClick={() => pressed("users")}
          className={`sidebar-btn ${activeButton === "users" ? "pressed" : ""}`}
        >
          Usuarios
        </button>
        <button
          onClick={() => pressed("songs")}
          className={`sidebar-btn ${activeButton === "songs" ? "pressed" : ""}`}
        >
          Canciones
        </button>
        <button
          onClick={() => pressed("artists")}
          className={`sidebar-btn ${activeButton === "artists" ? "pressed" : ""}`}
        >
          Artistas
        </button>
        <button
          onClick={() => pressed("graphs")}
          className={`sidebar-btn ${activeButton === "graphs" ? "pressed" : ""}`}
        >
          Gráficos
        </button>
      </aside>

      <main className="main-content">
        <h2 className="admin-header">Panel de admin</h2>

        {activeButton === "users" && (
          <div className="admin-table">
            <div className="input-container">
              <input
                type="text"
                placeholder="Buscar usuarios..."
                className="admin-input"
                value={searchTermUsers}
                onChange={(e) => setSearchTermUsers(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter"){
                        handleSearchUsers()
                    }
                }}
              />
            <input
              list="country-options"
              placeholder="Filtrar por pais..."
              className="admin-input"
              value={searchTermCountry}
              onChange={(e) => setSearchTermCountry(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchUsersContry();
                }
              }}
            />
          </div>
          <datalist id="country-options">
            {country.map((contry, i) => (
              <option key={i} value={contry} />
            ))}
          </datalist>
            {loading ? (
              <div className="d-flex justify-content-center align-items-center">
                <div className="spinner-border spinner-custom" role="status">
                <span className="sr-only"></span>
                </div>
              </div>
              ) : (
                users.map((user, i) => (
                  <div className="admin-row" key={i}>
                    <img src={user.imagen} alt="Cover" className='row-img'/>
                    <h3 className="row-name">{user.name}</h3>
                    <p className="row-info">Pais: {traducirCodigoPais(user.pais)}</p>
                    <p className="row-info">Id: {user.id}</p>
                    <button onClick={() => handleDeleteUser(user.id)} className="row-trash">
                      <img src={trash} alt="Eliminar" />
                    </button>
                  </div>
                ))
              )}
            {renderPagination(pageUsers, totalUsers, setPageUsers)}
          </div>
        )}

        {activeButton === "songs" && (
        <div className="admin-table">
          <div className="input-container">
            <input
              type="text"
              placeholder="Buscar canciones..."
              className="admin-input"
              value={searchTermSongs}
              onChange={(e) => setSearchTermSongs(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSongs();
                }
              }}
            />
            <input
              list="genre-options"
              placeholder="Filtrar por género..."
              className="admin-input"
              value={searchTermGenre}
              onChange={(e) => setSearchTermGenre(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSongsGenre();
                }
              }}
            />
          </div>
          <datalist id="genre-options">
            {genres.map((genre, i) => (
              <option key={i} value={genre} />
            ))}
          </datalist>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center">
              <div className="spinner-border spinner-custom" role="status">
                <span className="sr-only"></span>
              </div>
            </div>
          ) : (
            songs.map((song, i) => (
              <div className="admin-row" key={i}>
                {song.spotify ? (
                  <>
                    <img
                      src={song.spotify.album.images[0]?.url}
                      alt="Cover"
                      className="row-img"
                    />
                    <h3 className="row-name">{song.title}</h3>
                    <p className="row-info">Álbum: {song.spotify.album.name}</p>
                    <p className="row-info">Duración: {formatDuration(song.spotify.duration_ms)}</p>
                    <button
                      onClick={() => handleDeleteSong(song.spotify.id)}
                      className="row-trash"
                    >
                      <img src={trash} alt="Eliminar" />
                    </button>
                  </>
                ) : (
                  <h3 className="row-name">{song.title}</h3> // Solo muestra el nombre si no hay información de Spotify
                )}
              </div>
            ))
          )}
          {renderPagination(pageSongs, totalSongs, setPageSongs)}
        </div>
      )}

        {activeButton === "artists" && (
            <div className="admin-table">
                <input
                    type="text"
                    placeholder="Buscar artistas..."
                    className="admin-input"
                    value={searchTermArtists}
                    onChange={(e) => setSearchTermArtists(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter"){
                            handleSearchArtists()
                        }
                    }}
                />
                {loading ? (
                <div className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border spinner-custom" role="status">
                    <span className="sr-only"></span>
                    </div>
                </div>
                ) : (
                artists.map((artist, i) => (
                    <div className="admin-row" key={i}>
                    {artist.spotify ? (
                        <>
                        <img
                            src={artist.spotify.images[0]?.url || 'https://via.placeholder.com/50'}
                            alt={artist.name}
                            className='row-img'
                        />
                        <h3 className="row-name">{artist.spotify.name}</h3>
                        <p className="row-info">Géneros: {formatGenres(artist.spotify.genres)}</p>
                        <p className="row-info">Seguidores: {formatFollowers(artist.spotify.followers)}</p>
                        <button onClick={() => {handleDeleteAdmin(artist.id)}} className="row-trash">
                            <img src={trash} alt="Eliminar" />
                        </button>
                        </>
                    ) : (
                        <h3 className="row-name">{artist.name}</h3> // Solo muestra el nombre si no hay información de Spotify
                    )}
                    </div>
                ))
                )}
                {renderPagination(pageArtists, totalArtists, setPageArtists)}
            </div>
            )}

        {activeButton === "graphs" && (
          <div className="admin-table">
          <p className="admin-text">Mostrando gráficos...</p>

          {loading || !usuariosPorPais || !cancionesPorGenero ? (
                <div className="d-flex justify-content-center align-items-center">
                    <div className="spinner-border spinner-custom" role="status">
                    <span className="sr-only"></span>
                    </div>
                </div>
                ) : (
                <div className="charts-container">
                  <div className="chart">
                    <Bar data={usuariosPorPais} options={chartOptions('Usuarios por país')} />
                  </div>
                  <div className="chart">
                    <Bar data={cancionesPorGenero} options={chartOptions('Canciones mas escuchadas por género')} />
                  </div>
                </div>
                )}
          </div>
        )}

        {!activeButton && (
          <div className="admin-table">
            <p className='admin-text'>Selecciona una opción...</p>
          </div>
        )}
      </main>
    </div>
  );
}
