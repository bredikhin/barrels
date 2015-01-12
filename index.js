/*jslint node: true */
'use strict';

/**
 * Barrels: Simple fixtures for Sails.js
 */

/**
 * Dependencies
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
function Barrels(sourceFolder, models) {
  if (!(this instanceof Barrels))
    return new Barrels(sourceFolder, models);

  // Collections can be provided (in populate is defaulted to sails.models if undefined
  this.models = models;

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
    if (path.extname(files[i]).toLowerCase() === '.json') {
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
Barrels.prototype.associate = function(collections, done) {
  if (!_.isArray(collections)) {
    done = collections;
    collections = this.modelNames;
  }
  var that = this;
  if(!that.models){
    that.models = sails.models;
  }

  // Add associations whenever needed
  async.each(collections, function(modelName, nextModel) {
    var Model = that.models[modelName];
    if (Model) {
      var fixtureObjects = _.cloneDeep(that.data[modelName]);
      async.each(fixtureObjects, function(item, nextItem) {
        // Item position in the file
        var itemIndex = fixtureObjects.indexOf(item);

        // Find and associate
        Model.findOne(that.idMap[modelName][itemIndex]).exec(function(err, model) {
          if (err)
            return nextItem(err);

          // Pick associations only
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
                return nextAttr(err);

              nextAttr();
            });
          }, nextItem);
        });
      }, nextModel);
    } else {
      nextModel();
    }
  }, done);
};

/**
 * Put loaded fixtures in the database, associations excluded
 * @param {array} collections optional list of collections to populate
 * @param {function} done callback
 * @param {boolean} autoAssociations automatically associate based on the order in the fixture files
 */
Barrels.prototype.populate = function(collections, done, autoAssociations) {
  if (!_.isArray(collections)) {
    autoAssociations = done;
    done = collections;
    collections = this.modelNames;
  }
  else {
    _.each(collections, function(collection) {
      collection = collection.toLowerCase();
    });
  }
  autoAssociations = !(autoAssociations === false);
  var that = this;
  if(!that.models){
    that.models = sails.models;
  }

  // Populate each table / collection
  async.each(collections, function(modelName, nextModel) {
    var Model = that.models[modelName];
    if (Model) {
      // Cleanup existing data in the table / collection
      Model.destroy().exec(function(err) {
        if (err)
          return nextModel(err);

        // Save model's association information
        that.associations[modelName] = {};

        //If not using sails, load associations metadata
        if(!Model.associations){
          loadAssociations(Model);
        }
        for (var i = 0; i < Model.associations.length; i++) {
          that.associations[modelName][Model.associations[i].alias] = Model.associations[i];
        }

        // Insert all the fixture items
        that.idMap[modelName] = [];
        var fixtureObjects = _.cloneDeep(that.data[modelName]);
        async.each(fixtureObjects, function(item, nextItem) {
          // Item position in the file
          var itemIndex = fixtureObjects.indexOf(item);

          // Strip associations data
          if (autoAssociations) {
            item = _.omit(item, Object.keys(that.associations[modelName]));
          }

          // Insert
          Model.create(item).exec(function(err, model) {
            if (err)
              return nextItem(err);

            // Primary key mapping
            that.idMap[modelName][itemIndex] = model[Model.primaryKey];

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

    // Create associations if requested
    if (autoAssociations)
      return that.associate(collections, done);

    done();
  });
};

// taken from sails, if waterline is used without it
var loadAssociations = function(model){
  // Derive information about this model's associations from its schema
  // and attach/expose the metadata as `SomeModel.associations` (an array)
  model.associations = _.reduce(model.attributes, function (associatedWith, attrDef, attrName) {
    if (typeof attrDef === 'object' && (attrDef.model || attrDef.collection)) {
      var assoc = {
        alias: attrName,
        type: attrDef.model ? 'model' : 'collection'
      };
      if (attrDef.model) {
        assoc.model = attrDef.model;
      }
      if (attrDef.collection) {
        assoc.collection = attrDef.collection;
      }
      if (attrDef.via) {
        assoc.via = attrDef.via;
      }

      associatedWith.push(assoc);
    }
    return associatedWith;
  }, []);
}
