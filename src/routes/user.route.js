import { Router } from "express";
import {
  avatarChange,
  changePassword,
  channelDetails,
  coverImageChnage,
  currentUser,
  refreshAccessToken,
  updateDetails,
  userLggedOut,
  userLoggIn,
  userRegister,
  userWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";
import {
  verifyJwt,
  verifyJwtOptional,
} from "../middlewares/auth.middlewares.js";

import { googleLogin } from "../controllers/user.controller.js"; // adjust if already imported differently
const router = Router();

router.route("/google-login").post(googleLogin);
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  userRegister,
);

router.route("/login").post(userLoggIn);

router.route("/logout").post(verifyJwt, userLggedOut);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJwt, changePassword);

router.route("/current-user").get(verifyJwt, currentUser);

router.route("/account-details").patch(verifyJwt, updateDetails);

router
  .route("/avatar-change")
  .patch(verifyJwt, upload.single("avatar"), avatarChange);

router
  .route("/cover-image-change")
  .patch(verifyJwt, upload.single("coverImage"), coverImageChnage);

router.route("/c/:username").get(verifyJwtOptional, channelDetails);

router.route("/history").get(verifyJwt, userWatchHistory);

export default router;
