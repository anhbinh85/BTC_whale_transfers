const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' }); // Load .env

const transactionSchema = new mongoose.Schema({
    block: { type: Number, required: true },
    from: [{ type: String, required: true }],
    to: [{ type: String, required: true }],
    txHash: { type: String, required: true, unique: true },
    type: { type: String, required: true, default: 'btc' },
    value: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    processed: { type: Boolean, default: false },
    likelyEntity: { type: String, default: null }
}, { timestamps: true, collection: process.env.COLLECTION_NAME });

// Indexes (keep only the necessary ones)
transactionSchema.index({ type: 1, block: -1 });
transactionSchema.index({ 'from': 1 });
transactionSchema.index({ 'to': 1 });
transactionSchema.index({ value: -1 });
transactionSchema.index({ timestamp: -1 });
transactionSchema.index({ likelyEntity: 1});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;