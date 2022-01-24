"use strict";

const serviceLocator = require("../lib/service_locator");
const createError = require("http-errors");
const logger = serviceLocator.get("logger");
const jsend = serviceLocator.get("jsend");
const mongoose = serviceLocator.get("mongoose"); 
const moment = serviceLocator.get("moment"); 
const jwt = serviceLocator.get("jsonwebtoken"); 
const Admin = mongoose.model("tbl__admin");
const School = mongoose.model("tbl__school");
const Operator = mongoose.model("tbl__operator");
const SchoolOperator = mongoose.model("tbl__school_operator");
// require("dotenv").config();


// db.SchoolOperator.belongsTo(db.School, {
//     targetKey: "id",
//     foreignKey: "schoolId",
// });

module.exports = {
    // 1. ValidateLogin
    validateLogin: async(req, res, next) => {
        try {
            const { admin_name, admin_pass, type, logintype } = req.payload;

            const password = Buffer.from(admin_pass).toString("base64");

            if (type == "S" && logintype == "G") {
                const rows  = await Admin.find({
                        admin_name: admin_name,
                        admin_pass: password,
                        admin_status: 'Y'
                }).catch((err) => {
                    return jsend(400, "Please send valid request data");
                });
                if (count > 0) {
                    const payload = {
                        user: {
                            id: 1,
                            name: rows[0].admin_name,
                            username: rows[0].admin_name,
                            userid: rows[0].admin_id,
                            type: type,
                            status: rows[0].admin_status,
                            logintype: logintype,
                            apiurl: "http://localhost:4002/api",
                            schoolid: 1,
                            schoolname: 'Question Cloud',
                            logo: 'questioncloud.png'
                        },
                    };
                    console.log(payload);
                    let token = jwt.sign(payload, "questionCloudSecret", {
                        expiresIn: "24h",
                    });
                    //                res.send({ token: token });
                    res.set('x-auth-token', token).send({ token });

                } // Create Jwt Payload
                else {
                    if (admin_name == "")
                        return({ message: "Please Give User ID" });
                    else if (admin_pass == "")
                        return({ message: "Please Give password" });
                    else return({ message: "User not found" });
                }

            }

            if (type == "S" && logintype == "I") {
                console.log("school");
                const { count, rows } = await School.find({
                    where: {
                        emailId: admin_name,
                        password: password,
                        schoolStatus: 'Y'
                    },
                });
                if (count > 0) {
                    const payload = {
                        user: {

                            id: rows[0].id,
                            name: rows[0].schoolName,
                            username: rows[0].emailId,
                            userid: rows[0].id,
                            type: type,
                            status: rows[0].schoolStatus,
                            logintype: logintype,
                            apiurl: "http://localhost:4002/api/school",
                            schoolid: rows[0].id,
                            schoolname: rows[0].schoolName,
                            logo: rows[0].schoolLogo
                        },
                    };
                    console.log(payload);
                    let token = jwt.sign(payload, "questionCloudSecret", {
                        expiresIn: "24h",
                    });
                    //                res.send({ token: token });
                    res.set('x-auth-token', token).send({ token });

                } else {
                    if (admin_name == "")
                        return({ message: "Please Give User ID" });
                    else if (admin_pass == "")
                        return({ message: "Please Give password" });
                    else return({ message: "User not found" });
                }
            }

        } catch (error) {
            logger.error(`Error at Login Admin and School Login : ${error.message}`);
           return jsend(500, error.message)
        }
    },
    // 2. ValidateAdminLogin
    validateAdminLogin: async(req, res, next) => {
        try {
            const { admin_name, admin_pass, type, logintype } = req.payload;

            const password = Buffer.from(admin_pass).toString("base64");

            if (type != "S" && logintype == "G") {
                const rows  = await Operator.find({
                  
                        op_uname: admin_name,
                        op_password: password,
                        op_status: 'Y',
                        op_type: type
                   
                });
                if (rows.length > 0) {
                    const payload = {
                        user: {
                            id: 1,
                            name: rows[0].op_name,
                            username: rows[0].op_uname,
                            userid: rows[0].op_id,
                            type: type,
                            status: rows[0].op_status,
                            logintype: logintype,
                            apiurl: "http://localhost:4002/api",
                            schoolid: 1,
                            schoolname: 'Question Cloud',
                            logo: 'questioncloud.png'
                        },
                    };
                    console.log(payload);
                    let token = jwt.sign(payload, "questionCloudSecret", {
                        expiresIn: "24h",
                    });
                    const response = res.response({ token })
                    .header('x-auth-token', token)
                return response

                } // Create Jwt Payload
                else {
                    if (admin_name == "")
                        return({ message: "Please Give User ID" });
                    else if (admin_pass == "")
                        return({ message: "Please Give password" });
                    else return({ message: "User not found" });
                }

            }

            if (type != "S" && logintype == "I") {

                const rows  = await SchoolOperator.find({
                    
                        op_uname: admin_name,
                        op_password: password,
                        op_status: 'Y',
                        op_type: type,
                   
                 //   include: [{ model: School }],
                });
                if (rows.length > 0) {
                    console.log(rows[0].School);
                    const payload = {
                        user: {
                            id: rows[0].School.id,
                            name: rows[0].op_name,
                            username: rows[0].op_uname,
                            userid: rows[0].op_id,
                            type: type,
                            status: rows[0].op_status,
                            logintype: logintype,
                            apiurl: "http://localhost:4002/api/school",
                            schoolid: rows[0].School.id,
                            schoolname: rows[0].School.schoolName,
                            logo: rows[0].School.schoolLogo
                        },
                    };
                    console.log(payload);
                    let token = jwt.sign(payload, "questionCloudSecret", {
                        expiresIn: "24h",
                    });
                    const response = res.response({ token })
                            .header('x-auth-token', token)
                        return response
                   
                } // Create Jwt Payload
                else {
                    if (admin_name == "")
                        return({ message: "Please Give User ID"});
                    else if (admin_pass == "")
                        return({ message: "Please Give password" });
                    else return({ message: "User not found" });
                }

            }

        } catch (error) {
            logger.error(`Error at Admin and Faculty Validate Login : ${error.message}`);
            return jsend(500, error.message)
        }
    },
};