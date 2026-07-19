import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { apiRes } from "../utils/apiRes.js";
import { apiError } from "../utils/apiError.js";
import { asynchandler } from "../utils/asynchandler.js";
import { uploadOnCloud, deleteFromCloudinary } from "../utils/file.js";

const getAllVideos = asynchandler(async (req, res) => {
  console.log("get videos start");
  let {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "asc",
    userId,
  } = req.query;
  //TODO: get all videos based on query, sort, pagination

  const filter = {};

  if (userId) {
    filter.owner = userId;
  }

  if (query) {
    filter.title = {
      $regex: query,
      $options: "i",
    };
  }
  const pages = parseInt(page, 10);
  const limits = parseInt(limit, 10);
  const videos = await Video.find(filter)
    .populate("owner", "userName fullName avatar email")
    .sort({
      [sortBy]: sortType === "asc" ? 1 : -1,
    })
    .skip((pages - 1) * limits)
    .limit(limits);

  return res
    .status(200)
    .json(new apiRes(200, videos, "videos fetched successfully"));
});

const publishAVideo = asynchandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  if (!req.files) {
    throw new apiError(400, "video file missing");
  }

  if (!req.files?.thumbnail?.length) {
    throw new apiError(400, "thumbnail file missing");
  }

  const videoLocalPath = req.files.video?.[0].path;

  const thumbnailLocalPath = await req.files.thumbnail?.[0].path;

  if (!(videoLocalPath || thumbnailLocalPath)) {
    throw new apiError(400, "files are missing");
  }

  const video = await uploadOnCloud(videoLocalPath);
  const thumbnail = await uploadOnCloud(thumbnailLocalPath);
  if (!(video || thumbnail)) {
    throw new apiError(400, "files are required");
  }

  const upVideo = await Video.create({
    videoFile: video?.secure_url,
    thumbnail: thumbnail?.secure_url,
    title,
    description,
    durtion: video?.duration,
    owner: req.user?._id,
    isPublic: true,
  });

  return res
    .status(200)
    .json(
      new apiRes(
        200,
        upVideo,
        "video and thumbnail are successfully  uploaded to cloudinary",
      ),
    );
}); //Project break due to exams
const getVideoById = asynchandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, "video not existing");
  }

  if (req.user?._id) {
    const alreadyViewed = video.viewedBy?.some(
      (id) => id.toString() === req.user._id.toString(),
    );
    if (!alreadyViewed) {
      video.views += 1;
      video.viewedBy.push(req.user._id);
      await video.save();
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { watchHistory: videoId },
    });
    await User.findByIdAndUpdate(req.user._id, {
      $push: { watchHistory: { $each: [videoId], $position: 0 } },
    });
  } else {
    video.views += 1;
    await video.save();
  }

  const videoById = await Video.findById(videoId).populate(
    "owner",
    "userName fullName avatar email",
  );

  return res
    .status(200)
    .json(new apiRes(200, videoById, "video successfully fetched by id "));
});
const updateVideo = asynchandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail

  const videoById = await Video.findById(videoId);

  if (!videoById) {
    throw new apiError(404, "video not existing");
  }

  const { title, description } = req.body;
  let newtitle;
  if (title && title.length > 0) {
    newtitle = title;
  }

  let newdesc;
  if (description && description.length > 0) {
    newdesc = description;
  }

  let newthu;
  if (req.files?.thumbnail?.length > 0) {
    const thumbnailLocalPath = req.files.thumbnail?.[0].path;

    const thumbnail = await uploadOnCloud(thumbnailLocalPath);

    if (!thumbnail) {
      throw new apiError(400, "thumbnail are required");
    }
    newthu = thumbnail.secure_url;
  }

  const upVideo = await Video.findByIdAndUpdate(
    videoById,
    {
      thumbnail: newthu || videoById.thumbnail,
      title: newtitle || videoById.title,
      description: newdesc || videoById.description,
    },
    { returnDocument: "after" },
  );

  return res
    .status(200)
    .json(new apiRes(200, upVideo, "video details updaeted successfully"));
});

const deleteVideo = asynchandler(async (req, res) => {
  const { videoId } = req.params;

  //TODO: delete video
  const video = await Video.findByIdAndDelete(videoId);

  if (!video) {
    throw new apiError(500, "erorr in delting video");
  }
  if (video.videoFile) {
    await deleteFromCloudinary(video.videoFile);
  }

  if (video.thumbnail) {
    await deleteFromCloudinary(video.thumbnail);
  }
  return res
    .status(200)
    .json(new apiRes(200, video, "video deleted successfully"));
});

const togglePublishStatus = asynchandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new Error(500, "error in finding video");
  }
  const video = await Video.findById(videoId);
  const update = await Video.findOneAndUpdate(
    video,
    {
      isPublic: !video.isPublic,
    },
    {
      returnDocument: "after",
    },
  );

  res
    .status(200)
    .json(
      new apiRes(200, video, "video is publish status is toggled successfully"),
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
