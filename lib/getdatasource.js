exports.init = function(Joshfire) {

  /**
   * @fileoverview Exposes the getDataSource method that returns datasource
   * objects to the Joshfire.factory global object.
   *
   * Datasource objects returned by the getDataSource method may in turn be
   * used to retrieve feeds. The datasource may either run locally (client-side)
   * or through the data proxy.
   *
   * The code requires the following global objects to be available:
   * - window.Joshfire.factory (code uses Joshfire.factory.config)
   * - window.Joshfire.datajs (code uses client.getCollection and/or
   * proxy.getCollection methods depending on datasource parameters)
   */


  /**
   * Returns a datasource object that may be used to retrieve feed items
   * for the given datasource input name.
   *
   * @function
   * @param {String} datasourceName The name of the datasource input, as
   *  defined in the template's manifest file (package.json)
   * @return {Object} A datasource object that exposes a "find" method,
   *  null when the datasource cannot be found,
   *  a dummy "empty" datasource when the datasource is defined but does
   *  not target any real datasource.
   */
  var getDataSource = function (datasourceName) {
    var ds = null;
    var ret = null;
    var dsFactory = null;
    var i = 0;
    var emptyds = {
      name: '',
      find: function (query, callback) {
        return callback(null, { entries: [] });
      },
      onLoaded: function (f) {
        f();
      },
      getDesc: function(callback) {
        callback(null, {});
      },
      getOutputType: function() {
        return 'Thing';
      }
    };

    // Check parameters
    if (!datasourceName ||
      !Joshfire.factory ||
      !Joshfire.factory.config ||
      !Joshfire.factory.config.datasources ||
      !Joshfire.factory.config.datasources[datasourceName]) {
      return null;
    }

    // Retrieve the definition of the datasource from the app config
    ds = Joshfire.factory.config.datasources[datasourceName];

    if (Object.prototype.toString.call(ds) == '[object Array]') {
      // The datasource is actually a set of datasources.

      // The "find" method returns a feed whose items are the feeds
      // returned by the underlying datasources. In particular, it
      // does not return the union of the feeds returned by the
      // underlying datasources.
      ret = {
        "children": [],
        "find": function (options, callback) {
          var pending = ds.length;
          var errorCaught = false;
          var entries = [];
          var i = 0;

          // Callback called as soon as a "find" returns, calls the final
          // callback when all collections have been retrieved.
          var cb = function (err, data) {
            pending -= 1;
            if (errorCaught) {
              // Error already caught, do nothing
              return;
            }
            if (err) {
              errorCaught = true;
            }
            if (data) {
              entries.push(data);
            }
            if (err || (pending === 0)) {
              return callback(err, {"entries": entries});
            }
          };

          for (i=0; i<ret.children.length; i++) {
            ret.children[i].find(options, cb);
          }
        }
      };

      // Expose the underlying datasources in the "children" property
      // of the returned object.
      for (i = 0; i < ds.length; i++) {
        // A multiple datasource may contain "null" elements depending
        // on whether the user entered all datasources or not
        if (ds[i]) {
          dsFactory = ds[i].runatclient ? Joshfire.datajs.client : Joshfire.datajs.proxy;
          ret.children[i] = dsFactory.getCollection(ds[i].db, ds[i].col, ds[i].query);
          ret.children[i].name = ds[i].name;

          // Datasource should be opaque from template's point of view,
          // but the config contains useful info, typically the type of
          // items that will be returned (outputType), used by getOutputType
          ret.children[i].config = ds[i];
        }
        else {
          // Return an empty collection for this item
          ret.children[i] = {
            name: emptyds.name,
            find: emptyds.find,
            onLoaded: emptyds.onLoaded,
            getDesc: emptyds.getDesc,
            getOutputType: emptyds.getOutputType
          };
        }
      }
    }
    else if (ds) {
      // Atomic datasource
      dsFactory = ds.runatclient ? Joshfire.datajs.client : Joshfire.datajs.proxy;
      ret = dsFactory.getCollection(ds.db, ds.col, ds.query);
      ret.name = ds.name;

      // Datasource should be opaque from template's point of view,
      // but the config contains useful info, typically the type of
      // items that will be returned (outputType), used by getOutputType
      ret.config = ds;
    }
    else {
      // Datasource defined but not set, return an empty datasource
      ret = {
        name: emptyds.name,
        find: emptyds.find,
        onLoaded: emptyds.onLoaded,
        getDesc: emptyds.getDesc,
        getOutputType: emptyds.getOutputType
      };
    }

    return ret;
  };

  return getDataSource;

};