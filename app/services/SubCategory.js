"use strict";

const serviceLocator = require("../lib/service_locator");
const createError = require("http-errors");
const logger = serviceLocator.get("logger");
const jsend = serviceLocator.get("jsend");
const fs = serviceLocator.get("fs");
const path = serviceLocator.get("path");
const handlebars = serviceLocator.get("handlebars");
const pdf = serviceLocator.get("html-pdf");
const mongoose = serviceLocator.get("mongoose");
const moment = serviceLocator.get("moment");
const Question = mongoose.model("tbl__question");
const Category = mongoose.model("tbl__category");
const Operator = mongoose.model("tbl__operator");
const ExamMainCategory = mongoose.model("tbl__exam_category")
const ExamQuestions = mongoose.model("tbl__examquestions")
const Exams = mongoose.model("tbl__exam")
// const Question_sub_category_html = fs.readFileSync(path.resolve(__dirname, '../templates/report_table.html'), 'utf8');
// const template = handlebars.compile(Question_sub_category_html);

module.exports = {
    // 1. Question PDF
    getQuestionPDFreport: async (req, res, next) => {

        try {
            const { maincat, subcat } = req.payload;
            console.log(maincat, subcat);
            // const [subcategory] = await db.sequelize.query(
            //     `SELECT cat.cat_name as maincatname, catsub.cat_name as subcatname, que.* FROM tbl__question as que, tbl__category as cat, tbl__category as catsub where que.sub_id = ` + subcat + ` and que.cat_id = ` + maincat + ` and que.quest_status <> 'D'
            // and cat.cat_id = que.cat_id and catsub.cat_id = que.sub_id`
            // );
 const  [subcategory] = await Question .aggregate([
        {
           "$match": {
               "sub_id":subcat,
               "cat_id": maincat,
               "exam_subcat": "exam_cat_id",
               quest_status:{$ne:"D"}
           }
          },
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
                'as': 'ExamData'
              }},                      
               { "$unwind": "$ExamsDatas" }, 
                  {
                    "$group": {
                        "_id":"$ExamData.cat_id",
                        "data": { "$addToSet": "$$ROOT" }
                    }
                },  
        {
          $project: {
            total: { $sum: 1 },
            que:"$ExamData",
            maincatname:"$ExamData.cat_name",subcatname:"$ExamsDatas.cat_name"
            }
        }
      ])
            console.log(subcategory);
           const html = template({ data: subcategory });
            pdf.create(html).toBuffer(function (err, buffer) {
                res.header('Content-Type', 'application/pdf');
                req.header('Content-Transfer-Encoding', 'Binary');
                res.header('Content-Disposition', 'attachment; filename="' + 'download-' + Date.now() + '.pdf"');
                //console.log(buffer);
                res.send(buffer);
            });

         pdf.create(html).toFile(path.join(__dirname, './report.pdf'), function (err, data1) {
                if (err) {
                    console.log(err);
                    return ({ statusCode: 201, message: 'Create pdf faild.' });
                } else {
                    fs.readFile(path.join(__dirname, './report.pdf'), function (err, data2) {
                        res.header('Content-Type', 'application/pdf');
                        req.header('Content-Transfer-Encoding', 'Binary');
                        res.header('Content-Disposition', 'attachment; filename="' + 'download-' + Date.now() + '.pdf"');
                        return (data2);
                    });
                }
         });
            /*
            pdf.create(html).toStream(function (err, stream) {
                if (err) return res.send(err);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename=quote.pdf');
                //res.type('pdf');
                stream.pipe(res);
                //res.download('file.pdf');
            });
            */
        } catch (error) {
            logger.error(`Error at Get All Active SubCategory : ${error.message}`);
            return jsend(500,error.message);
        }
    },
    // 2. Get All Active SubCategory
    getAllActiveSubCategory: async (req, res, next) => {
        try {
            const { status } = req.params;

            const rows  = await Category.find({
                attributes: ["cat_id", "pid", "cat_name", "cat_slug",
                    "cat_code", "cat_desc", "cat_pos"
                ],
               
                    cat_status: status,
                    pid: { $ne: 0},
            }).sort({ cat_pos: 1 });

            if (!rows) return({ category: "Sub Category Not Found !!!" });
            const category = await Category.find({
                attributes: ["cat_id", "cat_name"],
                pid: 0
            });
            // const [waitingquestioncount] = await db.sequelize.query(
            //     `SELECT sub_id, count('sub_id') as waitingcount
            //     FROM tbl__question where quest_status='W'
            //     GROUP BY sub_id`, { replacements: [] }
            // );

            // const [activequestioncount] = await db.sequelize.query(
            //     `SELECT sub_id, count('sub_id') as activecount
            //         FROM tbl__question where quest_status='Y'
            //         GROUP BY sub_id`, { replacements: [] }
            // );

            
  const [waitingquestioncount] = await Question.aggregate([
                {$limit:300},                   
                { "$match":{  
                  quest_status:"W"
            }},  
            {
              "$group": {
                  "_id": "$sub_id",
                  "data": { "$addToSet": "$$ROOT" }
              }
          },
          {$project:{
            waitingcount:"$data.sub_id",
              _id:0 ,count:{$sum:1} }}    
           ] )
        const [activequestioncount] = await Question.aggregate([
          {$limit:300},                  
          { "$match":{  
            quest_status:"Y"
      }},  
      {
        "$group": {
            "_id": "$sub_id",
            "data": { "$addToSet": "$$ROOT" }
        }
    },
              {$project:{
              activecount:"$data.sub_id",
             _id:0 ,count:{$sum:1} }}    
               ] )
                        
               
            /*
                        const [category, metadata] = await db.sequelize.query(
                            `
                            SELECT 
                                    b.cat_name AS 'MainCategory', a.*, '0' as 'qWaitingCount' , '0' as 'qActiveCount'
                            FROM
                                    tbl__category a
                            INNER JOIN tbl__category b ON 
                                    a.pid = b.cat_id
                            WHERE
                                    a.cat_status = ?
                            `,
                            { replacements: [status] }
                        );
            */
             return jsend(200, "data received Successfully",{
                count:rows.length, subcategory: rows,category: category,
                 waitingquestioncount: waitingquestioncount,
                activequestioncount: activequestioncount
            });
        } catch (error) {
            logger.error(`Error at Get All Active SubCategory : ${error.message}`);
            return jsend(500, error.message)
        }
    },
    //3. Get All Active SubCategory Only
    getAllActiveSubCategoryAlone: async (req, res, next) => {
        try {
            const { status } = req.params;

            const  rows = await Category.find({
                attributes: ["cat_id", "pid", "cat_name", "cat_slug",
                    "cat_code", "cat_desc"
                ],
                    cat_status: status,
                    pid: {$ne: 0} ,
            }).sort({ cat_pos: 1 });

            if (!rows) {
                return({ category: "Sub Category Not Found !!!" })
            }

            const category = await Category.find({
                attributes: ["cat_id", "cat_name"],
                cat_status: status,
                pid: 0
            });
             return jsend(200, "data received Successfully",{
                subcategoryCount:rows.length, subcategory: rows,
                categoryCount:category.length, category: category
            });
        } catch (error) {
            logger.error(`Error at Get All Active SubCategory : ${error.message}`);
            return jsend(500, error.message)
        }
    },
    // 4. Create SubCategory By Id
    createSubCategoryById: async (req, res, next) => {
        try {
            const { cat_name, cat_code, cat_desc, pid } = req.payload;
            if (!cat_name || !cat_code || !cat_desc || !pid)
              return jsend(400, "Please send valid request data");
            const [category, created] = await Category.create({
                cat_name:cat_name, cat_code:cat_code ,
                defaults: {
                    cat_name,
                    cat_code,
                    cat_desc,
                    pid,
                    cat_pos: 0,
                    cat_slug: "",
                    cat_image: "",
                    cat_status: "Y",
                    cat_dt: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
                    cat_lastupdate: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
                },
            });
            if (!category){
                throw createError.Conflict(
                    `Categrory - '${cat_name}' with Code - '${cat_code}' Already Exists !!!`
                );
            }else{
                return jsend(200, "data received Successfully",
                { category });
            }
        } catch (error) {
            logger.error(`Error at Create SubCategory By Id : ${error.message}`);
            return jsend(500, "Please try again after sometime")
        }
    },
    // 5. Get Category By Id
    getSubCategoryById: async (req, res, next) => {
        console.log(123)
        try {
            const { catId } = req.params;
            console.log(req.params)
            if (catId == 0) return jsend(400, "Please send valid request data");
            // const [category, metadata] = await db.sequelize.query(
            //     `
            //     SELECT 
            //         e.cat_name AS 'MainCategory',
            //         m.cat_name AS 'SubCategory',
            //         m.cat_code AS 'UniqueCode',
            //         m.cat_desc AS 'Description',
            //         m.cat_id AS 'Catid',
            //         e.cat_id AS 'Pid'
            //     FROM
            //         tbl__category e
            //     INNER JOIN tbl__category m ON 
            //         m.pid = e.cat_id
            //     WHERE
            //         e.cat_status = 'Y' and m.cat_status = 'Y' and m.cat_id = ${catId}
            //     `
            // );
            const category = await Category.aggregate([ 
                {$limit:300},                   
                { "$match":{ 
                  cat_status:"Y",
            }},
                  { '$lookup': {
               'from': "tbl__category",
               'localField': 'cat_id',
               'foreignField': 'pid',
               'as': 'ExamData'
             }},                      
              { "$unwind": "$ExamData" },
               
                { "$match":{ 
                  "ExamData.cat_status":'Y',
                  "ExamData.cat_id":catId,
            }},   
             {$project:{
                "ExamData.cat_id":1,
                  MainCategory:"$cat_name",
                  SubCategory:"$ExamData.cat_name",
                  UniqueCode:"$ExamData.cat_code",
                  Description:"$ExamData.cat_desc",
                  Catid:"$ExamData.cat_id",
                  Pid:"$cat_id",
                  _id:0 ,count:{$sum:1} }}                 
                  ])
            if (!category) return jsend(400, "Category Not Found !!!");
            return jsend(200, "data received Successfully",
                { category });
        } catch (error) {
            logger.error(`Error at Get Category By Id : ${error.message}`);
            return jsend(500, error.message)
        }
    },
    // 6. Update Sub Category By Id
    updateSubCategoryById: async (req, res, next) => {
        try {
            let { pid } = req.params;
            const { cat_name, cat_code, cat_desc } = req.payload;
            if (!cat_name || !cat_code || pid == 0)
             return jsend(400, "Please send valid request data");
            const  rows  = await Category.find({
                 cat_name:cat_name, cat_code:cat_code
            });
            await Category.findOneAndUpdate({
               cat_id: pid,
                cat_name,
                cat_code,
                cat_desc,
                cat_lastupdate: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
            }) .catch((err) => {
                return jsend(404, err.message);
            });
                if(rows){
                    return jsend(200, "data received Successfully",
                        { message: "Updated Success" })
                }else{
                    return jsend(500, "Please try again after sometime")
                }
        } catch (error) {
            logger.error(`Error at Update Sub Category By Id : ${error.message}`);
            return jsend(500, error.message)
        }
    },
    // 7. Update 'Inactive'
    updateInactiveById: async (req, res, next) => {
        try {
            const { catId, status } = req.payload;
            if (!catId || !status)return jsend(400, "Please send valid request data");

           const result = await Category.findOneAndUpdate({ 
                cat_id: catId ,
                cat_status: status , 
                } 
                //  ) .then((result) =>{return({ message: "Updated Success" })})
                // .catch((err) => {
                //     return jsend(404,err.message);
                // });
                ) .catch((err) => {
                    return jsend(404, err.message);
                });
                    if(result){
                        return jsend(200, "data received Successfully",
                            { message: "Updated Success" })
                    }else{
                        return jsend(500, "Please try again after sometime")
                    }
        } catch (error) {
            logger.error(`Error at Update Sub Category Status : ${error.message}`);
            return jsend(500, error.message)
        }
    },
    // 8. Update 'Delete'
    updateDeleteById: async (req, res, next) => {
        try {
            const { catId } = req.payload;
            if (!catId) return jsend(400, "Please send valid request data");

          const result =  await Category.findOneAndUpdate(
                { cat_status: "D" }, 
              { cat_id: catId  }
                // .then((result) => res.sendStatus(204))
                // .catch((err) => {
                //     return jsend(404,err.message);
                // });
                ) .catch((err) => {
                    return jsend(404, err.message);
                });
                    if(result){
                        return jsend(200, "data received Successfully",result,
                            { message: "Updated Success" })
                    }else{
                        return jsend(500, "Please try again after sometime")
                    }
        } catch (error) {
            logger.error(`Error at Delete Sub Category By Id : ${error.message}`);
            return jsend(500, error.message)
        }
    },
    // 9. Get All Inactive SubCategory
    getAllInActiveSubCategory: async (req, res, next) => {
        try {
            // const [category, metadata] = await db.sequelize.query(
            //     `
            //     SELECT 
            //         e.cat_name AS 'MainCategory',
            //         m.cat_name AS 'SubCategory',
            //         m.cat_code AS 'UniqueCode',
            //         m.cat_desc AS 'Description',
            //         m.cat_id AS 'Catid',
            //         e.cat_id AS 'Pid'
            //     FROM
            //         tbl__category e
            //     INNER JOIN tbl__category m ON 
            //         m.pid = e.cat_id
            //     WHERE
            //         e.cat_status = 'Y' and m.cat_status = 'N'
            //     `
            // );
      const [category] = await Category.aggregate([ 
                             
                { "$match":{ 
                  cat_status:"Y",
            }},
                  { '$lookup': {
               'from': "tbl__category",
               'localField': 'cat_id',
               'foreignField': 'pid',
               'as': 'ExamData'
             }},                      
              { "$unwind": "$ExamData" },
               
                { "$match":{ 
                  "ExamData.cat_status":'Y'
                
            }},   
             {$project:{
                  MainCategory:"$cat_name",
                  SubCategory:"$ExamData.cat_name",
                  UniqueCode:"$ExamData.cat_code",
                  Description:"$ExamData.cat_desc",
                  Catid:"$ExamData.cat_id",
                  Pid:"$cat_id",
                  _id:0 ,count:{$sum:1} }}                 
                  ])

            if (!category) {
                return jsend(404, "SubCategory Not Found !!!");
            } else {
                const count = category.length;
                return jsend(200, "data received Successfully",
                    { count, category });
            }
        } catch (error) {
            logger.error(`Error at Get All Inactive SubCategory : ${error.message}`);
            return jsend(500, error.message);
        }
    },
    // 10. Exam Sub Category Search Result
    getSearchResult: async (req, res, next) => {
        try {
            let { searchString, cat_id, subcat_id, status } = req.payload;
            if (searchString == null || cat_id == null) return jsend(400, "Please send valid request data");
            if (!!searchString) searchString = `%${searchString}%`;
            let conditions;
            if (!!searchString && !!cat_id) {
                conditions = `{$and: [
                    { pid: { $regex: '.*'${cat_id}'.*' }  },
                    { $or: [{cat_name: { $regex: '.*'${searchString}'.*' }},{cat_code: { $regex: '.*'${searchString}'.*' }} ]}
                ]}`


            } else {
                conditions = ` { $or: [{ pid: { $regex: '.*'${cat_id}'.*' }  },{cat_name: { $regex: '.*'${searchString}'.*' }},{cat_code: { $regex: '.*'${searchString}'.*' }} ]}
               `
            }

            if (subcat_id && subcat_id != 'M') {
                conditions = `{$and: [
                    { cat_id: ${subcat_id}  },
                    { $or: [{pid:${cat_id}},{cat_name: { $regex: '.*'${searchString}'.*' }},{cat_code: { $regex: '.*'${searchString}'.*' }} ]}
                ]}`

            }
            const subcategory = await Category.aggregate([
                { $match: { cat_status: status, pid: { $ne: '0' }, conditions } },
                { $project: { cat_id: 1, pid: 1, cat_name: 1, cat_slug: 1, cat_code: 1, cat_desc: 1, cat_pos: 1 } }
            ])


            if (!subcategory)return jsend(404, "Sub Category Not Found !!!")

            let category = await Category.aggregate([{
                $project: { "cat_id": 1, "cat_name": 1 }
            },
            {
                $match: {
                    pid: 0
                }
            }
            ]);


            const waitingquestioncount = await Question.aggregate([
                {$match:{quest_status:'W'}},
                {$group: {
                    _id: "$sub_id",
                    sub_id: { $sum: 1 }
                }},
                {$project:{sub_id:1,waitingcount:"$sub_id"}}
            ])
               

            const activequestioncount = await Question.aggregate([
                {$match:{quest_status:'Y'}},
                {$group: {
                    _id: "$sub_id",
                    sub_id: { $sum: 1 }
                }},
                {$project:{sub_id:1,activecount:"$sub_id"}}
                ])


            return jsend(200, "data received Successfully", {
                count: subcategory.length,
                subcategory,
                category: category,
                waitingquestioncount: waitingquestioncount,
                activequestioncount: activequestioncount
            });
        } catch (error) {
            logger.error(`Error at Exam Sub Category Search Result : ${error.message}`);
            return jsend(500, error.message)
        }
    },
    // 11. Get QBank Sub Category Count Only
    getSubCategoryCount: async (req, res, next) => {
        try {
            const { cat_status } = req.params;
            if (cat_status == null)return jsend(400, "Please send valid request data");
            let count = 0;
            count = await Category.count({
              
                   cat_status,
                    pid: {$ne: 0},
            }).catch((err) => {
                return jsend(500, error.message);
            });
            // const count = rows.length;
            return jsend(200, "data received Successfully", { count });
        } catch (error) {
            logger.error(`Error at Get QBank Sub Category Count Only : ${error.message}`);
            return jsend(500, error.message);
        }
    },
    // 12. Get Sub Category By CatId
    getSubCategoryByCatId: async (req, res, next) => {
        try {
            const { catId } = req.params;
            if (catId == 0) return jsend(400, "Please send valid request data");
            // const [subcategory] = await db.sequelize.query(
            //     `
            //     SELECT e.cat_id, e.cat_name FROM tbl__category e WHERE e.pid = ${catId} and e.cat_status = 'Y' ORDER BY trim(cat_name) ASC
            //     `
            // );
            const [subcategory] = await Category.aggregate([ 
                {$limit:300},                   
                { "$match":{ 
                  cat_status:"Y",
                  pid:catId
            }},
            {$sort:{"cat_name":-1}},
                   
             {$project:{
               pid:1,
                cat_id:"$cat_id",
                cat_name:"$cat_name",
                  _id:0 ,count:{$sum:1} }}                 
                  ])
                 

            if (!subcategory)  return jsend(400, "Sub Category Not Found !!!");
            return ({ subcategory });
        } catch (error) {
            logger.error(`Error at Get Sub Category By CatId : ${error.message}`);
            return jsend(error.message);
        }
    },
    //13. GetQuestionspdf
    getQuestionspdf: async (req, res, next) => {
        try {
            const { maincat, subcat } = req.payload;
        
            // const [subcategory] = await db.sequelize.query(
            //     `SELECT cat.cat_name as maincatname, catsub.cat_name as subcatname,
            //      que.* FROM tbl__question as que, tbl__category as cat, tbl__category as catsub 
            //      where que.sub_id = ` + subcat + ` and que.cat_id = ` + maincat + ` and que.quest_status <> 'D'
            //     and cat.cat_id = que.cat_id and catsub.cat_id = que.sub_id`
            // );
            
  const subcategory = await Question.aggregate([ 
                {$limit:100},                   
                { "$match":{  
              //  sub_id:subcat,
              //  cat_id:maincat,
                quest_status:{$ne:"D"} 
            }},
            {
              '$lookup': {
                'from': "tbl__category",
                'localField': 'cat_id',
                'foreignField': 'cat_id',
                'as': 'ExamData'
              }
            },
            { "$unwind": "$ExamData" },
            {
              '$lookup': {
                'from': "tbl__category",
                'localField': 'sub_id',
                'foreignField': 'cat_id',
                'as': 'ExamQc'
              }
            },
            { "$unwind": "$ExamQc" },
             {$project:{
                   sub_id:1,cat_id:1,
              maincatname:"$ExamData.cat_name",
              subcatname:"$ExamQc.cat_name",
                _id:0 ,count:{$sum:1} }}                 
                  ])
                  
                .catch((err) => {
                   return jsend(400,err)
                });
                const count = subcategory.length
            return ({ count,qdata: subcategory });
        } catch (error) {
            return (error);
        }
    },
    // 14.GetExamQuestionspdf
    getExamQuestionspdf: async (req, res, next) => {
        try {
            const { maincat, subcat, subsubcat } = req.payload;
            console.log(maincat, subcat);
            // const [subcategory] = await db.sequelize.query(
            //     `select cat1.exa_cat_name as maincatname, cat2.exa_cat_name as subcatname, que.* 
            //     from tbl__question as que, tbl__exam_category as cat1, tbl__exam_category as cat2 where cat1.exa_cat_id = ` + maincat + ` and cat2.exa_cat_id = ` + subcat + `
            //     and qid in
            //     (select qid from tbl__examquestions where exam_id in
            //     (SELECT exam_id FROM tbl__exam where exam_cat = ` + maincat + ` and exam_sub = ` + subcat + ` and exam_sub_sub = ` + subsubcat + `)
            //     and exam_queststatus <> 'D')`
            // );
             const subcategory = await Question.find({
              
                    cat_id:maincat,
                    sub_id:subcat
                 })
              const  Exam = await ExamMainCategory .aggregate([
                     {
                     "$match": {
                           exa_cat_id:maincat
                              }
                              },   
                     {
                     $project: {
                           maincatname:"$exa_cat_name",
                           count: { $sum: 1 }
                               }
                     }
                     ])
              const  Category = await ExamMainCategory .aggregate([
                     {
                     "$match": {
                          exa_cat_id:subcat
                             }
                             },   
                     {
                     $project: {
                          subcatname:"$exa_cat_name",
                          count: { $sum: 1 }
                                }
                                }
                      ])
              const  ExamQcc = await ExamQuestions .aggregate([
                     {
                     "$match": {
                           exam_queststatus:{$ne:"D"}
                                }
                                },   
                           {
                     $project: {
                       qid:"$qid",
                       count: { $sum: 1 }
                         }
                         }
                     ])
              const  ExamQc = await Exams .aggregate([
                   {
                  "$match": {
                        exam_cat:maincat, exam_sub:subcat,  exam_sub_sub:subsubcat
                         }
                         },   
                            {
                     $project: {
                       exam_id:"$exam_id",
                       count: { $sum: 1 }
                           }
                           }
                     ])
        if (!subcategory){
                 return jsend(404,"Questions Not Found !!!");
             }else{
                 return jsend({
                      Count : subcategory.length, qdata: subcategory,
                      count : Exam.length,Exam,
                     count_ : Category.length,Category,
                     _count : ExamQcc.length,ExamQcc,
                    count__ : ExamQc.length,ExamQc,
                            });
                           }
          } catch (error) {
               logger.error(`Error at get Assigned School ExamQuestions - School : ${error.message}`);
                return jsend(500,error.message);
                      }
                      },
    // 15. UpdatePositionById
    updatePositionById: async (req, res, next) => {
        try {
            const { values } = req.payload;
            if (!values) return jsend(400, "Please send valid request data");

                values.forEach(async (val) => {
                    await Category.findOneAndUpdate({cat_id: val.catId},
                        { cat_pos: val.position }
                       );
                })
                return jsend(200,"Updated successfully")
               
        } catch (error) {
            logger.error(`Error at Update Qbank Sub Category Position : ${error.message}`);
            return jsend(500, error.message)
        }
    },
    // 16. GetAllAdmin
    getAllAdmin: async (req, res, next) => {
        try {
            // const [Operator] = await db.sequelize.query(
            //     `select a.* ,count(b.quest_status) as actcount from tbl__operator as a 
            //     left join tbl__question as b on a.op_id=quest_add_id
            //       and a.op_uname=b.quest_add_by and b.quest_status !='D'
            //     where a.op_status = 'Y' group by a.op_id`
            // );
                  const operator = await Operator.aggregate([
                    {$limit:300},  
                       {   "$match": {
                              op_status: 'Y',  
                                }
                          },
                                  {
                            '$lookup': {
                             'from': "tbl__question",
                             'localField': 'op_id',
                               'foreignField': 'quest_add_id',
                                'as': 'ExamData'
                                }
                                 },
                            { "$unwind": "$ExamData" },
                               {
                                '$lookup': {
                            'from': "tbl__question",
                            'localField': 'op_uname',
                            'foreignField': 'quest_add_by',
                            'as': 'ExamQc'
                              }
                                  },
                         { "$unwind": "$ExamQc" },
                    { "$match": {
                               quest_status: "$ne:D", // !='D'
                          }},
                     {
                     "$group": {
                                  "_id": "$op_id",
                                 "data": { "$addToSet": "$$ROOT" }
                                         }},
                     {$project: {
                         actcount: "$data.ExamData.quest_status",
                                     }
                                }
                                  ])
            
            if (!operator){
               
                return jsend(400, "Operator Not Found !!!");
                }else{
            return jsend(200, "data received Successfully",
            { count: operator.length, Operator: operator });
                }
        } catch (error) {
            return jsend(500, error.message)
        }
    },
    // 17.GetAllAdminQuestions
    getAllAdminQuestions: async (req, res) => {
        try {
            const {opid, startdate, enddate  } = req.payload;
            // const [subcategory] = await db.sequelize.query(
            //     `SELECT count(*) as questions, quest_date FROM tbl__question where quest_add_id like '` + opid + `' and quest_date BETWEEN '` + startdate + ` 00:00:00' and '` + enddate + ` 23:59:59' group by Date(quest_date)`
            // );
            
    const subcategory = await Question.aggregate([
    {
        "$match": {
          quest_add_id : opid,
         quest_date:startdate ,//+ moment(startdate).format("hh:mm"),// 00:00:00,
        aproved_date:enddate //+ moment("23:59:59", ("HH:mm:ss"))
        }
      },
    {  "$group": {
        "_id": {Data:"$quest_date"},
        "data": { "$addToSet": "$$ROOT" }
    } },
  {
        $project: {
            questions:"$data.questions",
            quest_date:"$data.quest_date"
        }
    }
  ])        
    //         return jsend(200, "data received Successfully",
    //             { odata: subcategory });
    //     } catch (error) {
    //         return jsend(500, error.message)
    //     }
    // },
    
    if (!subcategory){
        return jsend(400, " Not Found !!!");
        }else{
    return jsend(200, "data received Successfully",
              { odata: subcategory });
        }
      } catch (error) {
     return jsend(500, error.message)
        }
        },
  };