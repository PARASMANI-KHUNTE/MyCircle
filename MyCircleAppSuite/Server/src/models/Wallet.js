const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    balance: {
        type: Number,
        default: 0,
        min: 0,
    },
    currency: {
        type: String,
        default: 'INR',
    },
}, { timestamps: true });

// Static method to get or create wallet
WalletSchema.statics.getOrCreate = async function (userId) {
    let wallet = await this.findOne({ user: userId });
    if (!wallet) {
        wallet = await this.create({ user: userId, balance: 0 });
    }
    return wallet;
};

// Instance method to add funds
WalletSchema.methods.addFunds = async function (amount) {
    if (amount <= 0) throw new Error('Amount must be positive');
    this.balance += amount;
    return this.save();
};

// Static method to credit balance (upserts the wallet if missing)
WalletSchema.statics.creditBalance = async function (userId, amount) {
    if (amount <= 0) throw new Error('Amount must be positive');
    return this.findOneAndUpdate(
        { user: userId },
        { $inc: { balance: amount } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
};

module.exports = mongoose.model('Wallet', WalletSchema);