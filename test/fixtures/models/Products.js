/**
 * Products
 *
 */

module.exports = {
  attributes: {
  	name: 'string',
    category: {
      model: 'categories'
    },
    tags: {
      collection: 'tags',
      via: 'products',
      dominant: true
    }
  }
};
