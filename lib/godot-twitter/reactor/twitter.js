/*
 * flowdock.js: Stream responsible for sending tweet on data events.
 *
 * @obazoud
 *
 * Configuration sample:
 *
 *  godot.createServer({
 *    type: 'tcp',
 *    reactors: [
 *      godot.reactor()
 *        .twitter({
 *          consumer_key: "xxx",
 *          consumer_secret: "xxx",
 *          access_token_key: "xxx",
 *          access_token_secret: "xxx"
 *        })
 *    ]
 *  }).listen(1337);
 *
 *
 */

var utile       = require('utile'),
    path        = require('path'),
    twitter     = require('ntwitter');

godotPath       = path.dirname(require.resolve('godot'));
ReadWriteStream = require(godotPath + '/godot/common').ReadWriteStream;

//
// ### function Twitter (options)
// #### @options {Object} Options for sending tweet message.
// ####   @options.consumer_key         {string} The consumer key.
// ####   @options.consumer_secret      {string} The consumer secret.
// ####   @options.access_token_key     {Object} The access token key.
// ####   @options.access_token_secret  {Object} The access token secret.
// ####   @options.formatter            {Function} Alternative formatter.
//
// Constructor function for the Twitter stream responsible for sending
// tweet message on data events.
// 
//
var Twitter = module.exports = function Twitter(options) {
  if (!options || !options.consumer_key || !options.consumer_secret || !options.access_token_key || !options.access_token_secret) {
    throw new Error('options.consumer_key, options.consumer_secret, options.access_token_key and options.access_token_secret are required');
  }

  ReadWriteStream.call(this);

  var self = this;

  this.consumer_key          = options.consumer_key;
  this.consumer_secret       = options.consumer_secret;
  this.access_token_key      = options.access_token_key;
  this.access_token_secret   = options.access_token_secret;

  this.interval   = options.interval;
  this._last      = 0;

  this.format  = options.formatter || this.formatter;

  this.twit = new twitter({
      consumer_key: this.consumer_key,
      consumer_secret: this.consumer_secret,
      access_token_key: this.access_token_key,
      access_token_secret: this.access_token_secret
    });

  this.twit.tweet = function(message, options) {
      self.twit.verifyCredentials(function (err, data) {
        // console.log(err);
        // console.log("verifyCredentials: " + JSON.stringify(data));
      }).updateStatus(message, function (err, data) {
        // console.log(err);
        // console.log("Send a tweet: " + message);
      });
    };};

//
// Inherit from ReadWriteStream.
//
utile.inherits(Twitter, ReadWriteStream);

//
// ### function write (data)
// #### @data {Object} JSON to send tweet message
// Sends message with the specified `data`.
//
Twitter.prototype.write = function (data) {
  var self = this;

  //
  // Return immediately if we have sent a message
  // in a time period less than `this.interval`.
  //
  if (this.interval && this._last
      && ((new Date()) - this._last) <= this.interval) {
    return;
  }

  self._last = new Date();
  
  self.twit.tweet(this.format(data));

  return self.emit('data', data);
}

Twitter.prototype.formatter = function (data) {
  var message = "#godot " + Object.keys(data).map(function(x) {
    return [x, data[x]].join(': ');
  }).join(',');
  return message.substring(0, 138);
};
