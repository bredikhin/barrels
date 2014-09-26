var assert = require('assert');
var Barrels = require('../');
var barrels = new Barrels();
var Sails = require('sails');

describe('Barrels', function() {
  var fixtures = barrels.data;

  // Load fixtures into memory
  describe('constructor', function() {
    it ("should load all the json files from default folder", function() {
      assert((Object.keys(fixtures).length >= 2), 'At least two fixture files should be loaded!');
    });

    it ("should set generate lowercase property names for models", function() {
      var oneWord = Object.keys(fixtures).join();
      assert.equal(oneWord, oneWord.toLowerCase(), 'Property names should be in lowercase!');
    });
  });

  // Populate DB with fixtures
  describe('populate()', function() {
    before(function(done) {
      Sails.lift({
        log: {
          level: 'error'
        },
        paths: {
          models: require('path').join(process.cwd(), 'test/fixtures/models')
        },
        connections: {
          test: {
            adapter: 'sails-memory'
          }
        },
        models: {
          connection: 'test',
          migrate: 'drop'
        },
        hooks: {
          grunt: false
        }
      }, function(err, sails) {
        done(err);
      });
    });

    after(function(done) {
      sails.lower(done);
    });

    it ('should populate the DB with products and categories', function(done) {
      barrels.populate(function(err) {
        if (err)
          return done(err);

        Categories.find(function(err, categories) {
          if (err)
            return done(err);

          var gotCategories = (fixtures['categories'].length > 0);
          var categoriesAreInTheDb = (categories.length === fixtures['categories'].length);
          assert(gotCategories&&categoriesAreInTheDb, 'There must be something!');

          Products.find(function(err, products) {
            if (err)
              return done(err);
            assert.equal(categories.length, products.length,
              'Categories and products should have equal amount of entries!');
            done();
          });
        });
      });
    });
  });
});
