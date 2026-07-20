import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { apiError } from "../utils/apiError.js";
import { apiRes } from "../utils/apiRes.js";
import { asynchandler } from "../utils/asynchandler.js";

const createPlaylist = asynchandler(async (req, res) => {
  const { name, description } = req.body;
  console.log(name, description);
  const user = req.user._id;
  //TODO: create playlist
  if (!(name || description)) {
    throw new apiError(400, "name and description required");
  }
  const playlist = await Playlist.create({
    name: name,
    description: description,
    owner: user,
  });

  if (!playlist) {
    throw new apiError(500, "serverEror in creating playlist");
  }

  return res.status(200).json(new apiRes(200, playlist, "playlist is created"));
});

const getUserPlaylists = asynchandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  const userPlaylists = await Playlist.find({
    owner: userId,
  })
    .populate({
      path: "video",
      populate: {
        path: "owner",
        select: "userName fullName avatar email",
      },
    })
    .populate("owner", "userName fullName avatar email");

  const formatted = userPlaylists.map((p) => {
    const obj = p.toObject();
    obj.videos = obj.video || [];
    return obj;
  });

  return res
    .status(200)
    .json(new apiRes(200, formatted, "user playlists fetched successfully"));
});

const getPlaylistById = asynchandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  const playlist = await Playlist.findById(playlistId)
    .populate({
      path: "video",
      populate: {
        path: "owner",
        select: "userName fullName avatar email",
      },
    })
    .populate("owner", "userName fullName avatar email");

  if (!playlist) {
    throw new apiError(404, "playlist not found");
  }

  const obj = playlist.toObject();
  obj.videos = obj.video || [];

  return res
    .status(200)
    .json(new apiRes(200, obj, "playlist is fetched successfully"));
});

const addVideoToPlaylist = asynchandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const addvid = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: {
        video: videoId,
      },
    },
    {
      new: true,
    },
  );

  if (!addvid) {
    throw new apiError(404, "playlist not found");
  }

  const populated = await Playlist.findById(playlistId)
    .populate({
      path: "video",
      populate: {
        path: "owner",
        select: "userName fullName avatar email",
      },
    })
    .populate("owner", "userName fullName avatar email");

  const obj = populated.toObject();
  obj.videos = obj.video || [];

  return res
    .status(200)
    .json(new apiRes(200, obj, "video is added to playlist"));
});

const removeVideoFromPlaylist = asynchandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  const remVid = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { video: videoId },
    },
    {
      new: true,
    },
  );

  if (!remVid) {
    throw new apiError(404, "playlist not found");
  }

  const populated = await Playlist.findById(playlistId)
    .populate({
      path: "video",
      populate: {
        path: "owner",
        select: "userName fullName avatar email",
      },
    })
    .populate("owner", "userName fullName avatar email");

  const obj = populated.toObject();
  obj.videos = obj.video || [];

  return res
    .status(200)
    .json(new apiRes(200, obj, "video is removed from playlist"));
});

const deletePlaylist = asynchandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  const delplayist = await Playlist.findByIdAndDelete(playlistId);
  return res
    .status(200)
    .json(new apiRes(200, delplayist, "playlist is deleted"));
});

const updatePlaylist = asynchandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  const upply = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      name: name,
      description: description,
    },
    {
      returnDocument: "after",
    },
  );
  return res.status(200).json(new apiRes(200, upply, "playlist is updated"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
