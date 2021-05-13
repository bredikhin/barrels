/**
 * Categories
 */

module.exports = {
  attributes: {
    products: {
      collection: 'products',
      via: 'category'
    }
  }
};
