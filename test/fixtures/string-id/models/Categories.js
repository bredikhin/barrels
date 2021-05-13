/**
 * Categories
 */

module.exports = {
  attributes: {
    id: {
      type: 'string',
      primaryKey: true,
      required: true
    },
    products: {
      collection: 'products',
      via: 'category'
    }
  }
};
