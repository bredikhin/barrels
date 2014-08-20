var assert = require('assert')
  , barrels = require('../')
  , Sails = require('sails');

describe('Barrels', function() {
  var fixtures = barrels.load().objects;

  // Load fixtures into memory
  describe('#load()', function() {
    it ("should load all the json files from default folder", function() {
      assert((Object.keys(fixtures).length >= 2), 'At least two fixture files should be loaded!');
    });

    it ("should set generate lowercase property names for models", function() {
      var oneWord = Object.keys(fixtures).join();
      assert.equal(oneWord, oneWord.toLowerCase(), 'Property names should be in lowercase!');
    });
  });

  // Populate DB with fixtures
  describe('#populate()', function() {
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
          "grunt": false
        }
      }, function(err, sails) {
        done(err);
      });
    });

    after(function(done) {
      sails.lower(done);
    });

    it ('should populate the DB with apples and oranges', function(done) {
      barrels.populate(function(err) {
        if (err)
          return done(err);
        Apples.find(function(err, apples) {
          if (err)
            return done(err);
          var gotApples = (fixtures['apples'].length > 0);
          var applesAreInTheDb = (apples.length === fixtures['apples'].length);
          assert(gotApples&&applesAreInTheDb, 'There must be something!');

          Oranges.find(function(err, oranges) {
            if (err)
              return done(err);
            assert.equal(apples.length, oranges.length,
              'Apples and oranges should have equal amount of varieties!');
            done();
          });
        });
      });
    });
  }); 
});
