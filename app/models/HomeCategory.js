//-------------------------- HomeCategory Model Start ------------------------------//

"use strict";
const serviceLocator = require("../lib/service_locator");
const mongoose = serviceLocator.get("mongoose");
mongoose.pluralize(null)
const HomeCategorySchema = new mongoose.Schema({
  
      
            exa_cat_id: {
                type: String,
                required: false,
              
            },
            exaid: {
                type: String,
                required: false
            },
            exaid_sub: {
                type: String,
                required: false
            },
            examcat_type: {
                type: String,
                required: false
            },
            exa_cat_name: {
                type: String,
                required: false
            },
            exa_cat_slug: {
                type: String,
                required: false
            },
            exa_cat_image: {
                type: String,
                required: false
            },
            exa_cat_pos: {
                type: String,
                required: false
            },
            exa_cat_status: {
                type: String,
                required: false
            },
            exa_cat_dt: {
                type: Date,
                default: Date.now
            },
            exa_cat_lastupdate: {
                type: Date,
                default: Date.now
            },
                                              
  }); 
  module.exports = mongoose.model("tbl__home_category",HomeCategorySchema);


//-------------------------- HomeCategory Model End ------------------------------//
