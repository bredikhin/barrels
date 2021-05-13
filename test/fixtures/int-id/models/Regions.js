/**
 * Region
 */

module.exports = {
  attributes: {
    products: {
      collection: 'products',
      via: 'regions'
    },
    name: {
        type: 'string'
    }
  }
};
