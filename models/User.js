const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  band: {
    type: String,
    required: true,
    enum: [1, 2, 3],
    default: 3,
  },
  clients: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Instance methods
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStampAt = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimeStampAt;
  }

  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
