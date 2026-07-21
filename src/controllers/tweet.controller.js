import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { apiError } from "../utils/apiError.js";
import { apiRes } from "../utils/apiRes.js";
import { asynchandler } from "../utils/asynchandler.js";

const getTweetsWithLikes = async (matchQuery, userId) => {
  return await Tweet.aggregate([
    {
      $match: matchQuery,
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $unwind: {
        path: "$ownerDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
        isLiked: {
          $cond: {
            if: {
              $in: [
                userId ? new mongoose.Types.ObjectId(userId) : null,
                "$likes.likedBy",
              ],
            },
            then: true,
            else: false,
          },
        },
        owner: {
          _id: "$ownerDetails._id",
          userName: "$ownerDetails.userName",
          fullName: "$ownerDetails.fullName",
          avatar: "$ownerDetails.avatar",
          email: "$ownerDetails.email",
        },
      },
    },
    {
      $project: {
        likes: 0,
        ownerDetails: 0,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);
};

const createTweet = asynchandler(async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) {
    throw new apiError(400, "tweet content is required");
  }
  const tweet = await Tweet.create({
    content: content,
    owner: req.user._id,
  });
  const tweets = await getTweetsWithLikes({ _id: tweet._id }, req.user?._id);
  return res.status(200).json(new apiRes(200, tweets[0], "tweet is created"));
});

const getUserTweets = asynchandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new apiError(400, "Invalid user ID");
  }
  const userTwe = await getTweetsWithLikes(
    { owner: new mongoose.Types.ObjectId(userId) },
    req.user?._id,
  );
  return res.status(200).json(new apiRes(200, userTwe, "user tweets"));
});

const getAllTweets = asynchandler(async (req, res) => {
  const tweets = await getTweetsWithLikes({}, req.user?._id);
  return res
    .status(200)
    .json(new apiRes(200, tweets, "all tweets fetched successfully"));
});

const updateTweet = asynchandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;
  if (!isValidObjectId(tweetId)) {
    throw new apiError(400, "Invalid tweet ID");
  }
  
  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      content: content,
    },
    { new: true },
  );

  if (!updatedTweet) {
    throw new apiError(404, "Tweet not found");
  }

  const tweets = await getTweetsWithLikes(
    { _id: new mongoose.Types.ObjectId(tweetId) },
    req.user?._id,
  );

  return res.status(200).json(new apiRes(200, tweets[0], "tweet is updated"));
});

const deleteTweet = asynchandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new apiError(400, "Invalid tweet ID");
  }
  const delTwe = await Tweet.findByIdAndDelete(tweetId);
  if (!delTwe) {
    throw new apiError(404, "Tweet not found");
  }
  // Clean up likes associated with this tweet
  await Like.deleteMany({ tweet: tweetId });

  return res.status(200).json(new apiRes(200, delTwe, "tweet is deleted"));
});

export { createTweet, getUserTweets, getAllTweets, updateTweet, deleteTweet };
