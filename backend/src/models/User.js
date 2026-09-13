const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, default: '' },
    language: { type: String, default: 'en' },
  },
  { timestamps: true }
);

userSchema.pre('save', function normalize(next) {
  if (this.email) this.email = String(this.email).toLowerCase().trim();
  next();
});

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return { id: String(this._id), email: this.email };
};

module.exports = mongoose.model('User', userSchema);
