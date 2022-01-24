
const serviceLocator = require("../lib/service_locator");
const Adminmenu = serviceLocator.get("Adminmenu");
const auth = serviceLocator.get('jwtHelper');
const trimRequest = serviceLocator.get('trimRequest');

exports.routes = (server, serviceLocator) => {
  return server.route([
//-------------------------- Adminmenu Route Start ------------------------------//

 //1.GetUserMenu
 {
    path: "/api/adminmenu",
    method: "GET",
    handler: Adminmenu.getUserMenu,
    // options: {
    //   response: {
    //     status: {
    //       500() {
    //         throw ((createError.Unauthorized()))
    //       },
    //     },
    //     failAction(request, h, error) {
    //       return jsend(401, "Authorization failed.Please send valid token to proceed further")
    //     }
    //   },
    //   pre: [trimRequest, auth.verifyAccessToken]

    // }
  },

  //2.GetAllActiveAdminmenuOld
  {
    path: "/api/adminmenu/old/all",
    method: "GET",
    handler: Adminmenu.getAllActiveAdminmenuOld,
     // options: {
    //   response: {
    //     status: {
    //       500() {
    //         throw ((createError.Unauthorized()))
    //       },
    //     },
    //     failAction(request, h, error) {
    //       return jsend(401, "Authorization failed.Please send valid token to proceed further")
    //     }
    //   },
    //   pre: [trimRequest, auth.verifyAccessToken]

    // }
  },

  //3.GetAllActiveAdminmenu
  {
    path: "/api/adminmenu/all",
    method: "GET",
    handler: Adminmenu.getAllActiveAdminmenu,
     // options: {
    //   response: {
    //     status: {
    //       500() {
    //         throw ((createError.Unauthorized()))
    //       },
    //     },
    //     failAction(request, h, error) {
    //       return jsend(401, "Authorization failed.Please send valid token to proceed further")
    //     }
    //   },
    //   pre: [trimRequest, auth.verifyAccessToken]

    // }
  },

  //4.UpdatePasswordSuperAdmin
  {
    path: "/api/adminmenu/changepasswordsuperadmin",
    method: "PUT",
    handler: Adminmenu.updatePasswordSuperAdmin,
     options: {
      response: {
        status: {
          500() {
            throw ((createError.Unauthorized()))
          },
        },
        failAction(request, h, error) {
          return jsend(401, "Authorization failed.Please send valid token to proceed further")
        }
      },
      pre: [trimRequest, auth.verifyAccessToken]

    }
  },
  
  //5.updatePasswordAdminOperator
  {
    path: "/api/adminmenu/changepasswordadminoperator",
    method: "PUT",
    handler: Adminmenu.updatePasswordAdminOperator,
    options: {
      response: {
        status: {
          500() {
            throw ((createError.Unauthorized()))
          },
        },
        failAction(request, h, error) {
          return jsend(401, "Authorization failed.Please send valid token to proceed further")
        }
      },
      pre: [trimRequest, auth.verifyAccessToken]

    }
  },

// //-------------------------- Adminmenu Route End -----------------------------------//

]);
};

