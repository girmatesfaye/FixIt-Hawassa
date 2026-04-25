import { Router } from "express";
import {
  uploadImage,
  uploadSingleImage,
} from "../controllers/uploadController";

const uploadRouter = Router();

uploadRouter.post("/", uploadSingleImage.single("image"), uploadImage);

export default uploadRouter;
