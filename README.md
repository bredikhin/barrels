# Simple DB Fixtures for Sails.js with Associations Support

[![Build Status](https://travis-ci.org/bredikhin/barrels.png?branch=master)](https://travis-ci.org/bredikhin/barrels)
[![Dependency Status](https://gemnasium.com/bredikhin/barrels.png)](https://gemnasium.com/bredikhin/barrels)

## Project Status

This project is currently UNMAINTAINED since the topic is out of my current interests. 

**A newer, Sails v1 compatible version is available via the [`Fixted`](https://www.npmjs.com/package/fixted) package by NeoNexus.**

## Installation

`$ npm i --save-dev barrels`

## Usage

Drop your fixtures in `test/fixtures` as JSON files (or CommonJS modules) named after your models.

Once your [Sails.js](http://sailsjs.org/) server is started:

    var Barrels = require('barrels');
    var barrels = new Barrels();
    var fixtures = barrels.data;
    barrels.populate(function(err) {
      ...
    });

Pass to the constructor the path to the folder containing your fixtures
(defaults to `./test/fixtures`).

`Populate`'ing the test database involves three steps:

* Removing any existing data from the collection corresponding to the fixture
* Loading the fixture data into the test database
* Automatically applying associations (can be disabled by passing `false` as
  the last parameter to `populate`)

`Populate` also accepts an array of names of collections to populate as
the first (optional) argument, for example:

    barrels.populate(['products'], function(err) {
      // Only products will be populated
      ...
    });

## Automatic association

Use the number of position (starting from one) of an entry in the JSON fixture
as a reference to associate models (see
https://github.com/bredikhin/barrels/blob/master/test/fixtures/products.json
for example). This feature can be disabled by passing `false` as the last
parameter to `populate`.

## Required associations

If you have any associations described as `required: true`, they will be
added automatically, no matter if the last parameter to `populate` is `false`
or not. However, you have to load your fixtures gradually (by passing an array
of collection names as the first parameter) in such an order that collections
corresponding to the required associations get populated first.

Let's say, for example, you are implementing a `Passport.js`-based
authentication, and every `Passport` has `User` as a required association. You'd
write something like this:

```javascript
barrels.populate(['user', 'passport'], function(err) {
  if (err)
    return done(err); // Higher level callback

  // Do your thing...
  done();
});
```

## Dependencies

* [Async.js](https://github.com/caolan/async)
* [Lo-Dash](http://lodash.com/)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2013-2015 [Ruslan Bredikhin](http://ruslanbredikhin.com/)
