import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectedDB from './configs/mongodb.js';

// App configuration
const PORT = process.env.PORT || 4000;
const app = express();

// Initialize middleware
app.use(express.json());
app.use(cors());

// Connect to database
async function initialize() {
  await connectedDB();
}

// API routes
app.get('/', (req, res) => res.send("API Working"));

// Export the app as a serverless function
export default async (req, res) => {
  await initialize(); // Ensure DB connection
  app(req, res);      // Pass request and response to the express app
};
