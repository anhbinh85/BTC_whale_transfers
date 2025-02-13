require('dotenv').config({ path: './.env' }); // Load environment variables FIRST
const express = require('express');
const bodyParser = require('body-parser');
const webhookRoutes = require('./routes/webhook');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb'); // Import MongoClient

const app = express();

app.use(cors()); // Enable CORS (configure more restrictively in production)

// VERY IMPORTANT: Use bodyParser.raw() *before* bodyParser.json() for the webhook route
app.use('/webhook', bodyParser.raw({ type: '*/*', limit: '50mb' })); // Handles ALL content types as raw
app.use(bodyParser.json()); // For any other routes that might need JSON parsing

// --- MongoDB Connection Setup ---
async function connectToMongoDB() {
    try {
        // Construct the URI using environment variables and encodeURIComponent
        const username = encodeURIComponent(process.env.MONGODB_USERNAME);
        const password = encodeURIComponent(process.env.MONGODB_PASSWORD);
        const cluster = process.env.MONGODB_CLUSTER;
        const authSource = process.env.MONGODB_AUTH_SOURCE;
        const authMechanism = process.env.MONGODB_AUTH_MECHANISM;
        const databaseName = process.env.DATABASE_NAME; // Get database name

        // Construct the full connection string.  Database name goes BEFORE the '?'.
        const uri = `mongodb+srv://${username}:${password}@${cluster}.tgmdh.mongodb.net/${databaseName}?retryWrites=true&w=majority&appName=Cluster0`;
        console.log("Connecting to MongoDB using URI:", uri); // Log the full URI

        const client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });

        await client.connect();
        console.log('Successfully connected to MongoDB!');
        // Store the database object in app.locals for use in route handlers
        app.locals.db = client.db(databaseName); // Use client.db() to specify the database

    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit if cannot connect
    }
}
connectToMongoDB(); // Call the connection function


app.use('/webhook', webhookRoutes); // Mount webhook routes


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});