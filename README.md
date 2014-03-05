# Simple DB Fixtures for Sails.js

[![Build Status](https://travis-ci.org/bredikhin/barrels.png?branch=master)](https://travis-ci.org/bredikhin/barrels)
[![Dependency Status](https://gemnasium.com/bredikhin/barrels.png)](https://gemnasium.com/bredikhin/barrels)


## Installation

`$ npm install barrels`

or add the module to your `package.json` and run

`$ npm install`

## Usage

Drop your fixtures in `test/fixtures` as JSON files named after your models.

Once your [Sails.js](http://sailsjs.org/) server is started:

    var barrels = require('barrels');
    var fixtures = barrels.load().objects;
    barrels.populate(function(err) {
      ...
    });

After `load` the fixture data will be accessible via the `objects` property.

`Populate`'ing the test database involves two steps:

* Removing any existing data from the collection corresponding to the fixture
* Loading the fixture data into the test database

## Dependencies

* [Async.js](https://github.com/caolan/async)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2013 [Ruslan Bredikhin](http://ruslanbredikhin.com/)
