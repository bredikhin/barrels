'use strict';

/**
 * Dependencies
 */
var should = require('should');
var Sails = require('sails');
var Barrels = require('../');
var barrels = new Barrels();

describe('Barrels', function() {
  var fixtures = barrels.data;

  // Load fixtures into memory
  describe('constructor', function() {
    it ('should load all the json files from default folder', function() {
      Object.keys(fixtures).length.should.be.greaterThan(1, 'At least two fixture files should be loaded!');
    });

    it ('should set generate lowercase property names for models', function() {
      var oneWord = Object.keys(fixtures).join();
      oneWord.toLowerCase().should.be.eql(oneWord, 'Property names should be in lowercase!');
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
        if (err)
          return done(err);

        barrels.populate(done);
      });
    });

    after(function(done) {
      sails.lower(done);
    });

    it ('should populate the DB with products and categories', function(done) {
      Categories.find().exec(function(err, categories) {
        if (err)
          return done(err);

        var gotCategories = (fixtures['categories'].length > 0);
        var categoriesAreInTheDb = (categories.length === fixtures['categories'].length);
        should(gotCategories&&categoriesAreInTheDb).be.ok;

        Products.find().exec(function(err, products) {
          if (err)
            return done(err);

          categories.length.should.be.eql(products.length,
            'Categories and products should have equal amount of entries!');
          done();
        });
      });
    });

    it ('should assign a category to each product', function(done) {
      Products.find().populate('category').exec(function(err, products) {
        if (err)
          return done(err);

        async.each(products, function(product, nextProduct) {
          should(product.category.name).not.be.empty;

          nextProduct();
        }, done);
      });
    });

    it ('should assign at least two tags to each product', function(done) {
      Products.find().populate('tags').exec(function(err, products) {
        if (err)
          return done(err);

        async.each(products, function(product, nextProduct) {
          should(product.tags.length).be.greaterThan(1);

          nextProduct();
        }, done);
      });
    });
  });
});
