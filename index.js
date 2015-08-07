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
var Promise=require('bluebird');
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
    if (['.json', '.js'].indexOf(path.extname(files[i]).toLowerCase()) !== -1) {
      var modelName = path.basename(files[i]).split('.')[0].toLowerCase();
      this.data[modelName] = require(path.join(sourceFolder, files[i]));
    }
  }

  // The list of the fixtures model names
  this.modelNames = Object.keys(this.data);
}

/**
 * Put loaded fixtures in the database, associations excluded
 * @param {array} collections optional list of collections to populate
 * @param {function} done callback
 */
Barrels.prototype.populate = function(collections, done) {

  if (!_.isArray(collections)) {
    done = collections;
    collections = this.modelNames;
  }else {
    _.each(collections, function(collection) {
      collection = collection.toLowerCase();
    });
  }

  var self=this;

  var p=Promise.resolve();
  collections.forEach(function(modelName){
    p=p.then(function(){
      return self.destroy(modelName);
    }).then(function(){
      var fixtureObjects = _.cloneDeep(self.data[modelName]);
      var q=Promise.resolve();
      fixtureObjects.forEach(function(fixtureObject){
        q=q.then(function(){
          return self.create(modelName,fixtureObject); 
        }) 
      });
      return q;
    });
  });

  p.then(function(){
    done(); 
  }).catch(function(err){
    console.error(err); 
    done();
  });

};

Barrels.prototype.destroy=function(modelName){
  return new Promise(function(resolve,reject){
    var Model = sails.models[modelName];
    if (Model) {
      // Cleanup existing data in the table / collection
      Model.destroy().exec(function(err) {
        if(err){
          reject(err); 
        }else{
          resolve(); 
        }
      });
    }else{
      reject(modelName+' doesn\'t exist');
    }
  });
};

Barrels.prototype.create=function create(modelName,fixtureObject){

  var self=this;

  return new Promise(function(resolve,reject){

    var Model = sails.models[modelName];

    // get model's association information
    var associations=[];
    for (var i = 0; i < Model.associations.length; i++) {
      associations.push(Model.associations[i]);
    }

    return Promise.resolve(associations)
    .each(function(association){
      if(fixtureObject[association.alias]){

        //get or create possible association and get ids
        return self.findOrCreateAssociations(association,fixtureObject[association.alias])
        .then(function(docs){

          if(!docs){
            delete fixtureObject[association.alias];
            return; 
          }

          if(_.isArray(docs)){
            fixtureObject[association.alias]=docs.map(function(doc){
              return doc.id; 
            });
          }else{
            fixtureObject[association.alias]=docs.id;
          }

        }); 
      }           
    })
    .then(function(){
      return new Promise(function(resolve,reject){
        Model.create(fixtureObject).exec(function(err,doc){
          if(err){
            reject(err);
          }else{
            resolve(doc);
          }
        });  
      });
    })
    .then(function(doc){
      resolve(doc); 
    })
    .catch(function(err){
      reject(err); 
    });
  });
};

Barrels.prototype.findOrCreateAssociations=function(association,query){
  return new Promise(function(resolve,reject){
    var Model=sails.models[association.model];
    if(Model){
      Model.findOrCreate(query).exec(function(err,docs){
        if(err){
          reject(err);
        }else{
          resolve(docs);  
        }
      });
    }else{
      reject('model '+association.model+' doesn\'t  exist');
    }
  });
};
