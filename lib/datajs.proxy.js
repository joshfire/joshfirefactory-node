exports.init = function(Joshfire) {

  /**
   * Datasource collection object that exposes a 'find' method to retrieve
   * feed items from the data proxy.
   *
   * @class
   * @param {String} db The datasource provider
   * @param {String} colname The collection in the provider's catalog
   * @param {Object} options Common query options (e.g. filtering options)
   * @returns {Collection} The collection that matches the given parameter.
   */
  var collection = function (db, colname, options) {
    options = options || {};

    /**
     * Sends a request to the data proxy to fetch collection feed items
     * @function
     * @param {Object} query Query parameters (search field, query filters...)
     * @param {function} callback Callback method that receives a potential
     *  error and the list of data entries as an object. The returned object
     *  includes an 'entries' property that contains the list of items.
     */
    this.find = function (query, callback) {
      var self = this,
        finalQuery = {},
        uri = null;

      // Clone default options
      _.extend(finalQuery, options);
      _.extend(finalQuery, query);

      // Add API key
      finalQuery.apikey = Joshfire.factory.config.app.id;

      if (finalQuery.filter) {
        finalQuery.filter = JSON.stringify(finalQuery.filter);
      }

      uri = 'http://' + Joshfire.factory.globalConfig.DATAHOSTPORT +
        '/api/'+ Joshfire.factory.globalConfig.DATAVERSION +
        '/' + db +'/'+ colname;

      request({uri:uri, timeout:30000, qs:finalQuery, json:true}, function (err, resp, data) {
        if (data && !data.name && self.name) {
          // Propagate datasource title to the returned feed
          // if not already set
          data.name = self.name;
        }

        console.log("FIND!",uri,finalQuery, options, query,data);

        callback(err,data);
      });
    };

    /**
     * Returns the type of items that a call to find would return.
     *
     * The output type returned by this function is taken from the datasource
     * query options (the Factory saves the outputType along with
     * query parameters). For datasources that return mixed content, the
     * output type is normally the most precise type that is possible.
     *
     * In the absence of bugs, getOutputType() should return the same value
     * as getDesc().outputType, the difference being that getOutputType()
     * returns a value immediately whereas getDesc() may send an HTTP
     * request.
     *
     * @function
     * @return {string} Type of items returned by the collection,
     *   "Thing" if the output type is not present in the query options.
     */
    this.getOutputType = function () {
      if (this.config && this.config.outputType) {
        return this.config.outputType;
      }
      else {
        return 'Thing';
      }
    };

    /**
     * Runs given function when object is 'loaded'.
     *
     * In practice, the function is run immediately, and here only for
     * interface symmetry with datajs.client.js.
     *
     * @function
     * @param {function} f The function to execute.
     */
    this.onLoaded = function (f) {
      f();
    };

    /**
     * Gets the description of the datasource.
     *
     * The description is a JSON object that details the collection
     * parameters. The returned object is usually the collection's
     * "desc" property, but may be more precise depending on the
     * query options (typically the outputType may be adjusted for
     * a more precise one for the given query).
     *
     * @function
     * @param {function} callback Callback function called with the error
     *  and the description.
     */
    this.getDesc = function(callback) {
      client.getCollectionDesc(db, colname, options, callback);
    };
  };


  return {
    /**
     * Creates a new datasource collection object.
     *
     * Feed items are not fetched at this stage. Call the 'find' method
     * on the returned object to retrieve the feed.
     *
     * @function
     * @param {String} db The datasource provider
     * @param {String} colname The collection in the provider's catalog
     * @param {Object} options Common query options (e.g. filtering options)
     * @returns {Collection} The collection
     */
    getCollection: function (db, colname, options) {
      return new collection(db, colname, options);
    },

    /**
     * Gets the description of the datasource collection
     * from the data proxy.
     *
     * The description is a JSON object that details the collection
     * parameters.
     *
     * @function
     * @param {String} db The datasource provider
     * @param {String} colname The collection in the provider's catalog
     * @param {Object} options Common query options (e.g. filtering options)
     * @param {function} callback Callback function called with the error
     *  and the description.
     */
    getCollectionDesc: function(db, colname, options, callback) {
      var self = this,
        finalQuery = {},
        uri = null;

      if (options) _extend(finalQuery, options);
      if (finalQuery.filter) {
        finalQuery.filter = JSON.stringify(finalQuery.filter);
      }

      uri = 'http://' + Joshfire.factory.globalConfig.DATAHOSTPORT +
        '/api/' + Joshfire.factory.globalConfig.DATAVERSION +
        '/' + db +'/'+ colname + '/_desc';


      request({uri:uri, timeout:30000, qs:finalQuery, json:true}, function (err, resp, data) {
        callback(err,data);
      });
    }
  };
};