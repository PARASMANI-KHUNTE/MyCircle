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
    // Stripe Connect account ID for sellers
    stripeAccountId: {
        type: String,
    },
    // For escrow tracking
    pendingBalance: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

// Static method to get or create wallet
WalletSchema.statics.getOrCreate = async function (userId) {
    let wallet = await this.findOne({ user: userId });
    if (!wallet) {
        wallet = await this.create({ user: userId, balance: 0, pendingBalance: 0 });
    }
    return wallet;
};

// Instance method to add funds (top-up)
WalletSchema.methods.addFunds = async function (amount) {
    if (amount <= 0) throw new Error('Amount must be positive');
    this.balance += amount;
    return this.save();
};

// Instance method to reserve funds for escrow
WalletSchema.methods.reserveFunds = async function (amount) {
    if (amount <= 0) throw new Error('Amount must be positive');
    if (this.balance < amount) throw new Error('Insufficient balance');
    this.balance -= amount;
    this.pendingBalance += amount;
    return this.save();
};

// Instance method to release escrow to seller
WalletSchema.methods.releaseEscrow = async function (amount) {
    if (amount <= 0) throw new Error('Amount must be positive');
    if (this.pendingBalance < amount) throw new Error('Insufficient pending balance');
    this.pendingBalance -= amount;
    this.balance += amount;
    return this.save();
};

// Instance method to refund escrow to buyer
WalletSchema.methods.refundEscrow = async function (amount) {
    if (amount <= 0) throw new Error('Amount must be positive');
    if (this.pendingBalance < amount) throw new Error('Insufficient pending balance');
    this.pendingBalance -= amount;
    this.balance += amount;
    return this.save();
};

// Atomically debit pending (escrowed) funds. Returns null when the wallet
// does not hold enough pending balance, which prevents concurrent releases
// from double-spending the same funds.
WalletSchema.statics.debitPending = async function (userId, amount) {
    if (amount <= 0) throw new Error('Amount must be positive');
    return this.findOneAndUpdate(
        { user: userId, pendingBalance: { $gte: amount } },
        { $inc: { pendingBalance: -amount } },
        { new: true }
    );
};

// Atomically credit spendable balance (upserts the wallet if missing)
WalletSchema.statics.creditBalance = async function (userId, amount) {
    if (amount <= 0) throw new Error('Amount must be positive');
    return this.findOneAndUpdate(
        { user: userId },
        { $inc: { balance: amount } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
};

module.exports = mongoose.model('Wallet', WalletSchema);