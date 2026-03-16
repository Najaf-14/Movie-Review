 // ========== MOBILE MENU TOGGLE ==========
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const navLinks = document.getElementById('navLinks');

        if (mobileMenuToggle && navLinks) {
            // Ensure menu is closed on page load for mobile
            if (window.innerWidth <= 768) {
                navLinks.classList.remove('active');
            }

            mobileMenuToggle.addEventListener('click', function() {
                navLinks.classList.toggle('active');

                // Change icon between bars and times (X)
                const icon = this.querySelector('i');
                if (navLinks.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });

            // Close menu when clicking on a link
            const navLinksItems = navLinks.querySelectorAll('a');
            navLinksItems.forEach(link => {
                link.addEventListener('click', function() {
                    if (window.innerWidth <= 768) {
                        navLinks.classList.remove('active');
                        const icon = mobileMenuToggle.querySelector('i');
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                });
            });

            // Close menu when clicking outside
            document.addEventListener('click', function(event) {
                const isClickInsideNav = navLinks.contains(event.target);
                const isClickOnToggle = mobileMenuToggle.contains(event.target);

                if (!isClickInsideNav && !isClickOnToggle && navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    const icon = mobileMenuToggle.querySelector('i');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });

            // Close menu on window resize if entering desktop mode
            window.addEventListener('resize', function() {
                if (window.innerWidth > 768) {
                    navLinks.classList.remove('active');
                    const icon = mobileMenuToggle.querySelector('i');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        }

        // ========== CONFIGURATION ==========
        // TMDB API Configuration
        const API_CONFIG = {
            apiKey: 'aacb4b06621ad9d9037e2cf52aaf8f92',
            bearerToken: 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhYWNiNGIwNjYyMWFkOWQ5MDM3ZTJjZjUyYWFmOGY5MiIsIm5iZiI6MTc3MzY4MDQwNy43MTksInN1YiI6IjY5YjgzNzE3YWFmZDE1ZTAzNTk1ZmRkYSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.pkeBxvvAMkOWeQfa0KbsezOPbRC05KrHTOWDbK7zmIs',
            baseUrl: 'https://api.themoviedb.org/3',
            imageBaseUrl: 'https://image.tmdb.org/t/p/w500',
            trendsEndpoint: 'https://api.themoviedb.org/3/trending/movie/week',
            moviesEndpoint: 'https://api.themoviedb.org/3/discover/movie',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhYWNiNGIwNjYyMWFkOWQ5MDM3ZTJjZjUyYWFmOGY5MiIsIm5iZiI6MTc3MzY4MDQwNy43MTksInN1YiI6IjY5YjgzNzE3YWFmZDE1ZTAzNTk1ZmRkYSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.pkeBxvvAMkOWeQfa0KbsezOPbRC05KrHTOWDbK7zmIs',
                'Content-Type': 'application/json'
            }
        };

        // ========== GLOBAL STATE ==========
        let trendsData = [];
        let moviesData = [];
        let filteredMoviesData = [];
        let currentGenre = 'all';

        // ========== UTILITY FUNCTIONS ==========

        /**
         * Create a movie card element
         * @param {Object} movie - TMDB movie object
         * @returns {HTMLElement} - Movie card element
         */
        function createMovieCard(movie) {
            const card = document.createElement('a');
            card.className = 'movie-card';
            card.href = `review.html?id=${movie.id}`;

            // Get poster URL from TMDB
            const posterUrl = movie.poster_path
                ? `${API_CONFIG.imageBaseUrl}${movie.poster_path}`
                : 'https://via.placeholder.com/180x270?text=No+Poster';

            // Extract year from release_date
            const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';

            // Get rating (TMDB uses vote_average out of 10)
            const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

            card.innerHTML = `
                <img src="${posterUrl}" alt="${movie.title || movie.name}" class="movie-card-poster"
                     onerror="this.src='https://via.placeholder.com/180x270?text=No+Poster'">
                <div class="movie-card-info">
                    <h3 class="movie-card-title" title="${movie.title || movie.name}">${movie.title || movie.name}</h3>
                    <div class="movie-card-meta">
                        <span class="movie-card-year">${year}</span>
                        <span class="movie-card-rating">
                            <i class="fa-solid fa-star"></i> ${rating}
                        </span>
                    </div>
                </div>
            `;

            return card;
        }

        /**
         * Show loading state
         */
        function showLoading(section) {
            document.getElementById(`${section}-loading`).style.display = 'block';
            document.getElementById(`${section}-error`).style.display = 'none';
            document.getElementById(`${section}-row`).innerHTML = '';
        }

        /**
         * Hide loading state
         */
        function hideLoading(section) {
            document.getElementById(`${section}-loading`).style.display = 'none';
        }

        /**
         * Show error state
         */
        function showError(section, message) {
            hideLoading(section);
            const errorEl = document.getElementById(`${section}-error`);
            document.getElementById(`${section}-error-msg`).textContent = message;
            errorEl.style.display = 'block';
        }

        /**
         * Render movie cards to the DOM
         */
        function renderMovieCards(movies, containerId) {
            const container = document.getElementById(containerId);
            container.innerHTML = '';

            if (movies.length === 0) {
                container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-film"></i> No movies found</div>';
                return;
            }

            movies.forEach(movie => {
                container.appendChild(createMovieCard(movie));
            });
        }

        // ========== TRENDS NOW SECTION ==========

        /**
         * Fetch trending movies from TMDB API
         */
        async function fetchTrendingMovies() {
            showLoading('trends');

            try {
                // Fetch trending movies from TMDB
                const response = await fetch(API_CONFIG.trendsEndpoint, {
                    headers: API_CONFIG.headers
                });

                if (!response.ok) throw new Error('Failed to fetch trending movies');

                const data = await response.json();
                trendsData = data.results || []; // TMDB returns results array

                // Add genre_ids to each movie for filtering
                trendsData = trendsData.map(movie => ({
                    ...movie,
                    genres: getGenreNames(movie.genre_ids || [])
                }));

                filterTrendsByGenre(currentGenre);
                hideLoading('trends');

            } catch (error) {
                console.error('Error fetching trending movies:', error);
                showError('trends', 'Failed to load trending movies. Please try again later.');
            }
        }

        /**
         * Convert TMDB genre IDs to genre names for filtering
         */
        function getGenreNames(genreIds) {
            const genreMap = {
                28: 'action',
                12: 'adventure',
                16: 'animation',
                35: 'comedy',
                80: 'crime',
                99: 'documentary',
                18: 'drama',
                10751: 'family',
                14: 'fantasy',
                36: 'history',
                27: 'horror',
                10402: 'music',
                9648: 'mystery',
                10749: 'romance',
                878: 'sci-fi',
                10770: 'tv',
                53: 'thriller',
                10752: 'war',
                37: 'western'
            };

            return genreIds.map(id => genreMap[id]).filter(Boolean);
        }

        /**
         * Filter trends by genre
         */
        function filterTrendsByGenre(genre) {
            currentGenre = genre;

            let filtered;
            if (genre === 'all') {
                filtered = trendsData;
            } else {
                // 🔧 Adjust this filter logic based on your API data structure
                // This assumes each movie has a 'genres' array or 'genre' string
                filtered = trendsData.filter(movie => {
                    if (Array.isArray(movie.genres)) {
                        return movie.genres.some(g => g.toLowerCase() === genre.toLowerCase());
                    } else if (movie.genre) {
                        return movie.genre.toLowerCase() === genre.toLowerCase();
                    }
                    return false;
                });
            }

            renderMovieCards(filtered, 'trends-row');
        }

        /**
         * Setup genre tab click handlers
         */
        function setupGenreTabs() {
            const tabs = document.querySelectorAll('.genre-tab');

            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    // Update active state
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');

                    // Filter movies
                    const genre = tab.getAttribute('data-genre');
                    filterTrendsByGenre(genre);
                });
            });
        }

        // ========== MOVIES SECTION ==========

        /**
         * Fetch all movies from TMDB API
         */
        async function fetchMovies() {
            showLoading('movies');

            try {
                // Fetch popular movies from TMDB (sorted by popularity)
                const response = await fetch(`${API_CONFIG.moviesEndpoint}?sort_by=popularity.desc&page=1`, {
                    headers: API_CONFIG.headers
                });

                if (!response.ok) throw new Error('Failed to fetch movies');

                const data = await response.json();
                moviesData = data.results || []; // TMDB returns results array

                // Add genre names for filtering
                moviesData = moviesData.map(movie => ({
                    ...movie,
                    genres: getGenreNames(movie.genre_ids || [])
                }));

                filteredMoviesData = [...moviesData];
                applyMovieFilters();
                hideLoading('movies');

            } catch (error) {
                console.error('Error fetching movies:', error);
                showError('movies', 'Failed to load movies. Please try again later.');
            }
        }

        /**
         * Apply sorting and rating filters
         */
        function applyMovieFilters() {
            const sortValue = document.getElementById('sortSelect').value;
            const minRating = parseFloat(document.getElementById('ratingSlider').value);

            // Filter by rating (TMDB uses vote_average out of 10)
            filteredMoviesData = moviesData.filter(movie => (movie.vote_average || 0) >= minRating);

            // Sort
            switch (sortValue) {
                case 'latest':
                    // Sort by release_date (newest first)
                    filteredMoviesData.sort((a, b) => {
                        const dateA = a.release_date ? new Date(a.release_date) : new Date(0);
                        const dateB = b.release_date ? new Date(b.release_date) : new Date(0);
                        return dateB - dateA;
                    });
                    break;
                case 'year':
                    // Sort by year (newest first)
                    filteredMoviesData.sort((a, b) => {
                        const yearA = a.release_date ? new Date(a.release_date).getFullYear() : 0;
                        const yearB = b.release_date ? new Date(b.release_date).getFullYear() : 0;
                        return yearB - yearA;
                    });
                    break;
                case 'a-z':
                    // Sort by title alphabetically
                    filteredMoviesData.sort((a, b) => {
                        const titleA = (a.title || a.name || '').toLowerCase();
                        const titleB = (b.title || b.name || '').toLowerCase();
                        return titleA.localeCompare(titleB);
                    });
                    break;
            }

            renderMovieCards(filteredMoviesData, 'movies-row');
        }

        /**
         * Setup movie filter controls
         */
        function setupMovieFilters() {
            const sortSelect = document.getElementById('sortSelect');
            const ratingSlider = document.getElementById('ratingSlider');
            const ratingValue = document.getElementById('ratingValue');

            // Sort dropdown
            sortSelect.addEventListener('change', applyMovieFilters);

            // Rating slider
            ratingSlider.addEventListener('input', (e) => {
                ratingValue.textContent = e.target.value;
                applyMovieFilters();
            });
        }

        // ========== INITIALIZATION ==========

        /**
         * Initialize the application
         */
        function init() {
            // Setup event handlers
            setupGenreTabs();
            setupMovieFilters();

            // Fetch data from TMDB API
            fetchTrendingMovies();
            fetchMovies();
        }

        // Run when DOM is fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }