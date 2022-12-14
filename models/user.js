const mongoose = require("mongoose");
const fs = require("fs");
const path = require('path')

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  image: {
    data: {
      type: Buffer,
      default: () => {
        return fs.readFileSync(path.join(__dirname, '..', 'public', 'images', 'testImage.png'));
      },
    },
    contentType: {
      type: String,
      default: () => {
        return "image/png";
      },
    },
  },  
  friends: [{type: mongoose.SchemaTypes.ObjectId, ref: "User"}],
  friendRequests: [{type: mongoose.SchemaTypes.ObjectId, ref: "User"}],
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
