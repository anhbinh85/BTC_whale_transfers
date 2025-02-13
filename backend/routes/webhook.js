const express = require('express');
const router = express.Router();
const transactionService = require('../services/transactionService');
const crypto = require('crypto');

function verifyQuickNodeSignature(secretKey, payload, nonce, timestamp, givenSignature) {
    // 1. Concatenate the components as strings
    const signatureData = nonce + timestamp + payload;

    // 2. Create the HMAC with the SHA256 algorithm, using the secret key directly
    const hmac = crypto.createHmac('sha256', secretKey);

    // 3. Update the HMAC with the signature data (no need to convert to Buffer first)
    hmac.update(signatureData);

    // 4. Get the computed signature as a hex string
    const computedSignature = hmac.digest('hex');

    console.log('\nSignature Debug:');
    console.log('Message components:');
    console.log('- Nonce:', nonce);
    console.log('- Timestamp:', timestamp);
    console.log('- Payload first 100 chars:', payload.substring(0, 100)); // Limit for logging
    console.log('\nSignatures:');
    console.log('- Computed:', computedSignature);
    console.log('- Given:', givenSignature);


    // 5. Compare using timingSafeEqual (both signatures as hex Buffers)
    return crypto.timingSafeEqual(
        Buffer.from(computedSignature, 'hex'),
        Buffer.from(givenSignature, 'hex')
    );
}

router.post('/', async (req, res) => {
    try {
        // Get headers and secret key
        const secretKey = process.env.QUICKNODE_WEBHOOK_SECRET;
        const nonce = req.headers['x-qn-nonce'];
        const timestamp = req.headers['x-qn-timestamp'];
        const givenSignature = req.headers['x-qn-signature'];

        // Header validation
        if (!nonce || !timestamp || !givenSignature) {
            console.error('Missing required headers');
            return res.status(400).send('Missing required headers');
        }

        // Get the raw request body as a UTF-8 string
        const payloadString = req.body.toString('utf8');

        // Verify the signature
        const isValid = verifyQuickNodeSignature(secretKey, payloadString, nonce, timestamp, givenSignature);

        if (!isValid) {
            console.error('Invalid signature');
            return res.status(401).send('Invalid signature');
        }

        console.log('Signature verified successfully');

        // Parse the JSON payload *after* signature verification
        const parsedBody = JSON.parse(payloadString);

        if (!parsedBody || !parsedBody.whaleTransactions) {
            return res.status(400).json({ error: 'Bad Request', message: 'Invalid request body' });
        }

        const transformedData = parsedBody.whaleTransactions.map(item => {
            // Helper function to clean and split addresses
            const cleanAndSplitAddresses = (addrStr) => {
                if (typeof addrStr !== 'string') {
                    return [];
                }
                return addrStr.split(',')
                    .map(addr => addr.trim())
                    .filter(addr => /^[a-zA-Z0-9]+$/.test(addr)); // Keep only alphanumeric
            };

            return {
                block: item.block,
                from: cleanAndSplitAddresses(item.from),
                to: cleanAndSplitAddresses(item.to),
                txHash: item.txHash,
                type: item.type,
                value: item.value,
            };
        });

        // Access the database connection from app.locals
        const db = req.app.locals.db;
        await transactionService.processTransactions(db, transformedData);

        res.status(200).json({ message: 'Data received and processing' });

    } catch (error) {
        console.error('Error in /webhook:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
});

module.exports = router;