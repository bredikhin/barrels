/**
 * Region
 */

module.exports = {
  attributes: {
    product: {
      collection: 'products',
      via: 'regions'
    },

    name: {
        type: 'string'
    }
  }

};
