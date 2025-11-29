# Music Player Setup Guide

## Initial Setup

### 1. Database Setup
Ensure you have MySQL running on your system.

### 2. Environment Configuration
Create or update the `.env` file in the backend directory:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=music_player
JWT_SECRET=your-secret-key-change-in-production
```

### 3. Install Dependencies
Navigate to the backend folder and install dependencies:

```bash
cd backend
npm install
```

### 4. Create Admin Account
Before starting the server, create an admin account:

```bash
node create-admin.js
```

Follow the prompts to enter:
- Admin username
- Admin email
- Admin password

### 5. Start the Server
Start the backend server:

```bash
npm start
```

Or use nodemon for development:

```bash
npm run dev
```

The server will run on `http://localhost:3000`

## First-Time Usage

### For Users:
1. Go to `http://localhost:3000/login.html`
2. Click "Register" to create a new account
3. Fill in username, email, password
4. Login with your credentials
5. Use the music player to play songs

### For Admin:
1. Go to `http://localhost:3000/admin-login.html`
2. Login with the admin credentials created during setup
3. Use the admin panel to:
   - **Add Music**: Upload new songs without editing code
   - **Manage Songs**: View and delete songs
   - **View Users**: See all registered users and delete users if needed
   - **Dashboard**: View statistics

## Features

### User Features:
- ✅ User Registration and Login
- ✅ Secure password storage with bcrypt
- ✅ Music player with playlist support
- ✅ Add favorite songs
- ✅ Volume control
- ✅ Progress bar
- ✅ Logout functionality

### Admin Features:
- ✅ Admin Login
- ✅ Add music without editing code
- ✅ View all users
- ✅ Delete users
- ✅ Delete songs
- ✅ Dashboard with statistics
- ✅ Admin Logout

## API Endpoints

### User Authentication
- **POST** `/api/register` - Register new user
- **POST** `/api/login` - User login
- **POST** `/api/verify-token` - Verify user token

### Admin Authentication
- **POST** `/api/admin-login` - Admin login
- **POST** `/api/verify-admin-token` - Verify admin token

### Music Management (User)
- **GET** `/api/songs` - Get all songs

### Music Management (Admin Only)
- **POST** `/api/upload` - Upload new song
- **GET** `/api/admin/songs` - Get all songs (admin)
- **DELETE** `/api/admin/songs/:id` - Delete song

### User Management (Admin Only)
- **GET** `/api/admin/users` - Get all users
- **DELETE** `/api/admin/users/:id` - Delete user

## Database Tables

### users
- id (INT, Primary Key)
- username (VARCHAR, Unique)
- email (VARCHAR, Unique)
- password (VARCHAR)
- created_at (TIMESTAMP)

### admins
- id (INT, Primary Key)
- username (VARCHAR, Unique)
- email (VARCHAR, Unique)
- password (VARCHAR)
- created_at (TIMESTAMP)

### songs
- id (INT, Primary Key)
- title (VARCHAR)
- artist (VARCHAR)
- filename (VARCHAR, Unique)
- src (VARCHAR)
- cover (LONGTEXT)
- favorite (BOOLEAN)
- created_at (TIMESTAMP)

### user_favorites
- id (INT, Primary Key)
- user_id (INT, Foreign Key)
- song_id (INT, Foreign Key)
- created_at (TIMESTAMP)

## Security Notes

⚠️ **Important**: Before deploying to production:
1. Change `JWT_SECRET` in `.env` to a strong, random string
2. Update database credentials
3. Set proper CORS origins
4. Use HTTPS
5. Implement rate limiting

## Troubleshooting

### Cannot connect to database
- Ensure MySQL is running
- Check database credentials in `.env`
- Verify database name is correct

### Port 3000 already in use
- Change the port in `server.js`
- Or kill the process using port 3000

### Admin login not working
- Ensure you created an admin account using `node create-admin.js`
- Verify admin credentials are correct

### Music upload not working
- Ensure admin is logged in
- Check that the `music` folder exists
- Verify file permissions

## Support

For issues or questions, check the following:
1. Verify all environment variables are set correctly
2. Ensure MySQL database is running
3. Check server logs for error messages
4. Verify file permissions on the music folder
