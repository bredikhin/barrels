/**
 * Simple fixtures for Sails.js
 */

/**
 * Module dependencies
 */
var fs = require('fs')
  , path = require('path')
  , async = require('async')
  , data = {};

module.exports = {
  objects: data, // Fixtures dumped after loading

  /**
   * Read fixtures from JSON files into `objects`
   *
   * @param {String} folder
   * @chainable
   */  
  load: function(folder) {
    /**
     * Looking in '<project_root>/test/fixtures' by default
     */
    if (!folder)
      folder = process.cwd() + '/test/fixtures';
    var files = fs.readdirSync(folder);
    for (i in files) {
      if (path.extname(files[i]).toLowerCase() === '.json')
      {
        var modelName = path.basename(files[i]).split('.')[0].toLowerCase();
        data[modelName] = require(path.join(folder, files[i]));
      }
    }

    return this;
  },

  /**
   * 
   * @param {function} done
   * @param {String} folder
   * @chainable
   */
  populate: function(done, folder) {
    if (!data.count)
      this.load(folder);

    /**
     * Iterate through the models
     */
    async.each(Object.keys(data), function(modelName, nextModel) {
      var Model = sails.models[modelName];
      if (Model) {
        /**
         * Collection cleanup
         */
        Model.destroy(function(err) {
          /**
           * Iterate through the objects
           */
          async.each(data[modelName], function(item, nextObject) {
            if (err)
              return done(err);
            Model.create(item, function(err) {
              if (err)
                return done(err);
              nextObject();
            });
          }, nextModel);
        });
      }
      else
        nextModel();
    }, done);

    return this;
  }
}
