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
  Promise.resolve(collections)
  .each(function(modelName){
    var Model=sails.models[modelName];
    console.log(modelName);
    return self.destroy(Model) 
    .then(function(){
      console.log("destroy done");
      var fixtureObjects = _.cloneDeep(self.data[modelName]);
      return Promise.resolve(fixtureObjects)
      .each(function(fixtureObject){
        return self.create(Model,fixtureObject); 
      });
    });
  }).then(function(){
    done(); 
  }).catch(function(err){
    console.error(err); 
    done();
  });

};

Barrels.prototype.destroy=function(Model){
  return new Promise(function(resolve,reject){
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

Barrels.prototype.create=function create(Model,fixtureObject){

  var self=this;
  fixtureObject=_.cloneDeep(fixtureObject);

  if(!Model){
    return Promise.reject('create with undefined model')
  }else{
    console.log('starting create model');
    return self.association(Model,fixtureObject)
    .then(function(fixtureObject){
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
    .catch(function(err){
      console.log('create Error:')
      console.log(err);  
      throw err;
    });
  }

};

Barrels.prototype.findOrCreate=function findOrCreate(Model,fixtureObject){
  var self=this;
  fixtureObject=_.cloneDeep(fixtureObject);

  if(!Model){
    return Promise.reject('find or create with undefined model')
  }else{
    return self.association(Model,fixtureObject)
    .then(function(fixtureObject){
      return new Promise(function(resolve,reject){
        Model.findOrCreate(fixtureObject,fixtureObject).exec(function(err,docs){
          if(err){
            reject(err);
          }else{
            resolve(docs);
          }
        });  
      });
    })
    .catch(function(err){
      console.log('findOrCreate Error:')
      console.log(err);  
      throw err;
    });
  }

};

Barrels.prototype.association=function association(Model,fixtureObject){

  var self=this;
  if(!Model){
    return Promise.reject('undefined model')
  }else{
    return Promise.reduce(Model.associations,function(fixtureObject,association){
      if(fixtureObject && fixtureObject[association.alias]){
        console.log(fixtureObject[association.alias]);
        console.log(fixtureObject);
        return self.findOrCreateAssociations(association,fixtureObject[association.alias])
        .then(function(docs){
          if(!docs){
            delete fixtureObject[association.alias];
            return fixtureObject; 
          }
          if(_.isArray(docs)){
            fixtureObject[association.alias]=docs.map(function(doc){
              return doc.id; 
            });
          }else{
            fixtureObject[association.alias]=docs.id;
          }
          return fixtureObject;
        }); 
      }else{
        return fixtureObject; 
      }           
    },fixtureObject)
    .then(function(fixtureObject){
      return fixtureObject;
    })
    .catch(function(err){
      console.log('association Error:')
      console.log(err);  
      throw err;
    });
  }
};

Barrels.prototype.findOrCreateAssociations=function(association,fixtureObjects){
  var Model=null;
  var records=null;
  var self=this;
  if(association.model){
    Model=sails.models[association.model];
    return self.findOrCreate(Model,fixtureObjects)
    .catch(function(err){
      console.log('findOrCreateAssociation Error:')
      console.log(err);  
      throw err;
    });
  }else{
    Model=sails.models[association.collection];
    return Promise.resolve(fixtureObjects)
    .map(function(record){
      return self.findOrCreate(Model,record)
      .then(function(rs){
        return rs;
      }); 
    }).then(function(records){
      sails.log.info('find create each results');
      sails.log.info(records);
      return records;
    })
    .catch(function(err){
      console.log('findOrCreateAssociation Error:')
      console.log(err);  
      throw err;
    });
  }
};
