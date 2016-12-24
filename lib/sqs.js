'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const AWS = require('aws-sdk');
const debug = require('debug')('loopback:connector:sqs');

function SQS(settings) {
  const self = this;
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
  const driverSettings = _.pick(settings, constructorOptions);

  self.driver = new AWS.SQS(driverSettings);
  debug('Calling SQS with settings: %O', driverSettings);
  self.endpoint = settings.endpoint;
  debug('Default endpoint, if not provided: %s', self.endpoint);

  var Queue = SQS.prototype.DataAccessObject = function() {
  };

  Queue.create = function(message, options, cb) {
    if (_.isFunction(options) && cb === undefined) {
      cb = options;
      options = undefined;
    }

    (options || (options = {})).MessageBody = JSON.stringify(message);
    const sendMessage = Promise.promisify(self.driver.sendMessage, {
      context: self.driver
    });
    var promise = sendMessage(_.defaults(options, endpointSetting));
    debug('Calling SQS `sendMessage` with settings: %O', options);

    if (_.isFunction(cb)) {
      promise.asCallback(cb);
    } else {
      return promise;
    }
  };

  Queue.find = function(options, cb) {
    const receiveMessage = Promise.promisify(self.driver.receiveMessage, {
      context: self.driver
    });
    var promise = receiveMessage(_.defaults(options, endpointSetting));
    debug('Calling SQS `receiveMessage` with settings: %O', options);

    if (_.isFunction(cb)) {
      promise.asCallback(cb);
    } else {
      return promise;
    }
  };

  Queue.destroyByReceiptHandle = function(handle, cb) {
    const options = {
      ReceiptHandle: handle
    };
    const deleteMessage = Promise.promisify(self.driver.deleteMessage, {
      context: self.driver
    });
    var promise = deleteMessage(_.defaults(options, endpointSetting));
    debug('Calling SQS `deleteMessage` with settings: %O', options);

    if (_.isFunction(cb)) {
      promise.asCallback(cb);
    } else {
      return promise;
    }
  };
}

exports.initialize = function initializeDataSource(dataSource, cb) {
  dataSource.connector = new SQS(dataSource.settings);
  dataSource.connector.dataSource = dataSource;

  if (_.isFunction(cb)) {
    cb();
  }
};

exports.SQS = SQS;
