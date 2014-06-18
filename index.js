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

/**
 * Perform the actual pupulation of the Sails Models.
 * Note we need to destroy any existing data in the models,
 * before inserting the fixtures.
 * @param  {Function} done callback function with signature done(err, result)
 */
function doPopulateSails(done) {
  var modelNames = Object.keys(data);

  // populate sails wiht each model (in parallel using async)
  async.each(modelNames, function(modelName, nextModel) {
    var Model = sails.models[modelName];
    if (Model) {

      //Cleanup existing data in the model
      Model.destroy({}, function(err) {

        // Insert all items from the fixture in the model (in parallel using async)
        async.each(data[modelName], function(item, nextItem) {
          if (err) {
            return done(err);
          }
          Model.create(item, function(err) {
            if (err) {
              return done(err);
            }
            nextItem();
          });
        }, nextModel);
      });
    } else {
      nextModel();
    }
  }, done);
}

module.exports = {
  objects: data, // Fixtures dumped after loading

  /**
   * Read fixtures from JSON files into `objects`
   * @param  {String} [folder='<project_root>/test/fixtures'] path to fixtures
   * @return {Object}        this module, where the objects member is holding loaded fixtures
   */
  load: function (folder) {
    //folder defaults to <project root>/test/fixtures
    folder = folder || process.cwd() + '/test/fixtures';
    var files = fs.readdirSync(folder);
    var i;

    for (i = 0; i < files.length; i++) {
      if (path.extname(files[i]).toLowerCase() === '.json')
      {
        var modelName = path.basename(files[i]).split('.')[0].toLowerCase();
        data[modelName] = require(path.join(folder, files[i]));
      }
    }

    return this;
  },

  /**
   * Populate the sails model with the fixture data.
   * Ensure that fixtures has;
   * @param  {Function} done   callback function with signature done(err, result)
   * @param  {String}   [folder] path to fixture, only used if fixtures is not loaded yet
   */
  populate: function (done, folder) {
    // We need to make sure that data hasBeen loaded
    if (Object.keys(data).length > 0) {
      doPopulateSails(done);
    } else {
      this.load(folder);

      // validate that fixtures has been loaded into data
      if (Object.keys(data).length > 0) {
        doPopulateSails(done);
      } else {
        done(new Error("No fixtures loaded"));
      }
    }
  }
};
