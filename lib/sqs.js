'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const AWS = require('aws-sdk');
const debug = require('debug')('loopback:connector:sqs');

function SQS(settings) {
  const endpointSetting = {
    QueueUrl: settings.endpoint,
  };
  const constructorOptions = [
    'params',
    'endpoint',
    'accessKeyId',
    'secretAccessKey',
    'sessionToken',
    'credentials',
    'credentialProvider',
    'region',
    'maxRetries',
    'maxRedirects',
    'sslEnabled',
    'paramValidation',
    'min',
    'max',
    'pattern',
    'enum',
    'computeChecksums',
    'convertResponseTypes',
    'correctClockSkew',
    's3ForcePathStyle',
    's3BucketEndpoint',
    's3DisableBodySigning',
    'retryDelayOptions',
    'base',
    'customBackoff',
    'httpOptions',
    'proxy',
    'agent',
    'timeout',
    'xhrAsync',
    'xhrWithCredentials',
    'apiVersion',
    'apiVersions',
    'logger',
    'systemClockOffset',
    'signatureVersion',
    'signatureCache'];

  this.driver = new AWS.SQS(_.pick(settings, constructorOptions));
  this.endpoint = settings.endpoint;

  const sendMessage = Promise.promisify(this.driver.sendMessage, {
    context: this.driver
  });
  const receiveMessage = Promise.promisify(this.driver.receiveMessage, {
    context: this.driver
  });
  const deleteMessage = Promise.promisify(this.driver.deleteMessage, {
    context: this.driver
  });
  function callDriver(method) {
    return function(options, cb) {
      var promise = method(_.defaults(options, endpointSetting));
      debug('Calling SQS with settings: %j', options);

      if (_.isFunction(cb)) {
        promise.asCallback(cb);
      } else {
        return promise;
      }
    };
  }
  var Queue = SQS.prototype.DataAccessObject = function() {
  };

  Queue.create = Queue.send = Queue.prototype.send = callDriver(sendMessage);

  Queue.find = callDriver(receiveMessage);

  Queue.destroyById = callDriver(deleteMessage);
}

exports.initialize = function initializeDataSource(dataSource, cb) {
  dataSource.connector = new SQS(dataSource.settings);
  dataSource.connector.dataSource = dataSource;

  if (_.isFunction(cb)) {
    cb();
  }
};

exports.SQS = SQS;
