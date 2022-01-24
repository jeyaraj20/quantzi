//-------------------------- Adminmenu Model Start ------------------------------//
    
"use strict";
const serviceLocator = require("../lib/service_locator");
const mongoose = serviceLocator.get("mongoose");
mongoose.pluralize(null)
const AdminmenuallSchema = new mongoose.Schema({
  
  
            menu_id: {
                type: String,
                required: true,
                autoIncrement: true,
            },
            menu_title: {
                type: String,
                required: true
            },
            menu_title_apiname: {
                type: String,
                required: true
            },
            menu_type: {
                type: String,
                required: true
            },
            pid: {
                type: String,
                required: true
            },
            menu_link: {
                type: String,
                required: true
            },
            menu_icon: {
                type: String,
                required: true,
            },
            menu_home: {
                type: String,
                required: true
            },
            menu_pos: {
                type: String,
                required: true
            },
            menu_status: {
                type: String,
                required: true
            },
            menu_lastupdate: {
                type: Date,
                default: Date.now
            },
            menu_for: {
                type: String,
                required: true
            },
                 
  }); 
  module.exports = mongoose.model("tbl__adminmenu_all", AdminmenuallSchema);

  
//-------------------------- Adminmenu Model End ------------------------------//
