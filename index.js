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

  // Map fixture positions in JSON files to the real DB IDs
  this.idMap = {};

  // The list of associations by model
  this.associations = {};

  // Load the fixtures
  sourceFolder = sourceFolder || process.cwd() + '/test/fixtures';
  var files = fs.readdirSync(sourceFolder);

  for (var i = 0; i < files.length; i++) {
    if (path.extname(files[i]).toLowerCase() === '.json')
    {
      var modelName = path.basename(files[i]).split('.')[0].toLowerCase();
      this.data[modelName] = require(path.join(sourceFolder, files[i]));
    }
  }

  // The list of the fixtures model names
  this.modelNames = Object.keys(this.data);
}

/**
 * Add associations
 * @param {function} done callback
 */
Barrels.prototype.associate = function(done) {
  var that = this;

  // Add associations whenever needed
  async.each(that.modelNames, function(modelName, nextModel) {
    var Model = sails.models[modelName];
    if (Model) {
      var fixtureObjects = _.cloneDeep(that.data[modelName]);
      async.each(fixtureObjects, function(item, nextItem) {
        // Item position in the file
        var itemIndex = fixtureObjects.indexOf(item);

        // Find and associate
        Model.findOne(that.idMap[modelName][itemIndex]).exec(function(err, model) {
          if (err)
            return done(err);

          item = _.pick(item, Object.keys(that.associations[modelName]));
          async.each(Object.keys(item), function(attr, nextAttr) {
            var association = that.associations[modelName][attr];
            var joined = association[association.type];
            if (!_.isArray(item[attr]))
              model[attr] = that.idMap[joined][item[attr]-1];
            else {
              for (var j = 0; j < item[attr].length; j++) {
                model[attr].add(that.idMap[joined][item[attr][j]-1]);
              }
            }

            model.save(function(err) {
              if (err)
                return done(err);

              nextAttr();
            });
          }, nextItem);
        });
      }, nextModel);
    } else {
      nextModel();
    }
  }, function(err) {
    done(err);
  });
}

/**
 * Put loaded fixtures in the database, associations excluded
 * @param {function} done callback
 */
Barrels.prototype.populate = function(done) {
  var that = this;

  // Populate each table / collection
  async.each(that.modelNames, function(modelName, nextModel) {
    var Model = sails.models[modelName];
    if (Model) {
      // Cleanup existing data in the model
      Model.destroy().exec(function(err) {
        if (err)
          return done(err);

        that.associations[modelName] = {};
        for (var i = 0; i < Model.associations.length; i++) {
          that.associations[modelName][Model.associations[i].alias] = Model.associations[i];
        }

        // Insert all items from the fixture in the model
        that.idMap[modelName] = [];
        var fixtureObjects = _.cloneDeep(that.data[modelName]);
        async.each(fixtureObjects, function(item, nextItem) {
          if (err)
            return done(err);

          // Item position in the file
          var itemIndex = fixtureObjects.indexOf(item);

          // Strip associations data
          item = _.omit(item, Object.keys(that.associations[modelName]));

          // Insert
          Model.create(item).exec(function(err, model) {
            if (err)
              return done(err);

            that.idMap[modelName][itemIndex] = model.id;
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

    that.associate(done);
  });
}
