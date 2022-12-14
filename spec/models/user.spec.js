const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
require("../mongodb_helper");
const User = require("../../models/user");

describe("User model", () => {
  beforeEach((done) => {
    mongoose.connection.collections.users.deleteMany({}).then(() => {
      done();
    });
  });

  afterEach((done) => {
    mongoose.connection.collections.users.deleteMany({}).then(() => {
      done();
    });
  });

  it("has an email address", () => {
    const user = new User({
      name: "someone",
      email: "someone@example.com",
      password: "password",
    });
    expect(user.email).toEqual("someone@example.com");
  });

  it("has a password", () => {
    const user = new User({
      name: "someone",
      email: "someone@example.com",
      password: "password",
    });
    expect(user.password).toEqual("password");
  });

  it("has an name", () => {
    const user = new User({
      name: "someone",
      email: "someone@example.com",
      password: "password",
    });
    expect(user.name).toEqual("someone");
  });

  it("can list all users", (done) => {
    User.find((err, users) => {
      expect(err).toBeNull();
      expect(users).toEqual([]);
      done();
    });
  });

  it("can save a user", (done) => {
    const user = new User({
      name: "someone",
      email: "someone@example.com",
      password: "password",
    });

    user.save((err) => {
      expect(err).toBeNull();

      User.find((err, users) => {
        expect(err).toBeNull();

        expect(users[0]).toMatchObject({
          name: "someone",
          email: "someone@example.com",
          password: "password",
        });
        done();
      });
    });
  });

  it("a new user is saved with a default avatar", (done) => {
    const user = new User({
      name: "someone",
      email: "someone@example.com",
      password: "password",
    });

    user.save((err) => {
      expect(err).toBeNull();

      User.find((err, users) => {
        expect(err).toBeNull();
        expect(users[0]).toMatchObject({
          name: "someone",
          email: "someone@example.com",
          password: "password",
        });
        expect(users[0].image.data).toMatchObject(
          fs.readFileSync(
            path.join(
              __dirname,
              "..",
              "..",
              "public",
              "images",
              "testImage.png"
            )
          )
        );
        expect(users[0].image.contentType).toMatch("image/png");
        done();
      });
    });
  });

  it("email address is unique", async () => {
    const user1 = new User({
      name: "someone one",
      email: "someone@example.com",
      password: "password",
    });

    await user1.save((err) => {
      expect(err).toBeNull();
    });

    const user2 = new User({
      name: "someone two",
      email: "someone@example.com",
      password: "password",
    });

    await user2.save((err) => {
      expect(err.name).toEqual("MongoError");
      expect(err.code).toEqual(11000);
    });
  });

  it("a user has array of confirmed friends", async () => {
    const user1 = new User({
      name: "someone one",
      email: "someone1@example.com",
      password: "password",
      friends: ["123456789012345678901234", "223456789012345678901234"],
    });

    await user1.save().catch((err) => {
      expect(err).toBeNull();
    });

    const users = await User.find({});

    expect(users[0].name).toEqual("someone one");
    expect(users[0].friends[0]).toEqual(
      new mongoose.mongo.ObjectId("123456789012345678901234")
    );
    expect(users[0].friends[1]).toEqual(
      new mongoose.mongo.ObjectId("223456789012345678901234")
    );
  });

  it("a user has array of inbound friend requests", async () => {
    const user1 = new User({
      name: "someone one",
      email: "someone1@example.com",
      password: "password",
      friendRequests: ["123456789012345678901234", "223456789012345678901234"],
    });

    await user1.save().catch((err) => {
      expect(err).toBeNull();
    });

    const users = await User.find({});

    expect(users[0].name).toEqual("someone one");
    expect(users[0].friendRequests[0]).toEqual(
      new mongoose.mongo.ObjectId("123456789012345678901234")
    );
    expect(users[0].friendRequests[1]).toEqual(
      new mongoose.mongo.ObjectId("223456789012345678901234")
    );
  });

  it("user can accept a friend request", async () => {
    const user1 = new User({
      name: "someone one",
      email: "someone1@example.com",
      password: "password",
      friendRequests: ["123456789012345678901234"],
    });

    await user1.save().catch((err) => {
      expect(err).toBeNull();
    });

    await User.updateOne(
      { _id: user1._id },
      {
        $addToSet: { friends: "123456789012345678901234" },
        $pull: { friendRequests: "123456789012345678901234" },
      }
    );

    const finalUser = await User.findById(user1._id);

    expect(finalUser.friendRequests.length).toEqual(0);
    expect(finalUser.friends.length).toEqual(1);
    expect(finalUser.friends[0]).toEqual(
      new mongoose.mongo.ObjectId("123456789012345678901234")
    );
  });

  it("can populate all friends with Users", async () => {
    const user1 = new User({
      name: "Rita",
      email: "rita@gmail.com",
      password: "password",
    });
    await user1.save();

    const user2 = new User({
      name: "Marina",
      email: "marina@gmail.com",
      password: "password",
      friends: [user1._id],
    });
    await user2.save();

    const user = await User.findById(user2._id).populate("friends").exec();

    expect(user.friends.length).toEqual(1);
    expect(user.friends[0].name).toEqual("Rita");
    expect(user.friends[0]._id).toEqual(user1._id);
    expect(user.friends[0].email).toEqual("rita@gmail.com");
  });

  it("can populate all friendRequests with Users", async () => {
    const user1 = new User({
      name: "Rita",
      email: "rita@gmail.com",
      password: "password",
    });
    await user1.save();

    const user2 = new User({
      name: "Marina",
      email: "marina@gmail.com",
      password: "password",
      friendRequests: [user1._id],
    });
    await user2.save();

    const user = await User.findById(user2._id)
      .populate("friendRequests")
      .exec();

    expect(user.friendRequests.length).toEqual(1);
    expect(user.friendRequests[0].name).toEqual("Rita");
    expect(user.friendRequests[0]._id).toEqual(user1._id);
    expect(user.friendRequests[0].email).toEqual("rita@gmail.com");
  });
});
