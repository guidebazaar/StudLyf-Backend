# Studlyf Backend

This is the backend for the Studlyf project, built with Express and MongoDB (Mongoose). It is ready for deployment on Vercel as a serverless function.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file with your MongoDB URI:
   ```env
   MONGO_URI=your_mongodb_connection_string
   ```
3. Start the server locally:
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:5000` by default (if you add `app.listen` for local testing).

## Deploying to Vercel

1. Push this `backend` folder to a GitHub repository.
2. Import the repo into [Vercel](https://vercel.com/import).
3. Set the environment variable `MONGO_URI` in the Vercel dashboard.
4. Vercel will auto-detect the `api.js` entry point and deploy your backend as a serverless function.

## API Endpoints
- `/api/profile/:uid` - Get or update user profile
- `/api/connections/request` - Send connection request
- `/api/connections/accept` - Accept connection request
- `/api/connections/reject` - Reject connection request
- `/api/connections/:uid` - Get all connections for a user
- `/api/messages/send` - Send a message
- `/api/messages/:uid1/:uid2` - Get messages between two users
- `/api/users` - Get all users (for network page)

## Notes
- All messages are auto-deleted after 24 hours.
- Make sure your MongoDB Atlas cluster is accessible from Vercel. 