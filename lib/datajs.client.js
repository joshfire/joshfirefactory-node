exports.init = function(Joshfire) {

  // Fork of client.embedded.js
  // Note the dependency to requirejs is mandatory to ensure the right context
  // is used for path resolutions.

  /**
   * Collection class that exposes a "find" method to run queries against
   * the underlying datasource.
   * @constructor
   * @param {string} db The source provider
   * @param {string} colname The collection name for this source provider
   * @param {Object} options Common query options to send with each request
   */
  var collection = function (db, colname, options) {
    var self = this;
    var _loadedCallbacks = [];
    var _loaded = false;
    var collectionObject = null;
    
    /**
     * Runs the function when the collection is loaded.
     * @function
     * @param {function} f Function to execute. The function won't receive
     *  any parameter.
     * @private
     */
    self.onLoaded = function(f) {
      if (!_loaded) {
        _loadedCallbacks.push(f);
      } else {
        f();
      }
    };


    /**
     * Sends a request to the underlying datasource and calls the callback
     * function once done with the retrieved feed (or the error).
     * @function
     * @param {Object} query The request to send
     * @param {function(string,Object)} callback The callback function to call
     *  once done
     * @public
     */
    self.find = function (query, callback) {
      self.onLoaded(function () {
        var completeQuery = _.extend({}, options, query);
        if (collectionObject) {
          collectionObject.find(completeQuery, callback);
        }
        else {
          callback("Collection does not exist.");
        }
      });
    };


    /**
     * Sends a request to the underlying operator and calls the callback
     * function once done with the retrieved feed (or the error).
     * @function
     * @param {Object} data Processor inputs. Typical example for a single
     *  input: { "main": { "entries": [list of items] }}. Input names are
     *  operator specific, "main" by default.
     * @param {Object} query The request to send
     * @param {function(string,Object)} callback The callback function to call
     *  once done
     * @public
     */
    self.process = function (data, query, callback) {
      self.onLoaded(function () {
        var completeQuery = _.extend({}, options, query);
        if (collectionObject && collectionObject.process) {
          collectionObject.process(data, completeQuery, callback);
        }
        else {
          callback("Collection does not exist.");
        }
      });
    };


    // Collection can be safely required
    dbrequire([client.urlRoot + db + "/" + colname], function (col) {
      // Done. Run registered "load" event handlers.
      collectionObject = col;
      _loaded = true;
      for (var i=0;i<_loadedCallbacks.length;i++) {
        _loadedCallbacks[i]();
      }
      _loadedCallbacks = [];
    });

  };


  return {
    /**
     * Path to databases definitions. This path is relative to the baseUrl
     * config parameter of requirejs. This means that either baseUrl must be
     * set to the root folder of data-joshfire, or urlRoot must be adjusted
     * from the calling code.
     * @type {string}
     */
    urlRoot: 'databases/',

    /**
     * Returns the datasource that matches the given source provider and collection.
     * Returned datasource object features a "find" method that takes a query
     * @function
     * @param {string} db The source provider
     * @param {string} colname The collection name for this source provider
     * @param {Object} options Options to send each time the datasource is requested.
     * @returns {Object} The datasource collection object that features a "find" method.
     */
    getCollection: function (db, colname, options) {
      return new collection(db, colname, options);
    }
  };

};