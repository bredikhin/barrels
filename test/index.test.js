var assert = require('assert')
  , barrels = require('../');

describe('Barrels', function() {
  // Load fixtures into memory
  describe('#load()', function() {
    var fixtures = barrels.load().objects;
    it ("should load all the json files from default folder", function() {
      assert.equal(Object.keys(fixtures).length, 2, 'Both fixture files should be loaded!');
    });

    it ("should set generate lowercase property names for models", function() {
      var oneWord = Object.keys(fixtures).join();
      assert.equal(oneWord, oneWord.toLowerCase(), 'Property names should be in lowercase!');
    });
  });
});
