"use strict";

const serviceLocator = require("../lib/service_locator");
const createError = require("http-errors");
const logger = serviceLocator.get("logger");
const jsend = serviceLocator.get("jsend");
const mongoose = serviceLocator.get("mongoose"); 
const moment = serviceLocator.get("moment"); 
const Admin = mongoose.model("tbl__admin");
const fs = serviceLocator.get("fs");
const path = serviceLocator.get("path");
const ImageFilter = serviceLocator.get("imageFilter");
// const unserialize = require("locutus/php/var/unserialize");
// const serialize = require("locutus/php/var/serialize");
// require("dotenv").config();

//-------------------------- Multer Part Start ----------------------------------//

// Ensure Questions Directory directory exists
// var homeCategoryDir = path.join(process.env.settings);
// fs.existsSync(homeCategoryDir) || fs.mkdirSync(homeCategoryDir);

// const storage = multer.diskStorage({
//     destination: (req, file, callBack) => {
//         callBack(null, process.env.settings);
//     },
//     filename: (req, file, callBack) => {
//         callBack(null, `file-${Date.now()}${path.extname(file.originalname)}`);
//     },
// });

// const upload = multer({
//     storage: storage,
//     fileFilter: ImageFilter,
//     limits: { fileSize: "2mb" },
// }).fields([
//     {
//         name: "setting_banner",
//         maxCount: 1,
//     },
// ]);

//-------------------------- Multer Part End ---------------------------------------//

module.exports = {
    // 1. Get Settings
    getSettings: async (req, res, next) => {
        try {
            const settings = await Admin.findByPk(1);
            if (!settings) {
                return jsend(404,"Settings Not Found !!!");
            }
            const { setting_fields } = settings;
            settings.setting_fields = unserialize(setting_fields);
            return jsend(200, "data received Successfully",
            { settings });
        } catch (error) {
            logger.error(`Error at Get Settings : ${error.message}`);
            return jsend(500, error.message)
        }
    },
    // 2. Update Settings
    updateSettings: async (req, res, next) => {
        try {
            console.log(req);
            upload(req, res, function (err) {
                if (req.fileValidationError) {
                    return jsend(req.fileValidationError);
                } else if (err instanceof multer.MulterError) {
                    return jsend(err);
                } else if (err) {
                    return jsend(err);
                } else {
                    console.log("Success", req.files);
                }
                const { file } = req;
                console.log(file);
                if (!file) return jsend(400, "No File");
     const {
         admin_name, admin_pass,sitename, set_url, setting_fields, type, explanation, } = req.payload;
         
     if (
         !admin_name || !admin_pass || !sitename ||!set_url || !setting_fields || !type ||!explanation )
                return jsend(400, "Please send valid request data");
                const password = Buffer.from(admin_pass).toString("base64");
                 const update  = Admin.findOneAndUpdate( 
                        { admin_id: 1  },
                        {
                            admin_name,
                            admin_pass: password,
                            admin_status: "Y",
                            sitename,
                            set_url,
                            setting_fields: serialize(setting_fields),
                            setting_operator: "Y",
                            setting_logo: "",
                            setting_banner:
                                req.files.settingbanner[0].filename,
                            type,
                            explanation,
                            lastupdate: moment(Date.now()).format(
                                "YYYY-MM-DD HH:mm:ss"
                          ),
            }) .catch((err) => {
                return jsend(404, err.message);
            });
                if(update){
                    return jsend(200, "data received Successfully",
                        { message: "Updated Success"})
                }else{
                    return jsend(500, "Please try again after sometime")
                }
            })
        } catch (error) {
            logger.error(`Error at Update Settings : ${error.message}`);
            return jsend(500, error.message)
        }
    },
};
