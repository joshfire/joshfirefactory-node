var fs = require("fs"),
    request = require("request");

var datajs_client = require("./lib/datajs.client"),
	datajs_proxy = require("./lib/datajs.proxy"),
	getdatasource = require("./lib/getdatasource");



var init = function(Joshfire) {
  Joshfire.datajs = {
    client:datajs_client.init(Joshfire),
    proxy:datajs_proxy.init(Joshfire)
  };
  Joshfire.factory.getDataSource = getdatasource.init(Joshfire);
};


var bootstrap = function(options,callback) {

  var fetch = function(cb) {
    var parsed = fs.readFile(__dirname+"/joshfire_factory_boostrap.json","utf-8",function(err,data) {
      if (!err) {
        return callback(null,JSON.parse(data));
      }

      var appid = options.appid || process.env.JOSHFIREFACTORY_APPID;
      var templateid = options.templateid || process.env.JOSHFIREFACTORY_TEMPLATEID || "auto";
      var deviceid = options.deviceid || process.env.JOSHFIREFACTORY_DEVICEID || "auto";
      var host = options.host || process.env.JOSHFIREFACTORY_HOST || "factory.joshfire.com";

      if (!appid) {
        return cb("no static bootstrap and no ID given - impossible to boostrap");
      }

      request({uri:"http://"+host+"/boostrap/"+appid+"/"+templateid+"/"+deviceid+"/?runtime=nodejs"},function(err,resp,body) {
        if (err) return cb(err);
        try {
          return cb(null,JSON.parse(body));
        } catch (e) {
          return cb("JSON parse error");
        }
        
      });

    });
  };

  fetch(function(err, factoryjson) {
    if (err) return callback(err);
    var J = {
      factory:factoryjson
    };
    init(J);
    callback(null,J);
  });

  
};





global.define = requirejs.define;
require("./datajs_datasources.js");
global.define = null;

/* Client shim! */
var dbrequire = requirejs.config({
  baseUrl: __dirname,
  nodeRequire: require,
  context:"dbrequire"
});


  var uri = "http://"+Joshfire.factory.globalConfig.DATAHOSTPORT+"/api/" + Joshfire.factory.globalConfig.DATAVERSION + "/_build?"+querystring.encode({"runtime":"nodejs","collections":JSON.stringify(_.keys(datajslib))});
  console.log("Fetching datasources at",uri);
  request({uri: uri},function(err,response,code) {
    if (err) return cb(err);
    fs.writeFile(__dirname+"/datajs_datasources.js",code,"utf-8",cb);
  });