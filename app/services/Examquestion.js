"use strict";

const serviceLocator = require("../lib/service_locator");
const createError = require("http-errors");
const logger = serviceLocator.get("logger");
const jsend = serviceLocator.get("jsend");
const mongoose = serviceLocator.get("mongoose"); 
const moment = serviceLocator.get("moment"); 
const Exams = mongoose.model("tbl__exam");
const ExamQuestions = mongoose.model("tbl__examquestions");
const Questions = mongoose.model("tbl__question");
const ExamSectionDetails = mongoose.model("tbl__exam_sectdetails");

module.exports = {
    // 1. Create ExamQuestion (Assign)
    createExamQuestion: async (req, res, next) => {
        try {
     const {exam_id,sect_id,ip_addr,qid } = req.payload;
            if (!exam_id || !ip_addr || !qid )
            return jsend(400, "Please send valid request data");
            const Exam = await Exams.findOne({
                exam_id:"15" //req.payload.body.exam_id,
            }).catch((err) => {
                return jsend(400, "Please send valid request data");
            });
     const {exam_cat, exam_sub,exam_name, exam_code,tot_questions, quest_type } = Exam;
            const count = await ExamQuestions.find(
                {exam_id: exam_id,
                 exam_queststatus: 'Y'
                }
            ).catch((err) => {
                return jsend(400, "Please send valid request data");
            });
           // count = rows.length;
            let allowedquestion = tot_questions - count;
            console.log(allowedquestion);
            let examQuestionsList = [];
            let pushedQuestion = 1;
            const ExamQc = await Questions.find( { qid: qid }
            ).catch((err) => {
                return jsend(400, "Please send valid request data");
            });
            ExamQc.forEach((index) => {
                if (pushedQuestion <= allowedquestion) {
                    examQuestionsList.push({
                        exam_id: exam_id,
                        exam_cat: exam_cat,
                        exam_subcat: exam_sub,
                        sect_id: sect_id,
                        exam_name: exam_name,
                        exam_code: exam_code,
                        quest_type: quest_type,
                        quest_assigned_type: req.user.logintype,
                        quest_assigned_id: req.user.id,
                        quest_assigned_name: req.user.username,
                        qid: index.qid,
                        cat_id: index.cat_id,
                        sub_id: index.sub_id,
                        q_type: index.q_type,
                        question: index.question,
                        quest_desc: index.quest_desc,
                        opt_type1: index.opt_type1,
                        opt_type2: index.opt_type2,
                        opt_type3: index.opt_type3,
                        opt_type4: index.opt_type4,
                        opt_type5: index.opt_type5,
                        opt_1: index.opt_1,
                        opt_2: index.opt_2,
                        opt_3: index.opt_3,
                        opt_4: index.opt_4,
                        opt_5: index.opt_5,
                        crt_ans: index.crt_ans,
                        quest_level: index.quest_level,
                        exam_questpos: "1",
                        exam_queststatus: "Y",
                        exam_questadd_date: moment(Date.now()).format(
                            "YYYY-MM-DD HH:mm:ss"
                        ),
                        ip_addr: ip_addr,
                        last_update: moment(Date.now()).format(
                            "YYYY-MM-DD HH:mm:ss"
                        ),
                    });
                }
                pushedQuestion = pushedQuestion + 1;
            });
            // await ExamQuestions.bulkCreate(examQuestionsList).catch((err) => {
            await ExamQuestions.create(examQuestionsList).catch((err) => {
                return jsend(404,err.message);
            });
            return jsend(200, "Exam Updated Success !!!",count,ExamQc)
            
        } catch (error) {
            //  await t.rollback();
            logger.error(`Error at Create ExamQuestion (Assign) : ${error.message}`);
            return jsend(500, error.message)
        }
    },
    // 2. Get Assigned Question Count
    getAssignedExamQuestionsCount: async (req, res, next) => {
       // const t = await db.sequelize.transaction();
        try {
            const { exam_id, exam_cat, exam_subcat } = req.payload;
            if (!exam_id || !exam_cat || !exam_subcat)
            return jsend(400, "Please send valid request data");
            const count = await ExamQuestions.count(
               { exam_id, exam_cat, exam_subcat, exam_queststatus: 'Y' },
               // { transaction: t }
            ).catch((error) => {
                return jsend(500, error.message);
              });
              return jsend(200, "data received Successfully", { count });
            // await t.commit();
        } catch (error) {
          //  await t.rollback();
            logger.error(`Error at Get Assigned Question Count : ${error.message}`);
            return jsend(500, error.message);
        }
    },
    // 3. CreateBankExamQuestion
    createBankExamQuestion: async (req, res, next) => {
        try {
            const { exam_id, sect_id,ip_addr, qid } = req.payload;
            if (!exam_id ||!ip_addr ||!qid )
            return jsend(400, "Please send valid request data");
            const Exam = await Exams.findOne({
              exam_id: "15"//req.payload.body.exam_id 
            }).catch((err) => {
                return jsend(500,err.message);
            });
       const { exam_cat,exam_sub,exam_name, exam_code,tot_questions,quest_type} = Exam;
            const rows = await ExamQuestions.find( {
                        exam_id: exam_id,
                        sect_id: sect_id,
                        exam_queststatus: 'Y'
                }).catch((err) => {
                return jsend(400, "Please send valid request data");
            });
            const count=rows.length;

            const examSection = await ExamSectionDetails.findOne({
                sect_id: sect_id 
            }).catch((err) => {
                return jsend(400, "Please send valid request data");
            });

            const { no_ofquest } = examSection;
            let allowedquestion = no_ofquest - count;
            let examQuestionsList = [];
            let pushedQuestion = 1;
            const  ExamQc  = await Questions.find(
                        { qid: qid   }
            ).catch((err) => {
                return jsend(400, "Please send valid request data");
            });
            ExamQc.forEach((index) => {
                if (pushedQuestion <= allowedquestion) {
                    examQuestionsList.push({
                        exam_id: exam_id,
                        exam_cat: exam_cat,
                        exam_subcat: exam_sub,
                        sect_id: sect_id,
                        exam_name: exam_name,
                        exam_code: exam_code,
                        quest_type: quest_type,
                        quest_assigned_type: req.user.logintype,
                        quest_assigned_id: req.user.id,
                        quest_assigned_name: req.user.username,
                        qid: index.qid,
                        cat_id: index.cat_id,
                        sub_id: index.sub_id,
                        q_type: index.q_type,
                        question: index.question,
                        quest_desc: index.quest_desc,
                        opt_type1: index.opt_type1,
                        opt_type2: index.opt_type2,
                        opt_type3: index.opt_type3,
                        opt_type4: index.opt_type4,
                        opt_type5: index.opt_type5,
                        opt_1: index.opt_1,
                        opt_2: index.opt_2,
                        opt_3: index.opt_3,
                        opt_4: index.opt_4,
                        opt_5: index.opt_5,
                        crt_ans: index.crt_ans,
                        quest_level: index.quest_level,
                        exam_questpos: "1",
                        exam_queststatus: "Y",
                        exam_questadd_date: moment(Date.now()).format( "YYYY-MM-DD HH:mm:ss"),
                        ip_addr: ip_addr,
                        last_update: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss" ),
                    });
                }
                pushedQuestion = pushedQuestion + 1;
            });
            await ExamQuestions.create(examQuestionsList).catch((err) => {
            //await ExamQuestions.bulkCreate(examQuestionsList).catch((err) => {
                return jsend(400, "Please send valid request data");
            });
            return jsend(200,"Exam Updated Success !!!",ExamQc,rows,count);
        } catch (error) {
            logger.error(`Error at Create Bank Exam Question : ${error.message}`);
            return jsend(500,error.message);
        }
    },
    // 4. GetAssignedExamQuestions
    getAssignedExamQuestions: async (req, res, next) => {
        try {
            const { exam_id, exam_cat, exam_subcat } = req.payload;
            if (!exam_id || !exam_cat || !exam_subcat)
            return jsend(400, "Please send valid request data");

            // const [examquestion] = await db.sequelize.query(
            //     `select a.*,b.cat_name as 'Category',c.cat_name as 'Subcategory', d.question_code from tbl__examquestions as a 
            //         inner join tbl__category as b on a.cat_id= b.cat_id
            //         inner join tbl__category as c on a.sub_id= c.cat_id 
            //         INNER JOIN tbl__question as d on d.qid = a.qid 
            //        where a.exam_id=? and a.exam_cat=? and a.exam_subcat=? and a.exam_queststatus='Y'`,
            //     { replacements: [exam_id, exam_cat, exam_subcat] }
            // );
            
      const examquestion = await ExamQuestions.aggregate([           
                { "$match":{ 
                  exam_id:exam_id,
                exam_cat:exam_cat,
              exam_subcat:exam_subcat,
                  exam_queststatus:"Y"

            }},
                  { '$lookup': {
               'from': "tbl__category",
               'localField': 'cat_id',
               'foreignField': 'cat_id',
               'as': 'ExamData'
             }},                      
              { "$unwind": "$ExamData" },                     
              { '$lookup': {
                'from': "tbl__category",
                'localField': 'sub_id',
                'foreignField': 'cat_id',
                'as': 'ExamChapters'
              }},                     
               { "$unwind": "$ExamChapters" }, 
                  { '$lookup': {
                'from': "tbl__question",
                'localField': 'qid',
                'foreignField': 'qid',
                'as': 'ExamQuestion'
              }},                     
               { "$unwind": "$ExamQuestion" }, 
             {$project:{
                  ExamData:1,
                  Category:"$ExamData.cat_name",
                  Subcategory:"$ExamChapters.cat_name",
                  question_code:"$ExamQuestion.question_code",
                  _id:0 ,count:{$sum:1} 
                }}                 
                  ])
                 console.log(examquestion)
            if (!examquestion){
            return jsend(400, "Please send valid request data");
            }else{
               // const count = rows.length;
               return jsend(200, "data received Successfully",
                { count: examquestion.length, examquestion });
               }
        } catch (error) {
            logger.error(`Error at Get Assigned Exam Questtions : ${error.message}`);
            return jsend(500, error.message);
        }
    },
    // 5. RemoveAssignedQuestion
    removeAssignedQuestion: async (req, res, next) => {
        try {
            const { exq_id } = req.payload;
            if (!exq_id) return jsend(400, "Please send valid request data");
        //    await db.sequelize
             //   .transaction(async (t) => {
              const result =   await ExamQuestions.findOneAndUpdate(
                        { exq_id: exq_id  },
                        { exam_queststatus: 'N' },
                        //{ transaction: t }
                        ).catch((err) => {
                            return jsend(500,err.message);
                        });
                   if(result){
                    return jsend(200, "data received Successfully",result,
                    { message: "Update Success !!!" })
                   }else{
                    return jsend(500, "Please try again after sometime" )
                   }
              //  })
              
                // .then((result) => {
                //     return jsend(200, "data received Successfully",
                //     { message: "Questions removed successfully !!!" })})
                // .catch((err) => {
                //     return jsend(404,err.message);
                // });
        } catch (error) {
            logger.error(`Error at Remove Assigned Exam Questions : ${error.message}`);
            return jsend(500, error.message)
        }
    },
};
