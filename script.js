// Check authentication
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }

    try {
        const response = await fetch('/api/verify-token', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            window.location.href = '/login.html';
            return false;
        }

        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '/login.html';
        return false;
    }
}

// Music Player JavaScript
class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audio-player');
        this.playBtn = document.getElementById('play-btn');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.volumeSlider = document.getElementById('volume-slider');
        this.progressBar = document.querySelector('.progress-bar');
        this.progressFill = document.getElementById('progress');
        this.currentTimeDisplay = document.getElementById('current-time');
        this.durationDisplay = document.getElementById('duration');
        this.songTitle = document.getElementById('song-title');
        this.artist = document.getElementById('artist');
        this.albumCover = document.getElementById('album-cover');
        this.albumCover.addEventListener('error', () => {
            this.albumCover.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmZmZmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiMwMDAwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
        });
        this.songList = document.getElementById('song-list');
        this.fileInput = document.getElementById('file-input');
        this.addMusicBtn = document.getElementById('add-music-btn');

        this.currentSongIndex = 0;
        this.isPlaying = false;
        this.shuffle = false;
        this.repeat = 0;

        this.playAllMode = null;

        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;

        // Sample playlist - you can replace with your own songs
        this.playlist = [
            {
                title: "Sample Song 1",
                artist: "Artist 1",
                src: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", // Placeholder URL
                cover: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzAwMDAwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U29uZzEgPC90ZXh0Pjwvc3ZnPg==",
                favorite: false
            },
            {
                title: "Sample Song 2",
                artist: "Artist 2",
                src: "https://www.soundjay.com/misc/sounds/bell-ringing-04.wav", // Placeholder URL
                cover: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzAwMDAwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U29uZzIgPC90ZXh0Pjwvc3ZnPg==",
                favorite: false
            },
            {
                title: "Sample Song 3",
                artist: "Artist 3",
                src: "https://www.soundjay.com/misc/sounds/bell-ringing-03.wav", // Placeholder URL
                cover: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzAwMDAwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U29uZzMgPC90ZXh0Pjwvc3ZnPg==",
                favorite: false
            }
        ];

        this.init().catch(err => console.error('Error initializing player:', err));
    }

    async init() {
        this.setupEventListeners();
        await this.loadPlaylistFromBackend();
        if (this.playlist.length === 0) {
            this.loadPlaylistFromStorage();
        }
        await this.loadFavoritesFromBackend();
        this.loadPlaylist();
        this.renderFavoriteList();
        this.loadSong(this.currentSongIndex);
        this.initWebAudio();

        this.setupAnimations();

        this.isDragging = false;
        this.dragStartX = 0;
        this.dragDeltaX = 0;
        const threshold = 30;
        const albumCover = this.albumCover;

        albumCover.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragDeltaX = 0;
            albumCover.style.transition = 'transform 0s';
            albumCover.setPointerCapture(e.pointerId);
        });

        albumCover.addEventListener('pointermove', (e) => {
            if (!this.isDragging) return;
            this.dragDeltaX = e.clientX - this.dragStartX;
            albumCover.style.transform = `translateX(${this.dragDeltaX}px)`;
        });

        const endDrag = (e) => {
            if (!this.isDragging) return;
            this.isDragging = false;
            albumCover.style.transition = 'transform 0.3s ease';
            albumCover.style.transform = 'translateX(0)';
            albumCover.releasePointerCapture(e.pointerId);

            if (this.dragDeltaX > threshold) {
                this.nextSong();
            } else if (this.dragDeltaX < -threshold) {
                this.prevSong();
            }
        };

        albumCover.addEventListener('pointerup', endDrag);
        albumCover.addEventListener('pointercancel', endDrag);
    }

    setupAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Play/Pause button
        this.playBtn.addEventListener('click', () => this.togglePlay());

        // Previous/Next buttons
        this.prevBtn.addEventListener('click', () => this.prevSong());
        this.nextBtn.addEventListener('click', () => this.nextSong());

        // Volume control
        this.volumeSlider.addEventListener('input', (e) => {
            this.audio.volume = e.target.value;
        });

        // Progress bar
        this.progressBar.addEventListener('click', (e) => this.setProgress(e));

        // Audio events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.nextSong());

        this.audio.addEventListener('error', (e) => {
            this.showNotification('Error loading audio file');
            console.error('Audio error:', e);
        });

        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    this.togglePlay();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prevSong();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextSong();
                    break;
                case 'KeyS':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.toggleShuffle();
                    }
                    break;
                case 'KeyR':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.toggleRepeat();
                    }
                    break;
            }
        });

        // File upload
        this.addMusicBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Play All buttons event listeners
        const playAllPlaylistBtn = document.getElementById('playall-playlist');
        if (playAllPlaylistBtn) {
            playAllPlaylistBtn.addEventListener('click', () => this.playAllPlaylist());
        }
        const playAllFavoritesBtn = document.getElementById('playall-favorites');
        if (playAllFavoritesBtn) {
            playAllFavoritesBtn.addEventListener('click', () => this.playAllFavorites());
        }
    }

    initWebAudio() {
        try {
            if (!this.audioContext) {
                // eslint-disable-next-line no-undef
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 256;
                const bufferLength = this.analyser.frequencyBinCount;
                this.dataArray = new Uint8Array(bufferLength);

                const source = this.audioContext.createMediaElementAudioSource(this.audio);
                source.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
            }
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        } catch (e) {
            console.log('Web Audio API not available:', e);
        }
    }

    async loadFavoritesFromBackend() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/user/favorites', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const favorites = await response.json();
                // Mark favorites in the playlist
                this.playlist.forEach(song => {
                    song.favorite = favorites.some(fav => fav.id === song.id);
                });
            }
        } catch (e) {
            console.error('Error loading favorites:', e);
        }
    }

    async toggleFavorite(song) {
        if (!song.id) {
            console.error('Song has no id, cannot toggle favorite');
            this.showNotification('Cannot favorite sample songs. Please upload songs through the admin panel to favorite them.');
            return false;
        }
        try {
            const token = localStorage.getItem('token');
            const method = song.favorite ? 'DELETE' : 'POST';
            const response = await fetch(`/api/user/favorites/${song.id}`, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                song.favorite = !song.favorite;
                return true;
            } else {
                const errorText = await response.text();
                console.error('Failed to toggle favorite:', response.status, errorText);
                this.showNotification('Failed to update favorite');
                return false;
            }
        } catch (e) {
            console.error('Error toggling favorite:', e);
            this.showNotification('Error updating favorite');
            return false;
        }
    }



    async loadPlaylistFromBackend() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/songs', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const songs = await response.json();
                if (songs.length > 0) {
                    this.playlist = songs;
                } else {
                    console.log('Backend returned empty playlist, keeping sample songs');
                }
            } else {
                console.error('Failed to load playlist from backend, keeping sample songs');
            }
        } catch (e) {
            console.error('Error loading playlist from backend, keeping sample songs:', e);
        }
    }

    toggleShuffle() {
        this.shuffle = !this.shuffle;
        const msg = this.shuffle ? 'Shuffle ON' : 'Shuffle OFF';
        this.showNotification(msg);
    }

    toggleRepeat() {
        this.repeat = (this.repeat + 1) % 3;
        const modes = ['Repeat OFF', 'Repeat ALL', 'Repeat ONE'];
        this.showNotification(modes[this.repeat]);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 2000;
            animation: slideIn 0.3s ease-out;
            font-weight: 500;
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    loadPlaylist() {
        this.songList.innerHTML = '';
        this.playlist.forEach((song, index) => {
            const li = document.createElement('li');

            // Create favorite star icon
            const favIcon = document.createElement('span');
            favIcon.classList.add('fav-icon');
            if (song.favorite) {
                favIcon.classList.add('favorited');
                favIcon.textContent = '★'; // filled star
            } else {
                favIcon.textContent = '☆'; // empty star
            }
            favIcon.title = 'Toggle Favorite';

            // Stop click on fav icon from triggering song selection
            favIcon.addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.toggleFavorite(song);
                if (song.favorite) {
                    favIcon.classList.add('favorited');
                    favIcon.textContent = '★';
                } else {
                    favIcon.classList.remove('favorited');
                    favIcon.textContent = '☆';
                }
                this.renderFavoriteList();

                // If currently playing a favorite song that was unfavored, stop play all favorites mode if applicable
                if (this.playAllMode === 'favorites') {
                    const favorites = this.playlist.filter(s => s.favorite);
                    if (!favorites.includes(this.playlist[this.currentSongIndex])) {
                        this.playAllMode = null;
                        this.audio.pause();
                        this.isPlaying = false;
                        this.playBtn.textContent = '▶';
                    }
                }
            });

            li.textContent = `${song.title} - ${song.artist}`;
            li.appendChild(favIcon);

            li.addEventListener('click', () => this.selectSong(index));
            this.songList.appendChild(li);
        });
        this.updateActiveSong();
    }

    renderFavoriteList() {
        const favoriteList = document.getElementById('favorite-list');
        favoriteList.innerHTML = '';
        this.playlist.filter(song => song.favorite).forEach((song) => {
            const li = document.createElement('li');

            // Favorite star icon for favorites list
            const favIcon = document.createElement('span');
            favIcon.classList.add('fav-icon', 'favorited'); // always filled star here
            favIcon.textContent = '★';
            favIcon.title = 'Toggle Favorite';

            favIcon.addEventListener('click', async (e) => {
                e.stopPropagation();
                song.favorite = false;
                const success = await this.toggleFavorite(song);
                if (success) {
                    this.loadPlaylist();
                    this.renderFavoriteList();
                }
            });

            li.textContent = `${song.title} - ${song.artist}`;
            li.appendChild(favIcon);

            li.addEventListener('click', () => this.selectSong(this.playlist.indexOf(song)));

            favoriteList.appendChild(li);
        });

        // Add active and playing classes to favorite list items
        const favoriteItems = favoriteList.querySelectorAll('li');
        favoriteItems.forEach((item, idx) => {
            item.classList.remove('active', 'playing');
            const favSongIndex = this.playlist.indexOf(this.playlist.filter(s => s.favorite)[idx]);
            if (favSongIndex === this.currentSongIndex) {
                item.classList.add('active');
                if (this.isPlaying) {
                    item.classList.add('playing');
                }
            }
        });
    }

    loadSong(index) {
        const song = this.playlist[index];
        console.log('Loading song cover:', song.cover); // Added log for debugging
        this.audio.src = song.src;
        this.songTitle.textContent = song.title;
        this.artist.textContent = song.artist;
        this.albumCover.src = song.cover;
        this.currentSongIndex = index;
        this.updateActiveSong();
    }

    selectSong(index) {
        this.loadSong(index);
        if (this.isPlaying) {
            this.audio.play();
        }
    }



    togglePlay() {
        if (this.isPlaying) {
            this.audio.pause();
            this.playBtn.textContent = '▶';
        } else {
            this.initWebAudio();
            this.audio.play();
            this.playBtn.textContent = '⏸';
        }
        this.isPlaying = !this.isPlaying;
        this.updateActiveSong();
    }

    prevSong() {
        this.currentSongIndex = (this.currentSongIndex - 1 + this.playlist.length) % this.playlist.length;
        this.loadSong(this.currentSongIndex);
        if (this.isPlaying) {
            this.audio.play();
        }
    }

    nextSong() {
        if (this.repeat === 2) {
            this.loadSong(this.currentSongIndex);
            if (this.isPlaying) {
                this.audio.play();
            }
            return;
        }

        let nextIndex;
        if (this.playAllMode === 'playlist') {
            if (this.shuffle) {
                nextIndex = Math.floor(Math.random() * this.playlist.length);
            } else {
                nextIndex = (this.currentSongIndex + 1) % this.playlist.length;
            }
            this.loadSong(nextIndex);
            if (this.isPlaying) {
                this.audio.play();
            }
        } else if (this.playAllMode === 'favorites') {
            const favorites = this.playlist.filter(song => song.favorite);
            if (favorites.length === 0) {
                this.playAllMode = null;
                this.audio.pause();
                this.isPlaying = false;
                this.playBtn.textContent = '▶';
                return;
            }
            const currentFavoriteIndex = favorites.findIndex(song => song.src === this.audio.src);
            let nextFavoriteIndex;
            if (this.shuffle) {
                nextFavoriteIndex = Math.floor(Math.random() * favorites.length);
            } else {
                nextFavoriteIndex = (currentFavoriteIndex + 1) % favorites.length;
            }
            this.loadSong(this.playlist.indexOf(favorites[nextFavoriteIndex]));
            if (this.isPlaying) {
                this.audio.play();
            }
        } else {
            if (this.shuffle) {
                nextIndex = Math.floor(Math.random() * this.playlist.length);
            } else {
                nextIndex = (this.currentSongIndex + 1) % this.playlist.length;
            }
            this.loadSong(nextIndex);
            if (this.isPlaying) {
                this.audio.play();
            }
        }
    }

    setProgress(e) {
        const width = this.progressBar.clientWidth;
        const clickX = e.offsetX;
        const duration = this.audio.duration;
        this.audio.currentTime = (clickX / width) * duration;
    }

    updateProgress() {
        const currentTime = this.audio.currentTime;
        const duration = this.audio.duration;
        const progressPercent = (currentTime / duration) * 100;
        this.progressFill.style.width = `${progressPercent}%`;
        this.currentTimeDisplay.textContent = this.formatTime(currentTime);
    }

    updateDuration() {
        this.durationDisplay.textContent = this.formatTime(this.audio.duration);
    }

    updateActiveSong() {
        const songs = this.songList.querySelectorAll('li');
        console.log('updateActiveSong called:', {
            currentSongIndex: this.currentSongIndex,
            isPlaying: this.isPlaying,
            songsCount: songs.length
        });
        songs.forEach((song, index) => {
            song.classList.remove('active', 'playing');
            if (index === this.currentSongIndex) {
                song.classList.add('active');
                if (this.isPlaying) {
                    song.classList.add('playing');
                }
                console.log(`Song at index ${index} marked active and playing: ${this.isPlaying}`);
            }
        });

        // Update playing class on album cover image
        if (this.isPlaying) {
            this.albumCover.classList.add('playing');
        } else {
            this.albumCover.classList.remove('playing');
        }

        // Update playing class on play button
        if (this.isPlaying) {
            this.playBtn.classList.add('playing');
        } else {
            this.playBtn.classList.remove('playing');
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    async handleFileSelect(event) {
        const files = Array.from(event.target.files);

        for (const file of files) {
            if (file.type.startsWith('audio/')) {
                await this.uploadSongToBackend(file);
            }
        }

        // Reload playlist from backend after uploads
        await this.loadPlaylistFromBackend();
        this.loadPlaylist();

        // Clear the input so the same files can be selected again if needed
        this.fileInput.value = '';
    }

    async uploadSongToBackend(file) {
        const formData = new FormData();
        formData.append('song', file);

        try {
            const response = await fetch('http://localhost:3000/api/upload', {
                method: 'POST',
                body: formData
            });
            if (response.ok) {
                this.showNotification(`Uploaded: ${file.name}`);
            } else {
                this.showNotification('Upload failed');
            }
        } catch (e) {
            console.error('Upload error:', e);
            this.showNotification('Upload error');
        }
    }

    addSongToPlaylist(file) {
        const song = {
            title: this.extractSongTitle(file.name),
            artist: 'Unknown Artist',
            src: URL.createObjectURL(file),
            cover: 'https://via.placeholder.com/200x200/ffffff/000000?text=Music',
            file: file,
            favorite: false
        };

        this.playlist.push(song);
        this.loadPlaylist();
        this.showNotification(`Added: ${song.title}`);

        if (this.playlist.length === 1) {
            this.loadSong(0);
        }
    }

    extractSongTitle(filename) {
        // Remove file extension and clean up the filename
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
        // Remove common patterns like track numbers (01., 1-, etc.)
        return nameWithoutExt.replace(/^(\d+\.?\s*|-)/, '').trim();
    }

    playAllPlaylist() {
        if (this.playlist.length === 0) {
            return; // No songs
        }
        this.playAllMode = 'playlist';
        this.loadSong(0);
        this.audio.play();
        this.isPlaying = true;
        this.playBtn.textContent = '⏸';
        this.updateActiveSong();
    }

    playAllFavorites() {
        const favorites = this.playlist.filter(song => song.favorite);
        if (favorites.length === 0) {
            alert('No favorite songs to play.');
            return;
        }
        this.playAllMode = 'favorites';
        const firstFavIndex = this.playlist.indexOf(favorites[0]);
        this.loadSong(firstFavIndex);
        this.audio.play();
        this.isPlaying = true;
        this.playBtn.textContent = '⏸';
        this.updateActiveSong();
    }
}

// Add logout button to player header
function addLogoutButton() {
    const playerHeader = document.querySelector('.player-header');
    if (playerHeader && !document.getElementById('logout-btn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logout-btn';
        logoutBtn.textContent = 'Logout';
        logoutBtn.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-family: 'Poppins', sans-serif;
            font-size: 14px;
            margin-left: auto;
        `;
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                window.location.href = '/login.html';
            }
        });
        playerHeader.appendChild(logoutBtn);
    }
}

// Initialize the music player when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    const authCheck = document.getElementById('authCheck');
    const playerContainer = document.getElementById('playerContainer');

    const isAuthenticated = await checkAuth();
    if (isAuthenticated) {
        authCheck.style.display = 'none';
        playerContainer.style.display = 'block';
        new MusicPlayer();
        addLogoutButton();
    }
});
