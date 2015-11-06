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
    it('should load all the json files from default folder', function(done) {
      Object.keys(fixtures).length.should.be.greaterThan(1,
        'At least two fixture files should be loaded!');

      done();
    });

    it('should set generate lowercase property names for models', function(done) {
      var oneWord = Object.keys(fixtures).join();
      oneWord.toLowerCase().should.be.eql(oneWord,
        'Property names should be in lowercase!');

      done();
    });
  });

  // Populate DB with fixtures
  describe('populate()', function() {
    before(function(done) {
      Sails.lift({
        paths: {
          models: require('path').join(process.cwd(),
            'test/fixtures/models')
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
      Sails.lower(done);
    });

    describe('populate(cb)', function() {
      before(function(done) {
        barrels.populate(['sellers', 'regions'], function(err) {
          if (err)
            return done(err);

          barrels.populate(['categories', 'products', 'tags'], function (err) {
            if (err)
              return done(err);

            done();
          });
        });
      });

      it('should populate the DB with products and categories', function(done) {
        Categories.find().exec(function(err, categories) {
          if (err)
            return done(err);

          var gotCategories = (fixtures['categories'].length > 0);
          var categoriesAreInTheDb = (categories.length === fixtures['categories'].length);
          should(gotCategories && categoriesAreInTheDb).be.ok;

          Products.find().exec(function(err, products) {
            if (err)
              return done(err);

            categories.length.should.be.eql(products.length, 'Categories and products should have equal amount of entries!');

            done();
          });
        });
      });

      it('should assign a category to each product', function(done) {
        Products.find().populate('category').exec(function(err, products) {
          if (err)
            return done(err);

          async.each(products, function(product, nextProduct) {
            should(product.category.name).not.be.empty;

            nextProduct();
          }, done);
        });
      });

      it('should assign at least two tags to each product', function(done) {
        Products.find().populate('tags').exec(function(err, products) {
          if (err)
            return done(err);

          async.each(products, function(product, nextProduct) {
            should(product.tags.length).be.greaterThan(1);

            nextProduct();
          }, done);
        });
      });

      it('should assign at least two regions to each product', function(done) {
        Products.find().populate('regions').exec(function(err, products) {
          if (err)
            return done(err);

          async.each(products, function(product, nextProduct) {
            should(product.regions.length).be.greaterThan(1);

            nextProduct();
          }, done);
        });
      });
    });

    describe('populate(cb, false)', function() {
      before(function(done) {
        barrels.populate(['sellers', 'regions'], function(err) {
          if (err)
            return done(err);

          barrels.populate(['categories', 'products', 'tags'], function (err) {
            if (err)
              return done(err);

            done();
          }, false);
        }, false);
      });

      it('should keep the associations-related fields', function(done) {
        Products.find().exec(function(err, products) {
          if (err)
            return done(err);

          async.each(products, function(product, nextProduct) {
            product.category.should.be.a.Number;
            product.tags.should.be.an.Array;

            nextProduct();
          }, done);
        });
      });

      it('should always populate required associations', function(done) {
        Products.find().populate('regions').exec(function(err, products) {
          if (err)
            return done(err);

          async.each(products, function(product, nextProduct) {
            should(product.regions.length).be.greaterThan(1);

            nextProduct();
          }, done);
        });
      });

    });

    describe('populate(modelList, cb)', function() {
      before(function(done) {
        Products.destroy().exec(function(err) {
          if (err)
            return done(err);

          Categories.destroy().exec(function(err) {
            if (err)
              return done(err);

            barrels.populate(['sellers', 'regions'], function(err) {
              if (err)
		            return done(err);

              barrels.populate(['products', 'tags'], function(err) {
                if (err)
                  return done(err);

                done();
              });
            });
          });
        });
      });

      it('should populate products but not categories', function(done) {
        Products.find().exec(function(err, products) {
          if (err)
            return done(err);

          products.length.should.be.greaterThan(1);
        });

        Categories.find().exec(function(err, categories) {
          if (err)
            return done(err);

          categories.length.should.be.eql(0);
        });

        done();
      });
    });

    it('should ask for specific order while populating models with required associations', function(done) {
      barrels.populate(['products'], function(err) {
        should(err.message).be.eql('Please provide a loading order acceptable for required associations');

        done();
      });
    });
  });
});
