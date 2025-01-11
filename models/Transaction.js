const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  time: {
    type: Date,
    default: Date.now,
  },
  mode: {
    type: String,
    enum: ['credit', 'debit', 'upi', 'netbanking', 'wallet', 'cod'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
});

// Instance methods

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
