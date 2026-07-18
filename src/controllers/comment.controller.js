import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { apiError } from "../utils/apiError.js";
import { apiRes } from "../utils/apiRes.js";
import { asynchandler } from "../utils/asynchandler.js";

const getVideoComments = asynchandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const allComments = await Comment.find({
    video: videoId,
  });
  return res
    .status(200)
    .json(new apiRes(200, allComments, "all comments on video"));
});

const addComment = asynchandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req?.body;
  const comment = await Comment.create({
    video: videoId,
    content: content,
    owner: req.user._id,
  });
  return res
    .status(200)
    .json(new apiRes(200, comment, "comment added to a video"));
});

const updateComment = asynchandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req?.body;
  const upComment = await Comment.findByIdAndUpdate(commentId, {
    content: content,
  });

  return res.status(200).json(new apiRes(200, upComment, "comment is updated"));
});

const deleteComment = asynchandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  const delCom = await Comment.findByIdAndDelete(commentId);

  return res.status(200).json(new apiRes(200, "comment is deleted"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
