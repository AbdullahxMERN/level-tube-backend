import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiRes } from "../utils/apiRes.js";
import { asynchandler } from "../utils/asynchandler.js";

const createTweet = asynchandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  if (!content?.trim()) {
    throw new apiError(400, "tweet content is required");
  }
  const tweet = await Tweet.create({
    content: content,
    owner: req.user._id,
  });
  const populated = await Tweet.findById(tweet._id).populate(
    "owner",
    "userName fullName avatar email",
  );
  return res.status(200).json(new apiRes(200, populated, "tweet is created"));
});

const getUserTweets = asynchandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;
  const userTwe = await Tweet.find({
    owner: userId,
  })
    .populate("owner", "userName fullName avatar email")
    .sort({ createdAt: -1 });

  return res.status(200).json(new apiRes(200, userTwe, "user tweets"));
});

const getAllTweets = asynchandler(async (req, res) => {
  const tweets = await Tweet.find({})
    .populate("owner", "userName fullName avatar email")
    .sort({ createdAt: -1 });
  return res
    .status(200)
    .json(new apiRes(200, tweets, "all tweets fetched successfully"));
});

const updateTweet = asynchandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;
  const upTwe = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      content: content,
    },
    { new: true },
  ).populate("owner", "userName fullName avatar email");

  return res.status(200).json(new apiRes(200, upTwe, "tweet is updated"));
});

const deleteTweet = asynchandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  const delTwe = await Tweet.findByIdAndDelete(tweetId);

  return res.status(200).json(new apiRes(200, delTwe, "tweet is deleted"));
});

export { createTweet, getUserTweets, getAllTweets, updateTweet, deleteTweet };
