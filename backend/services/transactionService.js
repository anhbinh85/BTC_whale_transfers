async function processTransactions(db, transactions) {
    try {
        // Access the collection directly using the database object and environment variable
        const collection = db.collection(process.env.COLLECTION_NAME);

        // Insert the transactions (ordered: false is crucial for handling duplicates)
        const result = await collection.insertMany(transactions, { ordered: false });
        console.log(`${result.insertedCount} BTC transactions inserted`);

        // You could log more details from the 'result' object if needed for debugging

    } catch (error) {
        // Handle potential errors (specifically duplicate key errors)
        if (error.code === 11000) {
            console.warn('Duplicate BTC transaction(s) detected. Ignoring.');
        } else {
            console.error('Error processing BTC transactions:', error);
            // In a production app, you'd want more robust error handling (e.g., retries, alerts)
           throw error; //Re-throw error to handler by caller
        }
    }
}

module.exports = { processTransactions };