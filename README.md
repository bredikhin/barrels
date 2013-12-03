# Simple DB Fixtures for Sails.js

## Installation

  $ npm install barrels
or add the module to your `package.json` and run
  $ npm install

## Usage

Once your [Sails.js](http://sailsjs.org/) server is started:

    var barrels = require('barrels');
    var fixtures = barrels.load().populate(function(err) {
      ...
    }).objects;

After `load` the fixture data will be accessible via the `objects` property.

`Populate`'ing the test database involves two steps:

* Removing any existing data from the collection corresponding to the fixture
* Loading the fixture data into the test database

## Dependencies

* [Sails.js](http://sailsjs.org/)
* [Async.js](https://github.com/caolan/async)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2013 Ruslan Bredikhin ([http://ruslanbredikhin.com/](http://ruslanbredikhin.com/))
