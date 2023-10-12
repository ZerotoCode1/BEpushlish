import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { isAdmin, isAuth } from '../utils.js';

const upload = multer();

const uploadRouter = express.Router();

uploadRouter.post(
  '/',
  isAuth,
  isAdmin,
  upload.single('file'),
  async (req, res) => {
    cloudinary.config({
  cloud_name: 'dzvqipk4f', 
  api_key: '512258288691569', 
  api_secret: 'gCDA9R55sspOPRHmnZswj-5GT90' 

    });
    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };
    const result = await streamUpload(req);
    res.send(result);
  }
);
export default uploadRouter;
