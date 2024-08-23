const { GraphQLError } = require("graphql");
const { User } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id }).populate("savedBooks");
      }
      throw new GraphQLError("You need to be logged in!", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    },
  },

  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      try {
        const user = await User.create({ username, email, password });
        const token = signToken(user);
        return { token, user };
      } catch (err) {
        // Console log to locate bug.
        console.error("Error in addUser resolver:", err);
        if (err.name === "ValidationError") {
          throw new GraphQLError("Validation error. Please check your input.", {
            extensions: {
              code: "BAD_USER_INPUT",
              validationErrors: err.errors,
            },
          });
        } else if (err.code === 11000) {
          // Duplicate key error.
          throw new GraphQLError("A user with this email already exists.", {
            extensions: { code: "USER_EXISTS" },
          });
        } else {
          throw new GraphQLError("Failed to create user", {
            extensions: { code: "INTERNAL_SERVER_ERROR", error: err.message },
          });
        }
      }
    },
    login: async (parent, { email, password }) => {
      try {
        const user = await User.findOne({ email });

        if (!user) {
          throw new GraphQLError("Incorrect credentials", {
            extensions: { code: "UNAUTHENTICATED" },
          });
        }

        const correctPw = await user.isCorrectPassword(password);

        if (!correctPw) {
          throw new GraphQLError("Incorrect credentials", {
            extensions: { code: "UNAUTHENTICATED" },
          });
        }

        const token = signToken(user);

        return { token, user };
      } catch (err) {
        console.error("Login error:", err);
        throw new GraphQLError(err.message, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
    },
    saveBook: async (parent, { input }, context) => {
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: input } },
          { new: true, runValidators: true }
        );
        return updatedUser;
      }
      throw new GraphQLError("You need to be logged in!", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    },
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        );
        return updatedUser;
      }
      throw new GraphQLError("You need to be logged in!", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    },
  },
};

module.exports = resolvers;