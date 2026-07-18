import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { apiError } from "../utils/apiError.js";
import { apiRes } from "../utils/apiRes.js";
import { asynchandler } from "../utils/asynchandler.js";

const toggleVideoLike = asynchandler(async (req, res) => {
  const { videoId } = req.params;

  //TODO: toggle like on video

  const vid = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });
  if (vid) {
    const vidremovefromlike = await Like.findOneAndDelete({
      video: videoId,
      likedBy: req.user._id,
    });
  } else {
    const addvidtlike = await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
  }
  return res
    .status(200)
    .json(new apiRes(200, "like on video is toggled successfully"));
});

const toggleCommentLike = asynchandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment

  const com = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });
  if (com) {
    const comremovefromlike = await Like.findOneAndDelete({
      comment: commentId,
      likedBy: req.user._id,
    });
  } else {
    const addcomtlike = await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });
  }
  return res
    .status(200)
    .json(new apiRes(200, "like on comment is toggled successfully"));
});

const toggleTweetLike = asynchandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet

  const twe = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });
  if (twe) {
    const tweremovefromlike = await Like.findOneAndDelete({
      tweet: tweetId,
      likedBy: req.user._id,
    });
  } else {
    const addtwelike = await Like.create({
      tweet: tweetId,
      likedBy: req.user._id,
    });
  }
  return res
    .status(200)
    .json(new apiRes(200, "like on tweet is toggled successfully"));
});

const getLikedVideos = asynchandler(async (req, res) => {
  //TODO: get all liked videos
  const user = req.user._id;
  const allLikedVideos = await Like.find({
    likedBy: user,
    video: { $ne: null },
  }).populate({
    path: "video",
    populate: {
      path: "owner",
      select: "userName fullName avatar email",
    },
  });

  const videos = allLikedVideos
    .filter((like) => like.video)
    .map((like) => like.video);

  return res
    .status(200)
    .json(
      new apiRes(
        200,
        videos,
        "all like videos are fetched successfully",
      ),
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
