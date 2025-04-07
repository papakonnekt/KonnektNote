import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'dotenv/config'; // Load environment variables
import path from 'path';
import fs from 'fs'; // Import fs for reading cert files
import https from 'https'; // Import https module

const app: Express = express();
const port = process.env.PORT || 3001; // Use port from .env or default to 3001

// --- Middleware ---
// Enable CORS for all origins (adjust for production later)
app.use(cors());
// Parse JSON request bodies
app.use(express.json());
// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
// __dirname points to the 'dist' folder after build, so go up one level
const uploadsDir = path.join(__dirname, '../uploads');
console.log(`Serving static files from: ${uploadsDir}`); // Log the directory path
app.use('/uploads', express.static(uploadsDir));
// --- Routes ---
// Basic health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Import Routers
import authRoutes from './routes/authRoutes';
import graphRoutes from './routes/graphRoutes';
import nodeRoutes from './routes/nodeRoutes';
import edgeRoutes from './routes/edgeRoutes'; // Import edge routes
import noteRoutes from './routes/noteRoutes'; // Import note routes
import checklistRoutes from './routes/checklistRoutes'; // Import checklist routes
import checklistItemRoutes from './routes/checklistItemRoutes'; // Import checklist item routes
import imageRoutes from './routes/imageRoutes'; // Import image routes
import syncRoutes from './routes/syncRoutes'; // Import sync routes
// Mount Routers
app.use('/api/auth', authRoutes);
app.use('/api/graphs', graphRoutes);
app.use('/api/graphs/:graphId/nodes', nodeRoutes);
app.use('/api/graphs/:graphId/edges', edgeRoutes); // Mount edge routes nested under graphs
app.use('/api/notes', noteRoutes); // Mount note routes
app.use('/api/checklists', checklistRoutes); // Mount checklist routes
// Mount checklist item routes nested under the checklist routes
// This allows checklistItemRoutes to access req.params.checklistId
app.use('/api/checklists/:checklistId', checklistItemRoutes);
app.use('/api/images', imageRoutes); // Mount image routes
app.use('/api/sync', syncRoutes); // Mount sync routes
// --- Error Handling ---
// Basic 404 handler for routes not found
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ message: 'Not Found' });
});

// Generic error handler (must be last middleware)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err); // Log error for debugging
  res.status(500).json({ message: 'Internal Server Error' });
});

// --- Server Startup ---
const useHttps = process.env.USE_HTTPS === 'true';
const certPath = process.env.SSL_CERT_PATH;
const keyPath = process.env.SSL_KEY_PATH;

if (useHttps && certPath && keyPath) {
    try {
        const options = {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
        };
        https.createServer(options, app).listen(port, () => {
            console.log(`[server]: HTTPS Server is running at https://localhost:${port}`);
        });
    } catch (error) {
        console.error('Error setting up HTTPS server. Check SSL certificate paths in .env', error);
        console.log('[server]: Falling back to HTTP.');
        // Fallback to HTTP if HTTPS setup fails
        app.listen(port, () => {
            console.log(`[server]: HTTP Server is running at http://localhost:${port}`);
        });
    }
} else {
    // Start HTTP server if HTTPS is not enabled or configured
    app.listen(port, () => {
        if (useHttps) {
            console.warn('[server]: USE_HTTPS is true but SSL_CERT_PATH or SSL_KEY_PATH are missing in .env. Starting HTTP server instead.');
        }
        console.log(`[server]: HTTP Server is running at http://localhost:${port}`);
    });
}