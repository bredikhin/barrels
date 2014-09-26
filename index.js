'use strict';

/**
 * Barrels: Simple fixtures for Sails.js
 */

/**
 * Module dependencies
 */
var fs = require('fs');
var path = require('path');
var async = require('async');
var _ = require('lodash');

module.exports = Barrels;

/**
 * Barrels module
 * @param {string} sourceFolder defaults to <project root>/test/fixtures
 */
function Barrels(sourceFolder) {
  if (!(this instanceof Barrels))
    return new Barrels(sourceFolder);

  // Fixture objects loaded from the JSON files
  this.data = {};

  sourceFolder = sourceFolder || process.cwd() + '/test/fixtures';
  var files = fs.readdirSync(sourceFolder);

  for (var i = 0; i < files.length; i++) {
    if (path.extname(files[i]).toLowerCase() === '.json')
    {
      var modelName = path.basename(files[i]).split('.')[0].toLowerCase();
      this.data[modelName] = require(path.join(sourceFolder, files[i]));
    }
  }
}

/**
 * Assoсiate
 * @param {function} done callback
 */
Barrels.prototype.afterPopulate = function(done) {
  done();
}

/**
 * Put loaded fixtures in the database, associations excluded
 * @param {function} done callback
 */
Barrels.prototype.populate = function(done) {
  var that = this;
  var modelNames = Object.keys(this.data);

  // Populate each table / collection
  async.each(modelNames, function(modelName, nextModel) {
    var Model = sails.models[modelName];
    if (Model) {
      //Cleanup existing data in the model
      Model.destroy({}, function(err) {
        var associations = [];
        for (var i = 0; i < Model.associations.length; i++) {
          associations.push(Model.associations[i].alias);
        }

        // Insert all items from the fixture in the model
        var fixtureObjects = _.cloneDeep(that.data[modelName]);
        async.each(fixtureObjects, function(item, nextItem) {
          if (err)
            return done(err);

          // Strip associations data
          item = _.omit(item, associations);

          // Insert
          Model.create(item, function(err) {
            if (err)
              return done(err);
            nextItem();
          });
        }, nextModel);
      });
    } else {
      nextModel();
    }
  }, function(err) {
    if (err)
      return done(err);
    that.afterPopulate(done);
  });
}
