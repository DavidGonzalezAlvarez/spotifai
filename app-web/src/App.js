import 'bootstrap/dist/css/bootstrap.css';
import './styles/App.css';
import spotify from './assets/spotify.png';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Songs from './pages/Songs';
import Artists from './pages/Artists';
import Recommender from './pages/Recommender';

const server_url = process.env.REACT_APP_SERVER_URL;

export default function App() {
  const [yearSongs, setYearSongs] = useState(null);
  const [monthSongs, setMonthSongs] = useState(null);
  const [weekSongs, setWeekSongs] = useState(null);
  const [yearArtistsSongs, setYearArtistsSongs] = useState(null);
  const [monthArtistsSongs, setMonthArtistsSongs] = useState(null);
  const [weekArtistsSongs, setWeekArtistsSongs] = useState(null);
  const [yearArtists, setYearArtists] = useState(null);
  const [monthArtists, setMonthArtists] = useState(null);
  const [weekArtists, setWeekArtists] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recommendedSong, setRecommendedSong] = useState(false);
  const [songTitle, setSongTitle] = useState(false)

  const login = () => {
    axios.get(server_url + '/login')
      .then((response) => {
        const spotifyURL = response.data;
        window.location.href = spotifyURL;
      });
  };

  useEffect(() => {
    axios.get(server_url + '/auth/verify', { withCredentials: true })
      .then((response) => {
        setIsAuthenticated(response.data.authenticated);
      })
      .catch((error) => {
        console.error("Error de autenticación:", error);
        setUserData(null);
        setIsAuthenticated(false);
      });
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      axios.get(server_url + '/get/user', { withCredentials: true })
        .then((response) => {
          setUserData(response.data.userData);
          getUserData();
        })
        .catch((error) => {
          console.log("Error al recibir la información del usuario:", error);
        });
    } else {
      setUserData(null);
    }
  }, [isAuthenticated]);

  const logout = () => {
    axios.get(server_url + '/logout', { withCredentials: true })
      .then(() => {
        setIsAuthenticated(false);
        setUserData(null);
      });
    window.location.href = 'http://localhost:3000/';
  };

  const getUserData = () => {
    setLoading(true);

    const cancelToken = axios.CancelToken.source();

    const requests = [
      axios.get(server_url + '/get/topTracks', {
        params: { timeRange: "long_term", limit: "50" },
        withCredentials: true,
        cancelToken: cancelToken.token,
      }).then((response) => {
        setYearSongs(JSON.parse(response.data.topTracks));
      }),

      axios.get(server_url + '/get/topTracks', {
        params: { timeRange: "medium_term", limit: "50" },
        withCredentials: true,
        cancelToken: cancelToken.token,
      }).then((response) => {
        setMonthSongs(JSON.parse(response.data.topTracks));
      }),

      axios.get(server_url + '/get/topTracks', {
        params: { timeRange: "short_term", limit: "50" },
        withCredentials: true,
        cancelToken: cancelToken.token,
      }).then((response) => {
        setWeekSongs(JSON.parse(response.data.topTracks));
      }),

      axios.get(server_url + '/get/topArtists', {
        params: { timeRange: "long_term", limit: "10" },
        withCredentials: true,
        cancelToken: cancelToken.token,
      }).then((response) => {
        setYearArtists(JSON.parse(response.data.topArtists));
        getYearTopSongs(JSON.parse(response.data.topArtists));
      }),

      axios.get(server_url + '/get/topArtists', {
        params: { timeRange: "medium_term", limit: "10" },
        withCredentials: true,
        cancelToken: cancelToken.token,
      }).then((response) => {
        setMonthArtists(JSON.parse(response.data.topArtists));
        getMonthTopSongs(JSON.parse(response.data.topArtists));
      }),

      axios.get(server_url + '/get/topArtists', {
        params: { timeRange: "short_term", limit: "10" },
        withCredentials: true,
        cancelToken: cancelToken.token,
      }).then((response) => {
        setWeekArtists(JSON.parse(response.data.topArtists));
        getWeekTopSongs(JSON.parse(response.data.topArtists));
      }),
    ];

    Promise.all(requests)
      .then(() => {
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        if (axios.isCancel(error)) {
          console.log("Solicitud cancelada");
        } else {
          console.error("Error al obtener los datos:", error);
        }
      });
  };

  const getYearTopSongs = async (yearArtistsData) => {
    let artistsSongs = [];
  
    try {
      // Crea un array de promesas para todas las peticiones
      const promises = yearArtistsData.items.map(artist => {
        return axios.get(server_url + '/get/artists/topTracks', {
          params: { id: artist.id, name: artist.name },
          withCredentials: true
        });
      });
  
      // Espera a que todas las promesas se resuelvan
      const responses = await Promise.all(promises);
  
      // Combina los resultados en artistsSongs
      responses.forEach(response => {
        artistsSongs = artistsSongs.concat(JSON.parse(response.data.topTracks));
      });
  
      setYearArtistsSongs(artistsSongs);
      return artistsSongs; // Devuelve los datos si necesitas usarlos en otro lugar
    } catch (error) {
      console.error("Error al obtener las canciones principales:", error);
      return []; // Devuelve un array vacío en caso de error
    }
  };

  const getMonthTopSongs = async (monthArtistsData) => {
    let artistsSongs = [];
  
    try {
      // Crea un array de promesas para todas las peticiones
      const promises = monthArtistsData.items.map(artist => {
        return axios.get(server_url + '/get/artists/topTracks', {
          params: { id: artist.id, name: artist.name },
          withCredentials: true
        });
      });
  
      // Espera a que todas las promesas se resuelvan
      const responses = await Promise.all(promises);
  
      // Combina los resultados en artistsSongs
      responses.forEach(response => {
        artistsSongs = artistsSongs.concat(JSON.parse(response.data.topTracks));
      });
  
      setMonthArtistsSongs(artistsSongs);
      return artistsSongs; // Devuelve los datos si necesitas usarlos en otro lugar
    } catch (error) {
      console.error("Error al obtener las canciones principales:", error);
      return []; // Devuelve un array vacío en caso de error
    }
  };

  const getWeekTopSongs = async (weekArtistsData) => {
    let artistsSongs = [];
  
    try {
      // Crea un array de promesas para todas las peticiones
      const promises = weekArtistsData.items.map(artist => {
        return axios.get(server_url + '/get/artists/topTracks', {
          params: { id: artist.id, name: artist.name },
          withCredentials: true
        });
      });
  
      // Espera a que todas las promesas se resuelvan
      const responses = await Promise.all(promises);
  
      // Combina los resultados en artistsSongs
      responses.forEach(response => {
        artistsSongs = artistsSongs.concat(JSON.parse(response.data.topTracks));
      });
  
      setWeekArtistsSongs(artistsSongs);
      return artistsSongs; // Devuelve los datos si necesitas usarlos en otro lugar
    } catch (error) {
      console.error("Error al obtener las canciones principales:", error);
      return []; // Devuelve un array vacío en caso de error
    }
  };

  const hasExecuted = useRef(false);

  const hasRecommended = useRef(false)

  useEffect(() => {
    if (yearSongs && monthSongs && weekSongs && yearArtistsSongs && monthArtistsSongs && weekArtistsSongs && userData && !hasExecuted.current) {
      hasExecuted.current = true;
      console.log("Guardando datos en la base de datos");
      console.log(yearArtistsSongs);
      console.log(monthArtistsSongs);
      console.log(weekArtistsSongs);
      const requestData = {
        yearSongs,
        monthSongs,
        weekSongs,
        yearArtistsSongs,
        monthArtistsSongs,
        weekArtistsSongs,
        userData,
      };
      axios.post(server_url + "/api/save-data", requestData)
        .then((response) => {
          console.log("Datos guardados con exito: ", response.data);
        })
        .catch((error) => {
          console.error('Error al guardar los datos:', error);
        })
    }
  }, [yearSongs, monthSongs, weekSongs, yearArtistsSongs, monthArtistsSongs, weekArtistsSongs, userData])

  useEffect(() => {
    if (!hasRecommended.current && hasExecuted.current && userData) {
      hasRecommended.current = true;
      console.log("Generando recomendacion");
      getRecommendation();
    }
  });

  const getRecommendation = () => {
    setRecommendedSong(null);
    axios.get(server_url + "/api/get/recommendation", {
      params: {
        name: userData.display_name
      }
    }).then((response) => {
      console.log(response);
      setSongTitle(response.data.title);
      axios.get(server_url + '/get/songInfo', {
        params: { songName: encodeURIComponent(response.data.title) },
        withCredentials: true
      }).then((response) => {
        const recommended = JSON.parse(response.data.tracks);
        setRecommendedSong(recommended.tracks.items[0]);
        console.log(recommended);
      });
    });
  }

  return (
    <div className="app-container">
      <nav className="navbar navbar-dark justify-content-between p-3">
        <div className="d-flex align-items-center">
          <img src={spotify} alt="Logo" className="logo" />
          <Link to='/' className="navbar-brand h1">SpotifAI</Link>
        </div>
        <div>
          {!isAuthenticated || userData == null ? (
            <button onClick={login} className="btn btn-outline-light me-2 nav-btn">Log In</button>
          ) : (
            <div className="dropdown">
              <img src={userData.images[0].url} alt='AvatarUser' className='logo'></img>
              <button className="dropdown-toggle dropdown-button" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                {userData.display_name}
              </button>
              <ul className="dropdown-menu">
                <li><Link to="/songs" className="dropdown-item">Canciones</Link></li>
                <li><Link to="/artists" className="dropdown-item">Artistas</Link></li>
                <li><button onClick={logout} className="dropdown-item" type="button">Log Out</button></li>
              </ul>
            </div>
          )}
        </div>
      </nav>

      {loading ? (
        <div className="main-content d-flex justify-content-center align-items-center">
          <div className="spinner-border spinner-custom" role="status">
            <span className="sr-only"></span>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path='/' element={
            <div className="main-content d-flex flex-column justify-content-center align-items-center text-center">
              <h2 className="text-light title">¿Estás buscando algo nuevo para escuchar?</h2>
              {!isAuthenticated ? (
                <button onClick={login} className="btn btn-success mt-4">Empezar a escuchar</button>
              ) : (
                <Link to="/recommender" className="btn btn-success mt-4">Empezar a escuchar</Link>
              )}
            </div>
          }></Route>
          <Route
            path='/songs'
            element={<Songs yearSongs={yearSongs} monthSongs={monthSongs} weekSongs={weekSongs} />}
          />
          <Route
            path='/artists'
            element={<Artists yearArtists={yearArtists} monthArtists={monthArtists} weekArtists={weekArtists} />}
          />
          <Route
            path='/recommender'
            element={<Recommender song={recommendedSong} title={songTitle} userData={userData} updateRecommendation={getRecommendation} />}
          />
        </Routes>
      )}

      <footer>
        
      </footer>
    </div>
  );
}