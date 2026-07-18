import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscriber } from "../models/subscriber.model.js";
import { Like } from "../models/like.model.js";
import { apiError } from "../utils/apiError.js";
import { apiRes } from "../utils/apiRes.js";
import { asynchandler } from "../utils/asynchandler.js";

const getChannelStats = asynchandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const user = req.user._id;
  const totalVideos = await Video.countDocuments({
    owner: user,
  });

  const totalViews = await Video.aggregate([
    {
      $match: {
        owner: user,
      },
    },
    {
      $group: {
        _id: null,
        totalViews: {
          $sum: "$views",
        },
      },
    },
  ]);

  const totalSubscribers = await Subscriber.countDocuments({
    channel: user,
  });

  const totalLikes = await Like.aggregate([
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
      },
    },
    {
      $unwind: "$videoDetails",
    },
    {
      $match: {
        "videoDetails.owner": user,
      },
    },
    {
      $group: {
        _id: null,
        totalLikes: {
          $sum: 1,
        },
      },
    },
  ]);
  res.status(200).json(
    new apiRes(
      200,
      {
        totalVideos,
        totalViews: totalViews[0]?.totalViews || 0,
        totalSubscribers,
        totalLikes: totalLikes[0]?.totalLikes || 0,
      },
      "Dashboard data",
    ),
  );
});

const getChannelVideos = asynchandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const user = req.user._id;
  const videos = await Video.find({
    owner: user,
  });
  return res.status(200).json(new apiRes(200, videos, "all videos of channel"));
});

export { getChannelStats, getChannelVideos };
