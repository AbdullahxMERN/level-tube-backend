import { Router } from "express";

import { verifyJwt } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { getAllVideos } from "../controllers/video.controller.js";
import { publishAVideo } from "../controllers/video.controller.js";
import { getVideoById } from "../controllers/video.controller.js";
import { updateVideo } from "../controllers/video.controller.js";
import { deleteVideo } from "../controllers/video.controller.js";
import { togglePublishStatus } from "../controllers/video.controller.js";
const router = Router();
// Apply verifyJWT middleware to all routes in this file

router.route("/").get(getAllVideos);

router.route("/upload").post(
  verifyJwt,
  upload.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishAVideo,
);

router
  .route("/:videoId")
  .get(getVideoById)
  .delete(verifyJwt, deleteVideo)
  .patch(verifyJwt, upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(verifyJwt, togglePublishStatus);

export default router;
