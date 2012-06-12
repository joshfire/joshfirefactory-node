var fs = require("fs"),
    request = require("request"),
    vm = require('vm'),
    requirejs = require("requirejs");

var packagejson = JSON.parse(fs.readFileSync(__dirname+"/package.json","utf-8").replace(/\n/g,""));

var datajs_client = require("./lib/datajs.client"),
	datajs_proxy = require("./lib/datajs.proxy"),
	getdatasource = require("./lib/getdatasource");

requirejs.config({
  baseUrl: __dirname,
  nodeRequire: require,
  context:"datajsrequire"
});

var init = function(Joshfire) {
  Joshfire.datajs = {
    client:datajs_client.init(Joshfire, requirejs),
    proxy:datajs_proxy.init(Joshfire)
  };
  Joshfire.factory.getDataSource = getdatasource.init(Joshfire);
};


exports.bootstrap = function(options,callback) {

  var fetch = function(cb) {
    var parsed = fs.readFile("joshfire_factory_boostrap.js","utf-8",function(err,data) {
      if (!err) {
        return cb(null,data);
      }


      var appid = options.appid || process.env.JOSHFIREFACTORY_APPID;
      var templateid = options.templateid || process.env.JOSHFIREFACTORY_TEMPLATEID || "auto";
      var deviceid = options.deviceid || process.env.JOSHFIREFACTORY_DEVICEID || "auto";
      var host = options.host || process.env.JOSHFIREFACTORY_HOST || "factory.joshfire.com";

      if (!appid) {
        return cb("no static bootstrap and no ID given - impossible to boostrap");
      }

      request({uri:"http://"+host+"/bootstrap/"+appid+"/"+templateid+"/"+deviceid+"/?runtime=nodejs&runtimev="+packagejson.version},function(err,resp,body) {
        if (err) return cb(err);

        if (options.save) {
          fs.writeFile("joshfire_factory_boostrap.js",body,"utf-8",function(err) {

          });
        }

        try {
          return cb(null,body);
        } catch (e) {
          return cb("JSON parse error");
        }
        
      });

    });
  };

  fetch(function(err, factoryjs) {
    if (err) return callback(err);

    var sandbox = {
      Joshfire:{},
      define:requirejs.define
    };

    try {
      vm.runInNewContext(factoryjs, sandbox, 'joshfire_factory_boostrap.vm.js');
    } catch (e) {
      return callback(e);
    }
    
    init(sandbox.Joshfire);

    callback(null,sandbox.Joshfire);
  });

};