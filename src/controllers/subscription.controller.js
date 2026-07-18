import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscriber } from "../models/subscriber.model.js";
import { apiError } from "../utils/apiError.js";
import { apiRes } from "../utils/apiRes.js";
import { asynchandler } from "../utils/asynchandler.js";

const toggleSubscription = asynchandler(async (req, res) => {
  const { channelId } = req.params;
  const user = req.user._id;
  // TODO: toggle subscription
  const subscribe = await Subscriber.findOne({
    subscribe: user,
    channel: channelId,
  });
  if (subscribe) {
    await Subscriber.findOneAndDelete({
      subscribe: user,
      channel: channelId,
    });
  } else {
    await Subscriber.create({
      subscribe: user,
      channel: channelId,
    });
  }
  return res
    .status(200)
    .json(new apiRes(200, "subscribe is toogled succesfully"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asynchandler(async (req, res) => {
  const { channelId } = req.params;
  const sublist = await Subscriber.find({ channel: channelId }).populate(
    "subscribe",
  );
  return res
    .status(200)
    .json(new apiRes(200, sublist, "subscribers list is fetched successfully"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asynchandler(async (req, res) => {
  const { subscriberId } = req.params;
  const subchanellist = await Subscriber.find({
    subscribe: subscriberId,
  }).populate("channel");
  return res
    .status(200)
    .json(
      new apiRes(
        200,
        subchanellist,
        "subscribed channel list is fetched successfully",
      ),
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
