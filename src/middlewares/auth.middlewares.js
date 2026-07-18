import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { asynchandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken";
export const verifyJwt = asynchandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new apiError(401, "unauthorized request");
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded?._id);

    if (!user) {
      throw new apiError(401, "invild token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new apiError(401, error?.message || "invild token");
  }
});

export const verifyJwtOptional = asynchandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded?._id);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    next();
  }
});
