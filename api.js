const app = require('./server.cjs');

module.exports = (req, res) => {
  app(req, res);
}; 