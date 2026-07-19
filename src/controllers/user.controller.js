import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiRes } from "../utils/apiRes.js";
import { asynchandler } from "../utils/asynchandler.js";
import { uploadOnCloud } from "../utils/file.js";
import jwt from "jsonwebtoken";
const AccessAndRefreshTokens = async (user) => {
  try {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    throw new apiError("erorr in jwt tokens generating");
  }
};

const userRegister = asynchandler(async (req, res) => {
  const { fullName, email, userName, password } = req.body;

  if ([userName, email, fullName, password].some((all) => all?.trim() === "")) {
    throw new apiError(401, "all requirements needs");
  }

  const existing = await User.findOne({ $or: [{ userName }, { email }] });

  if (existing) {
    throw new apiError(409, "alredy taken");
  }
  if (!req.files?.avatar?.length) {
    throw new apiError(400, "avatar missed");
  }
  const avatarLocalPath = req.files.avatar?.[0].path;

  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new apiError(400, "avatar is required");
  }

  const avatar = await uploadOnCloud(avatarLocalPath);

  if (!avatar) {
    throw new apiError(400, "avatar is required");
  }
  const coverImage = await uploadOnCloud(coverImageLocalPath);

  const user = await User.create({
    userName: userName.toLowerCase().replace(/\s+/g, ""),
    fullName,
    email,
    avatar: avatar?.url,
    coverImage: coverImage?.url || "",
    password,
  });

  const { refreshToken, accessToken } = await AccessAndRefreshTokens(user);

  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!userCreated) {
    throw new apiError(500, "error in registertion ");
  }
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiRes(
        200,
        {
          user: userCreated,
          accessToken,
          refreshToken,
        },
        "user registerd successfully",
      ),
    );
});

const userLoggIn = asynchandler(async (req, res) => {
  const { userName, email, password } = req.body;

  if (!(userName || email)) {
    throw new apiError(400, "email or userName are require");
  }

  if (!password) {
    throw new apiError(400, "passwrod is require");
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (!user) {
    throw new apiError(404, "user not existing");
  }

  const passVild = await user.isPasswordCorrect(password);

  if (!passVild) {
    throw new apiError(401, "password is worng");
  }

  const { refreshToken, accessToken } = await AccessAndRefreshTokens(user);
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiRes(
        200,
        {
          user: user,
          accessToken,
          refreshToken,
        },
        "user LoggedIn successfully",
      ),
    );
});

const userLggedOut = asynchandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      returnDocument: "after",
    },
  );
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiRes(201, {}, "userlogout successfully"));
});

const refreshAccessToken = asynchandler(async (req, res) => {
  const userToken = req.body?.refreshToken || req.cookies.refreshToken;
  if (!userToken) {
    throw new apiError(401, "unathoraized request");
  }

  const decoded = await jwt.verify(userToken, process.env.REFERSH_TOKEN_SECRET);

  const user = await User.findById(decoded._id);

  if (userToken !== user.refreshToken) {
    throw new apiError(401, "your token is expired");
  }
  let newRefreshToken;
  const { accessToken, refreshToken: newRefreshToken } =
    await AccessAndRefreshTokens(user);
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new apiRes(
        200,
        {
          accessToken,
          refreshToken: newRefreshToken,
        },
        "access token renew",
      ),
    );
});

const changePassword = asynchandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new apiError(400, "password is require");
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new apiError(400, "user is not existing");
  }
  const checkpass = await user.isPasswordCorrect(oldPassword);
  if (!checkpass) {
    throw new apiError(401, "password is incorrect");
  }

  user.password = newPassword;

  const { accessToken, refreshToken } = await AccessAndRefreshTokens(user);
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiRes(
        200,
        {
          accessToken,
          refreshToken,
        },
        "access token renew",
      ),
    );
});

const currentUser = asynchandler(async (req, res) => {
  return res
    .status(200)
    .json(new apiRes(200, req.user, "current user finded successfully "));
});

const updateDetails = asynchandler(async (req, res) => {
  const { userName, fullName, email } = req.body;
  if (!fullName) {
    throw new apiError(400, "fullName is required");
  }

  const updateFields = { fullName };

  if (userName && userName !== req.user.userName) {
    const existing = await User.findOne({ userName });
    if (existing) {
      throw new apiError(409, "Username already taken");
    }
    updateFields.userName = userName.toLowerCase().replace(/\s+/g, "");
  }

  if (email && email !== req.user.email) {
    const existing = await User.findOne({ email });
    if (existing) {
      throw new apiError(409, "Email already registered");
    }
    updateFields.email = email;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: updateFields,
    },
    {
      new: true,
    },
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new apiRes(200, user, "user updated successfully"));
});
const avatarChange = asynchandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new apiError(400, "error in avatar local path");
  }
  const avatar = await uploadOnCloud(avatarLocalPath);

  if (!avatar?.url) {
    throw new apiError(400, "avatar upload failed");
  }
  const usert = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    },
  ).select("-password -refreshToken");
  return res
    .status(200)
    .json(new apiRes(200, usert, "avatar changed successfully"));
});

const coverImageChnage = asynchandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new apiError(400, "error in cover image local path");
  }
  const coverImage = await uploadOnCloud(coverImageLocalPath);

  if (!coverImage?.url) {
    throw new apiError(400, "cover image upload failed");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    },
  ).select("-password -refreshToken");
  return res
    .status(200)
    .json(new apiRes(200, user, "coverImage changed successfully"));
});

const channelDetails = asynchandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new apiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscribers",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscribers",
        localField: "_id",
        foreignField: "subscribe",
        as: "subscribededChannels",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribededChannels",
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id || null, "$subscribers.subscribe"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new apiError(404, "channel not found");
  }

  return res
    .status(200)
    .json(new apiRes(200, channel[0], "channel data is here"));
});

const userWatchHistory = asynchandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "watchHistory",
    populate: {
      path: "owner",
      select: "userName fullName avatar email",
    },
  });

  if (!user) {
    throw new apiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new apiRes(
        200,
        user.watchHistory || [],
        "user history is fetched successfully",
      ),
    );
});
export {
  userRegister,
  userLoggIn,
  userLggedOut,
  refreshAccessToken,
  changePassword,
  currentUser,
  updateDetails,
  avatarChange,
  coverImageChnage,
  channelDetails,
  userWatchHistory,
};
