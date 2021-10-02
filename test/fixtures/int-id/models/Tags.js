/**
 * Tags
 */

module.exports = {
  attributes: {
    products: {
      collection: 'products',
      via: 'tags'
    }
  }
};
