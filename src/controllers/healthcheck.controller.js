import { apiError } from "../utils/ApiError.js";
import { apiRes } from "../utils/apiRes.js";
import { asynchandler } from "../utils/asynchandler.js";

const healthcheck = asynchandler(async (req, res) => {
  //TODO: build a healthcheck response that simply returns the OK status as json with a message
  return res.status(200).json(new apiRes(200, "server is runing safely"));
});

export { healthcheck };
