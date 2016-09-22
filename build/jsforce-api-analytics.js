(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g=(g.jsforce||(g.jsforce = {}));g=(g.modules||(g.modules = {}));g=(g.api||(g.api = {}));g.Analytics = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @file Manages Salesforce Analytics API
 * @author Shinichi Tomita <shinichi.tomita@gmail.com>
 */

'use strict';

var _ = window.jsforce.require('lodash/core'),
    jsforce = window.jsforce.require('./core'),
    Promise  = window.jsforce.require('./promise');

/**
 * Report instance to retrieving asynchronously executed result
 *
 * @protected
 * @class Analytics~ReportInstance
 * @param {Analytics~Report} report - Report
 * @param {String} id - Report instance id
 */
var ReportInstance = function(report, id) {
  this._report = report;
  this._conn = report._conn;
  this.id = id;
};

/**
 * Retrieve report result asynchronously executed
 *
 * @method Analytics~ReportInstance#retrieve
 * @param {Callback.<Analytics~ReportResult>} [callback] - Callback function
 * @returns {Promise.<Analytics~ReportResult>}
 */
ReportInstance.prototype.retrieve = function(callback) {
  var conn = this._conn,
      report = this._report;
  var url = [ conn._baseUrl(), "analytics", "reports", report.id, "instances", this.id ].join('/');
  return conn.request(url).thenCall(callback);
};

/**
 * Report object in Analytics API
 *
 * @protected
 * @class Analytics~Report
 * @param {Connection} conn Connection
 */
var Report = function(conn, id) {
  this._conn = conn;
  this.id = id;
};

/**
 * Describe report metadata
 *
 * @method Analytics~Report#describe
 * @param {Callback.<Analytics~ReportMetadata>} [callback] - Callback function
 * @returns {Promise.<Analytics~ReportMetadata>}
 */
Report.prototype.describe = function(callback) {
  var url = [ this._conn._baseUrl(), "analytics", "reports", this.id, "describe" ].join('/');
  return this._conn.request(url).thenCall(callback);
};

/**
 * Explain plan for executing report
 *
 * @method Analytics~Report#explain
 * @param {Callback.<ExplainInfo>} [callback] - Callback function
 * @returns {Promise.<ExplainInfo>}
 */
Report.prototype.explain = function(callback) {
  var url = "/query/?explain=" + this.id;
  return this._conn.request(url).thenCall(callback);
};


/**
 * Run report synchronously
 *
 * @method Analytics~Report#execute
 * @param {Object} [options] - Options
 * @param {Boolean} options.details - Flag if include detail in result
 * @param {Analytics~ReportMetadata} options.metadata - Overriding report metadata
 * @param {Callback.<Analytics~ReportResult>} [callback] - Callback function
 * @returns {Promise.<Analytics~ReportResult>}
 */
Report.prototype.run =
Report.prototype.exec =
Report.prototype.execute = function(options, booleanFilter, ids, filterColumn, sortBy, callback) {
  options = options || {};
  if (_.isFunction(options)) {
    callback = options;
    options = {};
  }
  var url = [ this._conn._baseUrl(), "analytics", "reports", this.id ].join('/');
  url += "?includeDetails=" + (options.details ? "true" : "false");
  var params = { method : options.metadata ? 'POST' : 'GET', url : url };
  if (options.metadata) {
    params.headers = { "Content-Type" : "application/json" };
    if (typeof booleanFilter === 'undefined') {
      params.body = '{"reportMetadata": {"reportFilters":' + JSON.stringify(options.metadata) + (sortBy ? ",\"sortBy\":" + JSON.stringify(sortBy) : "") + '}}';
    } else {
      params.body = '{"reportMetadata": {"reportFilters":' + JSON.stringify(options.metadata) + ",\"reportBooleanFilter\":" + JSON.stringify(booleanFilter) + (sortBy ? ",\"sortBy\":" + JSON.stringify(sortBy) : "") + '}}';
    }

  }
  return this._conn.request(params).thenCall(callback);
};


/**
 * Run report asynchronously
 *
 * @method Analytics~Report#executeAsync
 * @param {Object} [options] - Options
 * @param {Boolean} options.details - Flag if include detail in result
 * @param {Analytics~ReportMetadata} options.metadata - Overriding report metadata
 * @param {Callback.<Analytics~ReportInstanceAttrs>} [callback] - Callback function
 * @returns {Promise.<Analytics~ReportInstanceAttrs>}
 */
Report.prototype.executeAsync = function(options, callback) {
  options = options || {};
  if (_.isFunction(options)) {
    callback = options;
    options = {};
  }
  var url = [ this._conn._baseUrl(), "analytics", "reports", this.id, "instances" ].join('/');
  if (options.details) {
    url += "?includeDetails=true";
  }
  var params = { method : 'POST', url : url, body: "" };
  if (options.metadata) {
    params.headers = { "Content-Type" : "application/json" };
    params.body = JSON.stringify(options.metadata);
  }
  return this._conn.request(params).thenCall(callback);
};

/**
 * Get report instance for specified instance ID
 *
 * @method Analytics~Report#instance
 * @param {String} id - Report instance ID
 * @returns {Analytics~ReportInstance}
 */
Report.prototype.instance = function(id) {
  return new ReportInstance(this, id);
};

/**
 * List report instances which had been executed asynchronously
 *
 * @method Analytics~Report#instances
 * @param {Callback.<Array.<Analytics~ReportInstanceAttrs>>} [callback] - Callback function
 * @returns {Promise.<Array.<Analytics~ReportInstanceAttrs>>}
 */
Report.prototype.instances = function(callback) {
  var url = [ this._conn._baseUrl(), "analytics", "reports", this.id, "instances" ].join('/');
  return this._conn.request(url).thenCall(callback);
};


/**
 * API class for Analytics API
 *
 * @class
 * @param {Connection} conn Connection
 */
var Analytics = function(conn) {
  this._conn = conn;
};

/**
 * Get report object of Analytics API
 *
 * @param {String} id - Report Id
 * @returns {Analytics~Report}
 */
Analytics.prototype.report = function(id) {
  return new Report(this._conn, id);
};

/**
 * Get recent report list
 *
 * @param {Callback.<Array.<Analytics~ReportInfo>>} [callback] - Callback function
 * @returns {Promise.<Array.<Analytics~ReportInfo>>}
 */
Analytics.prototype.reports = function(callback) {
  var url = [ this._conn._baseUrl(), "analytics", "reports" ].join('/');
  return this._conn.request(url).thenCall(callback);
};


/*--------------------------------------------*/
/*
 * Register hook in connection instantiation for dynamically adding this API module features
 */
jsforce.on('connection:new', function(conn) {
  conn.analytics = new Analytics(conn);
});


module.exports = Analytics;

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYXBpL2FuYWx5dGljcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQGZpbGUgTWFuYWdlcyBTYWxlc2ZvcmNlIEFuYWx5dGljcyBBUElcbiAqIEBhdXRob3IgU2hpbmljaGkgVG9taXRhIDxzaGluaWNoaS50b21pdGFAZ21haWwuY29tPlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSB3aW5kb3cuanNmb3JjZS5yZXF1aXJlKCdsb2Rhc2gvY29yZScpLFxuICAgIGpzZm9yY2UgPSB3aW5kb3cuanNmb3JjZS5yZXF1aXJlKCcuL2NvcmUnKSxcbiAgICBQcm9taXNlICA9IHdpbmRvdy5qc2ZvcmNlLnJlcXVpcmUoJy4vcHJvbWlzZScpO1xuXG4vKipcbiAqIFJlcG9ydCBpbnN0YW5jZSB0byByZXRyaWV2aW5nIGFzeW5jaHJvbm91c2x5IGV4ZWN1dGVkIHJlc3VsdFxuICpcbiAqIEBwcm90ZWN0ZWRcbiAqIEBjbGFzcyBBbmFseXRpY3N+UmVwb3J0SW5zdGFuY2VcbiAqIEBwYXJhbSB7QW5hbHl0aWNzflJlcG9ydH0gcmVwb3J0IC0gUmVwb3J0XG4gKiBAcGFyYW0ge1N0cmluZ30gaWQgLSBSZXBvcnQgaW5zdGFuY2UgaWRcbiAqL1xudmFyIFJlcG9ydEluc3RhbmNlID0gZnVuY3Rpb24ocmVwb3J0LCBpZCkge1xuICB0aGlzLl9yZXBvcnQgPSByZXBvcnQ7XG4gIHRoaXMuX2Nvbm4gPSByZXBvcnQuX2Nvbm47XG4gIHRoaXMuaWQgPSBpZDtcbn07XG5cbi8qKlxuICogUmV0cmlldmUgcmVwb3J0IHJlc3VsdCBhc3luY2hyb25vdXNseSBleGVjdXRlZFxuICpcbiAqIEBtZXRob2QgQW5hbHl0aWNzflJlcG9ydEluc3RhbmNlI3JldHJpZXZlXG4gKiBAcGFyYW0ge0NhbGxiYWNrLjxBbmFseXRpY3N+UmVwb3J0UmVzdWx0Pn0gW2NhbGxiYWNrXSAtIENhbGxiYWNrIGZ1bmN0aW9uXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48QW5hbHl0aWNzflJlcG9ydFJlc3VsdD59XG4gKi9cblJlcG9ydEluc3RhbmNlLnByb3RvdHlwZS5yZXRyaWV2ZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIHZhciBjb25uID0gdGhpcy5fY29ubixcbiAgICAgIHJlcG9ydCA9IHRoaXMuX3JlcG9ydDtcbiAgdmFyIHVybCA9IFsgY29ubi5fYmFzZVVybCgpLCBcImFuYWx5dGljc1wiLCBcInJlcG9ydHNcIiwgcmVwb3J0LmlkLCBcImluc3RhbmNlc1wiLCB0aGlzLmlkIF0uam9pbignLycpO1xuICByZXR1cm4gY29ubi5yZXF1ZXN0KHVybCkudGhlbkNhbGwoY2FsbGJhY2spO1xufTtcblxuLyoqXG4gKiBSZXBvcnQgb2JqZWN0IGluIEFuYWx5dGljcyBBUElcbiAqXG4gKiBAcHJvdGVjdGVkXG4gKiBAY2xhc3MgQW5hbHl0aWNzflJlcG9ydFxuICogQHBhcmFtIHtDb25uZWN0aW9ufSBjb25uIENvbm5lY3Rpb25cbiAqL1xudmFyIFJlcG9ydCA9IGZ1bmN0aW9uKGNvbm4sIGlkKSB7XG4gIHRoaXMuX2Nvbm4gPSBjb25uO1xuICB0aGlzLmlkID0gaWQ7XG59O1xuXG4vKipcbiAqIERlc2NyaWJlIHJlcG9ydCBtZXRhZGF0YVxuICpcbiAqIEBtZXRob2QgQW5hbHl0aWNzflJlcG9ydCNkZXNjcmliZVxuICogQHBhcmFtIHtDYWxsYmFjay48QW5hbHl0aWNzflJlcG9ydE1ldGFkYXRhPn0gW2NhbGxiYWNrXSAtIENhbGxiYWNrIGZ1bmN0aW9uXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48QW5hbHl0aWNzflJlcG9ydE1ldGFkYXRhPn1cbiAqL1xuUmVwb3J0LnByb3RvdHlwZS5kZXNjcmliZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIHZhciB1cmwgPSBbIHRoaXMuX2Nvbm4uX2Jhc2VVcmwoKSwgXCJhbmFseXRpY3NcIiwgXCJyZXBvcnRzXCIsIHRoaXMuaWQsIFwiZGVzY3JpYmVcIiBdLmpvaW4oJy8nKTtcbiAgcmV0dXJuIHRoaXMuX2Nvbm4ucmVxdWVzdCh1cmwpLnRoZW5DYWxsKGNhbGxiYWNrKTtcbn07XG5cbi8qKlxuICogRXhwbGFpbiBwbGFuIGZvciBleGVjdXRpbmcgcmVwb3J0XG4gKlxuICogQG1ldGhvZCBBbmFseXRpY3N+UmVwb3J0I2V4cGxhaW5cbiAqIEBwYXJhbSB7Q2FsbGJhY2suPEV4cGxhaW5JbmZvPn0gW2NhbGxiYWNrXSAtIENhbGxiYWNrIGZ1bmN0aW9uXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48RXhwbGFpbkluZm8+fVxuICovXG5SZXBvcnQucHJvdG90eXBlLmV4cGxhaW4gPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICB2YXIgdXJsID0gXCIvcXVlcnkvP2V4cGxhaW49XCIgKyB0aGlzLmlkO1xuICByZXR1cm4gdGhpcy5fY29ubi5yZXF1ZXN0KHVybCkudGhlbkNhbGwoY2FsbGJhY2spO1xufTtcblxuXG4vKipcbiAqIFJ1biByZXBvcnQgc3luY2hyb25vdXNseVxuICpcbiAqIEBtZXRob2QgQW5hbHl0aWNzflJlcG9ydCNleGVjdXRlXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gT3B0aW9uc1xuICogQHBhcmFtIHtCb29sZWFufSBvcHRpb25zLmRldGFpbHMgLSBGbGFnIGlmIGluY2x1ZGUgZGV0YWlsIGluIHJlc3VsdFxuICogQHBhcmFtIHtBbmFseXRpY3N+UmVwb3J0TWV0YWRhdGF9IG9wdGlvbnMubWV0YWRhdGEgLSBPdmVycmlkaW5nIHJlcG9ydCBtZXRhZGF0YVxuICogQHBhcmFtIHtDYWxsYmFjay48QW5hbHl0aWNzflJlcG9ydFJlc3VsdD59IFtjYWxsYmFja10gLSBDYWxsYmFjayBmdW5jdGlvblxuICogQHJldHVybnMge1Byb21pc2UuPEFuYWx5dGljc35SZXBvcnRSZXN1bHQ+fVxuICovXG5SZXBvcnQucHJvdG90eXBlLnJ1biA9XG5SZXBvcnQucHJvdG90eXBlLmV4ZWMgPVxuUmVwb3J0LnByb3RvdHlwZS5leGVjdXRlID0gZnVuY3Rpb24ob3B0aW9ucywgYm9vbGVhbkZpbHRlciwgaWRzLCBmaWx0ZXJDb2x1bW4sIHNvcnRCeSwgY2FsbGJhY2spIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIGlmIChfLmlzRnVuY3Rpb24ob3B0aW9ucykpIHtcbiAgICBjYWxsYmFjayA9IG9wdGlvbnM7XG4gICAgb3B0aW9ucyA9IHt9O1xuICB9XG4gIHZhciB1cmwgPSBbIHRoaXMuX2Nvbm4uX2Jhc2VVcmwoKSwgXCJhbmFseXRpY3NcIiwgXCJyZXBvcnRzXCIsIHRoaXMuaWQgXS5qb2luKCcvJyk7XG4gIHVybCArPSBcIj9pbmNsdWRlRGV0YWlscz1cIiArIChvcHRpb25zLmRldGFpbHMgPyBcInRydWVcIiA6IFwiZmFsc2VcIik7XG4gIHZhciBwYXJhbXMgPSB7IG1ldGhvZCA6IG9wdGlvbnMubWV0YWRhdGEgPyAnUE9TVCcgOiAnR0VUJywgdXJsIDogdXJsIH07XG4gIGlmIChvcHRpb25zLm1ldGFkYXRhKSB7XG4gICAgcGFyYW1zLmhlYWRlcnMgPSB7IFwiQ29udGVudC1UeXBlXCIgOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9O1xuICAgIGlmICh0eXBlb2YgYm9vbGVhbkZpbHRlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHBhcmFtcy5ib2R5ID0gJ3tcInJlcG9ydE1ldGFkYXRhXCI6IHtcInJlcG9ydEZpbHRlcnNcIjonICsgSlNPTi5zdHJpbmdpZnkob3B0aW9ucy5tZXRhZGF0YSkgKyAoc29ydEJ5ID8gXCIsXFxcInNvcnRCeVxcXCI6XCIgKyBKU09OLnN0cmluZ2lmeShzb3J0QnkpIDogXCJcIikgKyAnfX0nO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYXJhbXMuYm9keSA9ICd7XCJyZXBvcnRNZXRhZGF0YVwiOiB7XCJyZXBvcnRGaWx0ZXJzXCI6JyArIEpTT04uc3RyaW5naWZ5KG9wdGlvbnMubWV0YWRhdGEpICsgXCIsXFxcInJlcG9ydEJvb2xlYW5GaWx0ZXJcXFwiOlwiICsgSlNPTi5zdHJpbmdpZnkoYm9vbGVhbkZpbHRlcikgKyAoc29ydEJ5ID8gXCIsXFxcInNvcnRCeVxcXCI6XCIgKyBKU09OLnN0cmluZ2lmeShzb3J0QnkpIDogXCJcIikgKyAnfX0nO1xuICAgIH1cblxuICB9XG4gIHJldHVybiB0aGlzLl9jb25uLnJlcXVlc3QocGFyYW1zKS50aGVuQ2FsbChjYWxsYmFjayk7XG59O1xuXG5cbi8qKlxuICogUnVuIHJlcG9ydCBhc3luY2hyb25vdXNseVxuICpcbiAqIEBtZXRob2QgQW5hbHl0aWNzflJlcG9ydCNleGVjdXRlQXN5bmNcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBPcHRpb25zXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9wdGlvbnMuZGV0YWlscyAtIEZsYWcgaWYgaW5jbHVkZSBkZXRhaWwgaW4gcmVzdWx0XG4gKiBAcGFyYW0ge0FuYWx5dGljc35SZXBvcnRNZXRhZGF0YX0gb3B0aW9ucy5tZXRhZGF0YSAtIE92ZXJyaWRpbmcgcmVwb3J0IG1ldGFkYXRhXG4gKiBAcGFyYW0ge0NhbGxiYWNrLjxBbmFseXRpY3N+UmVwb3J0SW5zdGFuY2VBdHRycz59IFtjYWxsYmFja10gLSBDYWxsYmFjayBmdW5jdGlvblxuICogQHJldHVybnMge1Byb21pc2UuPEFuYWx5dGljc35SZXBvcnRJbnN0YW5jZUF0dHJzPn1cbiAqL1xuUmVwb3J0LnByb3RvdHlwZS5leGVjdXRlQXN5bmMgPSBmdW5jdGlvbihvcHRpb25zLCBjYWxsYmFjaykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgaWYgKF8uaXNGdW5jdGlvbihvcHRpb25zKSkge1xuICAgIGNhbGxiYWNrID0gb3B0aW9ucztcbiAgICBvcHRpb25zID0ge307XG4gIH1cbiAgdmFyIHVybCA9IFsgdGhpcy5fY29ubi5fYmFzZVVybCgpLCBcImFuYWx5dGljc1wiLCBcInJlcG9ydHNcIiwgdGhpcy5pZCwgXCJpbnN0YW5jZXNcIiBdLmpvaW4oJy8nKTtcbiAgaWYgKG9wdGlvbnMuZGV0YWlscykge1xuICAgIHVybCArPSBcIj9pbmNsdWRlRGV0YWlscz10cnVlXCI7XG4gIH1cbiAgdmFyIHBhcmFtcyA9IHsgbWV0aG9kIDogJ1BPU1QnLCB1cmwgOiB1cmwsIGJvZHk6IFwiXCIgfTtcbiAgaWYgKG9wdGlvbnMubWV0YWRhdGEpIHtcbiAgICBwYXJhbXMuaGVhZGVycyA9IHsgXCJDb250ZW50LVR5cGVcIiA6IFwiYXBwbGljYXRpb24vanNvblwiIH07XG4gICAgcGFyYW1zLmJvZHkgPSBKU09OLnN0cmluZ2lmeShvcHRpb25zLm1ldGFkYXRhKTtcbiAgfVxuICByZXR1cm4gdGhpcy5fY29ubi5yZXF1ZXN0KHBhcmFtcykudGhlbkNhbGwoY2FsbGJhY2spO1xufTtcblxuLyoqXG4gKiBHZXQgcmVwb3J0IGluc3RhbmNlIGZvciBzcGVjaWZpZWQgaW5zdGFuY2UgSURcbiAqXG4gKiBAbWV0aG9kIEFuYWx5dGljc35SZXBvcnQjaW5zdGFuY2VcbiAqIEBwYXJhbSB7U3RyaW5nfSBpZCAtIFJlcG9ydCBpbnN0YW5jZSBJRFxuICogQHJldHVybnMge0FuYWx5dGljc35SZXBvcnRJbnN0YW5jZX1cbiAqL1xuUmVwb3J0LnByb3RvdHlwZS5pbnN0YW5jZSA9IGZ1bmN0aW9uKGlkKSB7XG4gIHJldHVybiBuZXcgUmVwb3J0SW5zdGFuY2UodGhpcywgaWQpO1xufTtcblxuLyoqXG4gKiBMaXN0IHJlcG9ydCBpbnN0YW5jZXMgd2hpY2ggaGFkIGJlZW4gZXhlY3V0ZWQgYXN5bmNocm9ub3VzbHlcbiAqXG4gKiBAbWV0aG9kIEFuYWx5dGljc35SZXBvcnQjaW5zdGFuY2VzXG4gKiBAcGFyYW0ge0NhbGxiYWNrLjxBcnJheS48QW5hbHl0aWNzflJlcG9ydEluc3RhbmNlQXR0cnM+Pn0gW2NhbGxiYWNrXSAtIENhbGxiYWNrIGZ1bmN0aW9uXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48QXJyYXkuPEFuYWx5dGljc35SZXBvcnRJbnN0YW5jZUF0dHJzPj59XG4gKi9cblJlcG9ydC5wcm90b3R5cGUuaW5zdGFuY2VzID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgdmFyIHVybCA9IFsgdGhpcy5fY29ubi5fYmFzZVVybCgpLCBcImFuYWx5dGljc1wiLCBcInJlcG9ydHNcIiwgdGhpcy5pZCwgXCJpbnN0YW5jZXNcIiBdLmpvaW4oJy8nKTtcbiAgcmV0dXJuIHRoaXMuX2Nvbm4ucmVxdWVzdCh1cmwpLnRoZW5DYWxsKGNhbGxiYWNrKTtcbn07XG5cblxuLyoqXG4gKiBBUEkgY2xhc3MgZm9yIEFuYWx5dGljcyBBUElcbiAqXG4gKiBAY2xhc3NcbiAqIEBwYXJhbSB7Q29ubmVjdGlvbn0gY29ubiBDb25uZWN0aW9uXG4gKi9cbnZhciBBbmFseXRpY3MgPSBmdW5jdGlvbihjb25uKSB7XG4gIHRoaXMuX2Nvbm4gPSBjb25uO1xufTtcblxuLyoqXG4gKiBHZXQgcmVwb3J0IG9iamVjdCBvZiBBbmFseXRpY3MgQVBJXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGlkIC0gUmVwb3J0IElkXG4gKiBAcmV0dXJucyB7QW5hbHl0aWNzflJlcG9ydH1cbiAqL1xuQW5hbHl0aWNzLnByb3RvdHlwZS5yZXBvcnQgPSBmdW5jdGlvbihpZCkge1xuICByZXR1cm4gbmV3IFJlcG9ydCh0aGlzLl9jb25uLCBpZCk7XG59O1xuXG4vKipcbiAqIEdldCByZWNlbnQgcmVwb3J0IGxpc3RcbiAqXG4gKiBAcGFyYW0ge0NhbGxiYWNrLjxBcnJheS48QW5hbHl0aWNzflJlcG9ydEluZm8+Pn0gW2NhbGxiYWNrXSAtIENhbGxiYWNrIGZ1bmN0aW9uXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48QXJyYXkuPEFuYWx5dGljc35SZXBvcnRJbmZvPj59XG4gKi9cbkFuYWx5dGljcy5wcm90b3R5cGUucmVwb3J0cyA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIHZhciB1cmwgPSBbIHRoaXMuX2Nvbm4uX2Jhc2VVcmwoKSwgXCJhbmFseXRpY3NcIiwgXCJyZXBvcnRzXCIgXS5qb2luKCcvJyk7XG4gIHJldHVybiB0aGlzLl9jb25uLnJlcXVlc3QodXJsKS50aGVuQ2FsbChjYWxsYmFjayk7XG59O1xuXG5cbi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuLypcbiAqIFJlZ2lzdGVyIGhvb2sgaW4gY29ubmVjdGlvbiBpbnN0YW50aWF0aW9uIGZvciBkeW5hbWljYWxseSBhZGRpbmcgdGhpcyBBUEkgbW9kdWxlIGZlYXR1cmVzXG4gKi9cbmpzZm9yY2Uub24oJ2Nvbm5lY3Rpb246bmV3JywgZnVuY3Rpb24oY29ubikge1xuICBjb25uLmFuYWx5dGljcyA9IG5ldyBBbmFseXRpY3MoY29ubik7XG59KTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEFuYWx5dGljcztcbiJdfQ==
