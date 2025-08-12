const formatPrice = (priceStr) => {
  return parseInt(priceStr.replace(/[^\d]/g, ''));
};

module.exports = formatPrice;
