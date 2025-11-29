require('dotenv').config();
const { pool } = require('./database');

async function insertSongs() {
  const songs = [
    {
      title: 'Roots Bintu Pabra',
      artist: 'Unknown Artist',
      filename: 'Roots Bintu Pabra 320 Kbps.mp3',
      src: '/music/Roots Bintu Pabra 320 Kbps.mp3',
      cover: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmZmZmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiMwMDAwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='
    },
    {
      title: 'Unchi Haveli',
      artist: 'Renuka Panwar',
      filename: 'Unchi Haveli - Renuka Panwar (pagalall.com).mp3',
      src: '/music/Unchi Haveli - Renuka Panwar (pagalall.com).mp3',
      cover: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZmZmZmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiMwMDAwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='
    }
  ];

  try {
    const connection = await pool.getConnection();
    for (const song of songs) {
      await connection.query(
        'INSERT INTO songs (title, artist, filename, src, cover) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title), artist=VALUES(artist)',
        [song.title, song.artist, song.filename, song.src, song.cover]
      );
    }
    connection.release();
    console.log('Songs inserted successfully');
  } catch (error) {
    console.error('Error inserting songs:', error);
  } finally {
    process.exit();
  }
}

insertSongs();
