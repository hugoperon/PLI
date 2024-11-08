import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Container, Box, TextField, Grid, Card, CardMedia, CardContent, Typography, Button, Chip, CardActions } from '@mui/material';
import Navbar from './Navbar';

const Home = () => {
  const [mangas, setMangas] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`
      };

      // Récupérer les mangas et les recommandations en parallèle
      const [mangasResponse, recommendationsResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/mangas', { headers }),
        axios.get('http://localhost:5000/api/recommendations', { headers })
      ]);

      setMangas(mangasResponse.data);
      setRecommendations(recommendationsResponse.data);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  };

  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/recommendations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      // Gérez les données des recommandations ici, par exemple :
      setRecommendations(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations:', error);
    }
  };

  const handleReadClick = async (mangaId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/reading-history',
        { manga_id: mangaId },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Ouvrir le manga dans un nouvel onglet
      const manga = mangas.find(m => m.manga_id === mangaId) || 
                   recommendations.find(m => m.manga_id === mangaId);
      if (manga?.read_url) {
        window.open(manga.read_url, '_blank');
      }

      // Rafraîchir les recommandations
      fetchRecommendations();
    } catch (error) {
      console.error('Erreur lors de la lecture:', error);
    }
  };

  const handleSearch = (event) => {
    setSearch(event.target.value);
  };

  const filteredMangas = mangas.filter(manga =>
    manga.title.toLowerCase().includes(search.toLowerCase())
  );

  const MangaCard = ({ manga, onReadClick }) => {
    const [genres, setGenres] = useState([]);

    useEffect(() => {
      const fetchGenres = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(
            `http://localhost:5000/api/manga/${manga.manga_id}/genres`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          setGenres(response.data);
        } catch (error) {
          console.error('Erreur lors de la récupération des genres:', error);
        }
      };
      fetchGenres();
    }, [manga.manga_id]);

    return (
      <Card sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 12px 20px rgba(0,0,0,0.2)'
        }
      }}>
        <CardMedia
          component="img"
          height="400"
          image={manga.image_url}
          alt={manga.title}
          sx={{ objectFit: 'cover' }}
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography gutterBottom variant="h5" component="h2">
            {manga.title}
          </Typography>
          <Box sx={{ mb: 2 }}>
            {genres.map((genre, index) => (
              <Chip
                key={index}
                label={genre}
                size="small"
                sx={{ 
                  mr: 0.5, 
                  mb: 0.5,
                  backgroundColor: '#1a237e',
                  color: 'white'
                }}
              />
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {manga.description}
          </Typography>
        </CardContent>
        <CardActions>
          <Button
            fullWidth
            variant="contained"
            onClick={() => onReadClick(manga.manga_id)}
            sx={{
              bgcolor: '#1a237e',
              '&:hover': {
                bgcolor: '#303f9f'
              }
            }}
          >
            Lire le manga
          </Button>
        </CardActions>
      </Card>
    );
  };

  // Section des recommandations
  const RecommendationSection = () => (
    <Box sx={{ mb: 6 }}>
      <Typography variant="h4" sx={{ mb: 3, color: '#1a237e' }}>
        Recommandations basées sur vos lectures
      </Typography>
      <Grid container spacing={4}>
        {recommendations.map((manga) => (
          <Grid item key={manga.manga_id} xs={12} sm={6} md={4}>
            <Card sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 12px 20px rgba(0,0,0,0.2)'
              }
            }}>
              <CardMedia
                component="img"
                height="400"
                image={manga.image_url}
                alt={manga.title}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h2">
                  {manga.title}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {manga.genres?.split(',').map((genre, index) => (
                    <Chip
                      key={index}
                      label={genre}
                      size="small"
                      sx={{ 
                        mr: 0.5, 
                        mb: 0.5,
                        backgroundColor: '#1a237e',
                        color: 'white'
                      }}
                    />
                  ))}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {manga.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => handleReadClick(manga.manga_id)}
                  sx={{
                    bgcolor: '#1a237e',
                    '&:hover': {
                      bgcolor: '#303f9f'
                    }
                  }}
                >
                  Lire le manga
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 12, mb: 4 }}>
        {recommendations.length > 0 && <RecommendationSection />}
        
        {/* Barre de recherche existante */}
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            label="Rechercher un manga"
            variant="outlined"
            value={search}
            onChange={handleSearch}
            sx={{ 
              mb: 3,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#1a237e',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1a237e',
                }
              }
            }}
            InputProps={{
              sx: { borderRadius: 2 }
            }}
          />
        </Box>

        {/* Liste des mangas avec le nouveau handleReadClick */}
        <Grid container spacing={4}>
          {filteredMangas.map((manga) => (
            <Grid item key={manga.manga_id} xs={12} sm={6} md={4}>
              <MangaCard manga={manga} onReadClick={handleReadClick} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
};

export default Home;