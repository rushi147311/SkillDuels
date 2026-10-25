const mongoose = require('mongoose');

const inboxSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['friend_request', 'challenge'],
      required: true,
    },
    roomCode: {
      type: String,
      default: null,
    },
    categoryName: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
  },
  { timestamps: true, collection: 'inbox' }
);

inboxSchema.index({ recipient: 1, sender: 1, type: 1, status: 1 });

module.exports = mongoose.model('Inbox', inboxSchema);
