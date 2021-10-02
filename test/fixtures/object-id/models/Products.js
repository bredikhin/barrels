/**
 * Products
 */

module.exports = {
  attributes: {
    customId: {
      type: 'string',
      primaryKey: true
    },
    name: 'string',
    category: {
      model: 'categories'
    },
    tags: {
      collection: 'tags',
      via: 'products',
      dominant: true
    },
    seller: {
      model: 'sellers',
      required: true
    },
    regions: {
      collection: 'regions',
      via: 'products',
      required: true
    }
  }
};
