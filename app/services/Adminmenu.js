"use strict";

const serviceLocator = require("../lib/service_locator");
const createError = require("http-errors");
const logger = serviceLocator.get("logger");
const jsend = serviceLocator.get("jsend");
const mongoose = serviceLocator.get("mongoose"); 
const Adminmenu = mongoose.model("tbl__adminmenu");
const Adminmenuall=mongoose.model("tbl__adminmenu_all");
const Admin = mongoose.model("tbl__admin");
const School = mongoose.model("tbl__school");
const Operator = mongoose.model("tbl__operator");
const SchoolOperator = mongoose.model("tbl__school_operator");
const Question = mongoose.model("tbl__question");

module.exports = {
    // 1. Get All Active Adminmenu Old
    getAllActiveAdminmenuOld: async (req, res, next) => {
        try {
            const  rows  = await Adminmenu.find({
                menu_status: "Y" 
            }).sort({ menu_pos: 1 });
            if (!rows) {
                return jsend(404, "Adminmenu Not Found !!!");
            }
            const count = rows.length;
            return jsend(200,"data received Successfully",{ count, Adminmenu: rows });
        } catch (error) {
            logger.error(`Error at Get All Active Adminmenu Old : ${error.message}`);
            return jsend(500, error.message)
        }
    },
    // 2. Get Usermenu
    getUserMenu: async (req, res, next) => {
        try {
            //let logintype = req.user.logintype;
            let type ="S"// req.user.type;
            if (type == "S") {
                const  rows  = await Adminmenuall.find({
                   
                        menu_status: "Y",
                        $or: [{ menu_for: "B" },
                         //{ menu_for: logintype }
                        ],
                }).sort({ menu_pos: 1 });

                if (!rows) {
                    return jsend(400, "Adminmenu Not Found !!!");
                }else{
                const count = rows.length;
                return({ count, Adminmenu: rows });
                }
            } else {
                let op_id = req.user.userid;
                let tablename;
                if (logintype == "G") tablename = "tbl__operator";
                else tablename = "tbl__school_operator";
                // const [Adminmenu] = await db.sequelize.query(
                //     `select b.* from ` +
                //         tablename +
                //         ` as a 
                // inner join tbl__adminmenu_all as b on FIND_IN_SET(b.menu_id, a.feat_id) > 0
                // where a.op_id=? and b.menu_status='Y' 
                // and (b.menu_for='B' or b.menu_for=?) 
                // and b.menu_type like '%` +
                //         type +
                //         `%'
                // group by b.menu_id `,
                //     { replacements: [op_id, logintype] }
                // );
                const [Adminmenu] = await Operator.aggregate([ 
                    {$limit:300},                   
                    { "$match":{  op_id:op_id,
                      menu_status:"Y",
                }},
                      { '$lookup': {
                   'from': "tbl__adminmenu_all",
                   'localField': 'menu_id',
                   'foreignField': 'feat_id',
                   'as': 'ExamData'
                 }},                      
                  { "$unwind": "$ExamData" },                     
                  { '$lookup': {
                    'from': "tbl__school_question_category",
                    'localField': 'exam_subcat',
                    'foreignField': 'cat_id',
                    'as': 'ExamChapters'
                  }},                     
                   { "$unwind": "$ExamChapters" },   
                   { "$match": { 
                     "ExamData.menu_for": "B",
                    //  "ExamData.menu_for": logintype,
                    //  "ExamData.menu_type": req.user.type,
    
                     } },
                     {"$group": {
                      "_id": "$ExamData.menu_id",
                      "data": { "$addToSet": "$$ROOT" }
                     }
                    },
                 {$project:{
                    ExamData:"$data.ExamData",
                    _id:0 ,count:{$sum:1} }}                 
                      ])
                if (!Adminmenu) {
                    return jsend(404, "Menu Not Found !!!");
                }else{
                    return jsend(200, "data received Successfully", 
                    { count: Adminmenu.length, Adminmenu});
            }
        }
        } catch (error) {
            logger.error(`Error at Get User Menu : ${error.message}`);
            return jsend(500, error.message);
        }
    },
    // 3. Get All Active Adminmenu
    getAllActiveAdminmenu: async (req, res, next) => {
        try {
           // let logintype = req.payload.user.logintype;
            // const [Adminmenu] = await db.sequelize.query(
            //     `select * from tbl__adminmenu_all 
            //     where menu_status='Y' and (menu_for='B'
            //      or menu_for='` +
            //         logintype +
            //         `') `,
            //     { replacements: [logintype] }
            // ); 
            const AdminMenu = await Adminmenuall.aggregate([ 
                {$limit:300},                   
                { "$match":{ 
                  menu_status:"Y",
                  menu_for:"G"//logintype && logintype.length > 0 ? logintype[0].order_id : "B"
            }},      
                  ])

            if (!AdminMenu) {
                return jsend(404,"Menu Not Found !!!");
            }else{
                return jsend(200, "data received Successfully", 
                { count: Adminmenu.length, Adminmenu });
            }
        } catch (error) {
            logger.error(`Error at Get All Active Adminmenu : ${error.message}`);
            return jsend(500, error.message);
        }
    },
    // 4. Update Password Super Admin
    updatePasswordSuperAdmin: async (req, res, next) => {
        try {
            const { oldpassword, newpassword, type, logintype } = req.payload;
            console.log( req.payload)
            const password = Buffer.from(oldpassword).toString("base64");
          //  console.log(req.user);
         if (type == "S" && logintype == "G")
           {
                const  rows  = await Admin.find({
                        admin_id: "1", //req.payload.user.userid,
                        admin_pass: password,
                        admin_status: "Y",
                });
                if (rows.length > 0) {
               const newpasswordupdate = Buffer.from(newpassword).toString("base64");
                  const result=  await Admin.findOneAndUpdate({
                        admin_id:"1",//req.payload.user.id,
                        admin_pass: newpasswordupdate 
                    })
                     if(result){
                        return jsend(200,"Updated Success")
                     }else{
                        return  jsend(401,"Wrong Old Passoword");
                     }     
                } else {
                    return  jsend(401,"Wrong Old Passoword");
                }
          }
            if (type == "S" && logintype == "I") {
                const  rows  = await School.find({
                    
                        id:"1",//req.payload.user.schoolid,
                       password:password,
                        schoolStatus: "Y"
                });
                if (rows.length > 0) {
                   const newpasswordupdate = Buffer.from(newpassword).toString("base64");
                  const result=  await School.findOneAndUpdate({
                      id: "45",//req.payload.user.id,
                    password: newpasswordupdate
                    })
                        if(result){
                            return jsend(200,'Updated Success',rows)
                        }else{
                            return jsend(404,'User not found')
                        } 
                } else {
                    return jsend(404,"Wrong Old Passoword");
                }
            }
        } catch (error) {
            logger.error(`Error at Update Password Superadmin : ${error.message}`);
            return jsend(500, error.message);
        }
    },
    // 5. Update Password Operator
    updatePasswordAdminOperator: async (req, res, next) => {
        try {
            const { oldpassword, newpassword, type, logintype } = req.payload;
         //   const password = Buffer.from(oldpassword).toString("base64");

            if (type != "S" && logintype == "G")
            {
                const  rows  = await Operator.find({
                      //  op_id: req.payload.user.userid,
                      //  op_password: password,
                        op_status: "Y"
                });
                if (rows.length > 0) {
                    const newpasswordupdate = Buffer.from(newpassword).toString("base64");
                   const result= await Operator.findOneAndUpdate(
                       //{op_id: req.payload.user.id},
                       {op_password: newpasswordupdate 
                    })
                        if(result){
                            return jsend(200,"Updated Success")
                        }else{
                            return jsend(404,"Wrong Old Passoword");
                        }   
                } else {
                return jsend(404,"Wrong Old Passoword");
                }
            }
            if (type != "S" && logintype == "I") {
                const   rows = await SchoolOperator.find({
                    
                      //  schoolid: req.payload.user.schoolid,
                    //    op_password: password,
                        op_status: "Y",
                });
                if (rows.length > 0) {
                    const newpasswordupdate = Buffer.from(newpassword).toString("base64");
                   const result= await SchoolOperator.findOneAndUpdate({
                       // schoolid: req.payload.user.schoolid,
                       // op_id: req.payload.user.userid
                    },
                        {
                    //     op_password: newpasswordupdate                            
                    })
                        if(result){
                            return jsend(200,  "Updated Success" )
                        }else{
                            return jsend(404,"Wrong Old Passoword");
                        }    
                } else {
                    return jsend(404,"Wrong Old Passoword");
                }
            }
        } catch (error) {
            logger.error(`Error at Update Passwored Operator : ${error.message}`);
            return jsend(500, error.message);
        }
    },
};
