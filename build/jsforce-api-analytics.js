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
Report.prototype.execute = function(options, booleanFilter, ids, filterColumn, callback) {
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
      params.body = '{"reportMetadata": {"reportFilters":' + JSON.stringify(options.metadata) + '}}';
    } else {
      params.body = '{"reportMetadata": {"reportFilters":' + JSON.stringify(options.metadata) + ",\"reportBooleanFilter\":" + JSON.stringify(booleanFilter) + '}}';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvYXBpL2FuYWx5dGljcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQGZpbGUgTWFuYWdlcyBTYWxlc2ZvcmNlIEFuYWx5dGljcyBBUElcbiAqIEBhdXRob3IgU2hpbmljaGkgVG9taXRhIDxzaGluaWNoaS50b21pdGFAZ21haWwuY29tPlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSB3aW5kb3cuanNmb3JjZS5yZXF1aXJlKCdsb2Rhc2gvY29yZScpLFxuICAgIGpzZm9yY2UgPSB3aW5kb3cuanNmb3JjZS5yZXF1aXJlKCcuL2NvcmUnKSxcbiAgICBQcm9taXNlICA9IHdpbmRvdy5qc2ZvcmNlLnJlcXVpcmUoJy4vcHJvbWlzZScpO1xuXG4vKipcbiAqIFJlcG9ydCBpbnN0YW5jZSB0byByZXRyaWV2aW5nIGFzeW5jaHJvbm91c2x5IGV4ZWN1dGVkIHJlc3VsdFxuICpcbiAqIEBwcm90ZWN0ZWRcbiAqIEBjbGFzcyBBbmFseXRpY3N+UmVwb3J0SW5zdGFuY2VcbiAqIEBwYXJhbSB7QW5hbHl0aWNzflJlcG9ydH0gcmVwb3J0IC0gUmVwb3J0XG4gKiBAcGFyYW0ge1N0cmluZ30gaWQgLSBSZXBvcnQgaW5zdGFuY2UgaWRcbiAqL1xudmFyIFJlcG9ydEluc3RhbmNlID0gZnVuY3Rpb24ocmVwb3J0LCBpZCkge1xuICB0aGlzLl9yZXBvcnQgPSByZXBvcnQ7XG4gIHRoaXMuX2Nvbm4gPSByZXBvcnQuX2Nvbm47XG4gIHRoaXMuaWQgPSBpZDtcbn07XG5cbi8qKlxuICogUmV0cmlldmUgcmVwb3J0IHJlc3VsdCBhc3luY2hyb25vdXNseSBleGVjdXRlZFxuICpcbiAqIEBtZXRob2QgQW5hbHl0aWNzflJlcG9ydEluc3RhbmNlI3JldHJpZXZlXG4gKiBAcGFyYW0ge0NhbGxiYWNrLjxBbmFseXRpY3N+UmVwb3J0UmVzdWx0Pn0gW2NhbGxiYWNrXSAtIENhbGxiYWNrIGZ1bmN0aW9uXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48QW5hbHl0aWNzflJlcG9ydFJlc3VsdD59XG4gKi9cblJlcG9ydEluc3RhbmNlLnByb3RvdHlwZS5yZXRyaWV2ZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIHZhciBjb25uID0gdGhpcy5fY29ubixcbiAgICAgIHJlcG9ydCA9IHRoaXMuX3JlcG9ydDtcbiAgdmFyIHVybCA9IFsgY29ubi5fYmFzZVVybCgpLCBcImFuYWx5dGljc1wiLCBcInJlcG9ydHNcIiwgcmVwb3J0LmlkLCBcImluc3RhbmNlc1wiLCB0aGlzLmlkIF0uam9pbignLycpO1xuICByZXR1cm4gY29ubi5yZXF1ZXN0KHVybCkudGhlbkNhbGwoY2FsbGJhY2spO1xufTtcblxuLyoqXG4gKiBSZXBvcnQgb2JqZWN0IGluIEFuYWx5dGljcyBBUElcbiAqXG4gKiBAcHJvdGVjdGVkXG4gKiBAY2xhc3MgQW5hbHl0aWNzflJlcG9ydFxuICogQHBhcmFtIHtDb25uZWN0aW9ufSBjb25uIENvbm5lY3Rpb25cbiAqL1xudmFyIFJlcG9ydCA9IGZ1bmN0aW9uKGNvbm4sIGlkKSB7XG4gIHRoaXMuX2Nvbm4gPSBjb25uO1xuICB0aGlzLmlkID0gaWQ7XG59O1xuXG4vKipcbiAqIERlc2NyaWJlIHJlcG9ydCBtZXRhZGF0YVxuICpcbiAqIEBtZXRob2QgQW5hbHl0aWNzflJlcG9ydCNkZXNjcmliZVxuICogQHBhcmFtIHtDYWxsYmFjay48QW5hbHl0aWNzflJlcG9ydE1ldGFkYXRhPn0gW2NhbGxiYWNrXSAtIENhbGxiYWNrIGZ1bmN0aW9uXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48QW5hbHl0aWNzflJlcG9ydE1ldGFkYXRhPn1cbiAqL1xuUmVwb3J0LnByb3RvdHlwZS5kZXNjcmliZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIHZhciB1cmwgPSBbIHRoaXMuX2Nvbm4uX2Jhc2VVcmwoKSwgXCJhbmFseXRpY3NcIiwgXCJyZXBvcnRzXCIsIHRoaXMuaWQsIFwiZGVzY3JpYmVcIiBdLmpvaW4oJy8nKTtcbiAgcmV0dXJuIHRoaXMuX2Nvbm4ucmVxdWVzdCh1cmwpLnRoZW5DYWxsKGNhbGxiYWNrKTtcbn07XG5cbi8qKlxuICogRXhwbGFpbiBwbGFuIGZvciBleGVjdXRpbmcgcmVwb3J0XG4gKlxuICogQG1ldGhvZCBBbmFseXRpY3N+UmVwb3J0I2V4cGxhaW5cbiAqIEBwYXJhbSB7Q2FsbGJhY2suPEV4cGxhaW5JbmZvPn0gW2NhbGxiYWNrXSAtIENhbGxiYWNrIGZ1bmN0aW9uXG4gKiBAcmV0dXJucyB7UHJvbWlzZS48RXhwbGFpbkluZm8+fVxuICovXG5SZXBvcnQucHJvdG90eXBlLmV4cGxhaW4gPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICB2YXIgdXJsID0gXCIvcXVlcnkvP2V4cGxhaW49XCIgKyB0aGlzLmlkO1xuICByZXR1cm4gdGhpcy5fY29ubi5yZXF1ZXN0KHVybCkudGhlbkNhbGwoY2FsbGJhY2spO1xufTtcblxuXG4vKipcbiAqIFJ1biByZXBvcnQgc3luY2hyb25vdXNseVxuICpcbiAqIEBtZXRob2QgQW5hbHl0aWNzflJlcG9ydCNleGVjdXRlXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gT3B0aW9uc1xuICogQHBhcmFtIHtCb29sZWFufSBvcHRpb25zLmRldGFpbHMgLSBGbGFnIGlmIGluY2x1ZGUgZGV0YWlsIGluIHJlc3VsdFxuICogQHBhcmFtIHtBbmFseXRpY3N+UmVwb3J0TWV0YWRhdGF9IG9wdGlvbnMubWV0YWRhdGEgLSBPdmVycmlkaW5nIHJlcG9ydCBtZXRhZGF0YVxuICogQHBhcmFtIHtDYWxsYmFjay48QW5hbHl0aWNzflJlcG9ydFJlc3VsdD59IFtjYWxsYmFja10gLSBDYWxsYmFjayBmdW5jdGlvblxuICogQHJldHVybnMge1Byb21pc2UuPEFuYWx5dGljc35SZXBvcnRSZXN1bHQ+fVxuICovXG5SZXBvcnQucHJvdG90eXBlLnJ1biA9XG5SZXBvcnQucHJvdG90eXBlLmV4ZWMgPVxuUmVwb3J0LnByb3RvdHlwZS5leGVjdXRlID0gZnVuY3Rpb24ob3B0aW9ucywgYm9vbGVhbkZpbHRlciwgaWRzLCBmaWx0ZXJDb2x1bW4sIGNhbGxiYWNrKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBpZiAoXy5pc0Z1bmN0aW9uKG9wdGlvbnMpKSB7XG4gICAgY2FsbGJhY2sgPSBvcHRpb25zO1xuICAgIG9wdGlvbnMgPSB7fTtcbiAgfVxuICB2YXIgdXJsID0gWyB0aGlzLl9jb25uLl9iYXNlVXJsKCksIFwiYW5hbHl0aWNzXCIsIFwicmVwb3J0c1wiLCB0aGlzLmlkIF0uam9pbignLycpO1xuICB1cmwgKz0gXCI/aW5jbHVkZURldGFpbHM9XCIgKyAob3B0aW9ucy5kZXRhaWxzID8gXCJ0cnVlXCIgOiBcImZhbHNlXCIpO1xuICB2YXIgcGFyYW1zID0geyBtZXRob2QgOiBvcHRpb25zLm1ldGFkYXRhID8gJ1BPU1QnIDogJ0dFVCcsIHVybCA6IHVybCB9O1xuICBpZiAob3B0aW9ucy5tZXRhZGF0YSkge1xuICAgIHBhcmFtcy5oZWFkZXJzID0geyBcIkNvbnRlbnQtVHlwZVwiIDogXCJhcHBsaWNhdGlvbi9qc29uXCIgfTtcbiAgICBpZiAodHlwZW9mIGJvb2xlYW5GaWx0ZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBwYXJhbXMuYm9keSA9ICd7XCJyZXBvcnRNZXRhZGF0YVwiOiB7XCJyZXBvcnRGaWx0ZXJzXCI6JyArIEpTT04uc3RyaW5naWZ5KG9wdGlvbnMubWV0YWRhdGEpICsgJ319JztcbiAgICB9IGVsc2Uge1xuICAgICAgcGFyYW1zLmJvZHkgPSAne1wicmVwb3J0TWV0YWRhdGFcIjoge1wicmVwb3J0RmlsdGVyc1wiOicgKyBKU09OLnN0cmluZ2lmeShvcHRpb25zLm1ldGFkYXRhKSArIFwiLFxcXCJyZXBvcnRCb29sZWFuRmlsdGVyXFxcIjpcIiArIEpTT04uc3RyaW5naWZ5KGJvb2xlYW5GaWx0ZXIpICsgJ319JztcbiAgICB9XG5cbiAgfVxuICByZXR1cm4gdGhpcy5fY29ubi5yZXF1ZXN0KHBhcmFtcykudGhlbkNhbGwoY2FsbGJhY2spO1xufTtcblxuXG4vKipcbiAqIFJ1biByZXBvcnQgYXN5bmNocm9ub3VzbHlcbiAqXG4gKiBAbWV0aG9kIEFuYWx5dGljc35SZXBvcnQjZXhlY3V0ZUFzeW5jXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gT3B0aW9uc1xuICogQHBhcmFtIHtCb29sZWFufSBvcHRpb25zLmRldGFpbHMgLSBGbGFnIGlmIGluY2x1ZGUgZGV0YWlsIGluIHJlc3VsdFxuICogQHBhcmFtIHtBbmFseXRpY3N+UmVwb3J0TWV0YWRhdGF9IG9wdGlvbnMubWV0YWRhdGEgLSBPdmVycmlkaW5nIHJlcG9ydCBtZXRhZGF0YVxuICogQHBhcmFtIHtDYWxsYmFjay48QW5hbHl0aWNzflJlcG9ydEluc3RhbmNlQXR0cnM+fSBbY2FsbGJhY2tdIC0gQ2FsbGJhY2sgZnVuY3Rpb25cbiAqIEByZXR1cm5zIHtQcm9taXNlLjxBbmFseXRpY3N+UmVwb3J0SW5zdGFuY2VBdHRycz59XG4gKi9cblJlcG9ydC5wcm90b3R5cGUuZXhlY3V0ZUFzeW5jID0gZnVuY3Rpb24ob3B0aW9ucywgY2FsbGJhY2spIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIGlmIChfLmlzRnVuY3Rpb24ob3B0aW9ucykpIHtcbiAgICBjYWxsYmFjayA9IG9wdGlvbnM7XG4gICAgb3B0aW9ucyA9IHt9O1xuICB9XG4gIHZhciB1cmwgPSBbIHRoaXMuX2Nvbm4uX2Jhc2VVcmwoKSwgXCJhbmFseXRpY3NcIiwgXCJyZXBvcnRzXCIsIHRoaXMuaWQsIFwiaW5zdGFuY2VzXCIgXS5qb2luKCcvJyk7XG4gIGlmIChvcHRpb25zLmRldGFpbHMpIHtcbiAgICB1cmwgKz0gXCI/aW5jbHVkZURldGFpbHM9dHJ1ZVwiO1xuICB9XG4gIHZhciBwYXJhbXMgPSB7IG1ldGhvZCA6ICdQT1NUJywgdXJsIDogdXJsLCBib2R5OiBcIlwiIH07XG4gIGlmIChvcHRpb25zLm1ldGFkYXRhKSB7XG4gICAgcGFyYW1zLmhlYWRlcnMgPSB7IFwiQ29udGVudC1UeXBlXCIgOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9O1xuICAgIHBhcmFtcy5ib2R5ID0gSlNPTi5zdHJpbmdpZnkob3B0aW9ucy5tZXRhZGF0YSk7XG4gIH1cbiAgcmV0dXJuIHRoaXMuX2Nvbm4ucmVxdWVzdChwYXJhbXMpLnRoZW5DYWxsKGNhbGxiYWNrKTtcbn07XG5cbi8qKlxuICogR2V0IHJlcG9ydCBpbnN0YW5jZSBmb3Igc3BlY2lmaWVkIGluc3RhbmNlIElEXG4gKlxuICogQG1ldGhvZCBBbmFseXRpY3N+UmVwb3J0I2luc3RhbmNlXG4gKiBAcGFyYW0ge1N0cmluZ30gaWQgLSBSZXBvcnQgaW5zdGFuY2UgSURcbiAqIEByZXR1cm5zIHtBbmFseXRpY3N+UmVwb3J0SW5zdGFuY2V9XG4gKi9cblJlcG9ydC5wcm90b3R5cGUuaW5zdGFuY2UgPSBmdW5jdGlvbihpZCkge1xuICByZXR1cm4gbmV3IFJlcG9ydEluc3RhbmNlKHRoaXMsIGlkKTtcbn07XG5cbi8qKlxuICogTGlzdCByZXBvcnQgaW5zdGFuY2VzIHdoaWNoIGhhZCBiZWVuIGV4ZWN1dGVkIGFzeW5jaHJvbm91c2x5XG4gKlxuICogQG1ldGhvZCBBbmFseXRpY3N+UmVwb3J0I2luc3RhbmNlc1xuICogQHBhcmFtIHtDYWxsYmFjay48QXJyYXkuPEFuYWx5dGljc35SZXBvcnRJbnN0YW5jZUF0dHJzPj59IFtjYWxsYmFja10gLSBDYWxsYmFjayBmdW5jdGlvblxuICogQHJldHVybnMge1Byb21pc2UuPEFycmF5LjxBbmFseXRpY3N+UmVwb3J0SW5zdGFuY2VBdHRycz4+fVxuICovXG5SZXBvcnQucHJvdG90eXBlLmluc3RhbmNlcyA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIHZhciB1cmwgPSBbIHRoaXMuX2Nvbm4uX2Jhc2VVcmwoKSwgXCJhbmFseXRpY3NcIiwgXCJyZXBvcnRzXCIsIHRoaXMuaWQsIFwiaW5zdGFuY2VzXCIgXS5qb2luKCcvJyk7XG4gIHJldHVybiB0aGlzLl9jb25uLnJlcXVlc3QodXJsKS50aGVuQ2FsbChjYWxsYmFjayk7XG59O1xuXG5cbi8qKlxuICogQVBJIGNsYXNzIGZvciBBbmFseXRpY3MgQVBJXG4gKlxuICogQGNsYXNzXG4gKiBAcGFyYW0ge0Nvbm5lY3Rpb259IGNvbm4gQ29ubmVjdGlvblxuICovXG52YXIgQW5hbHl0aWNzID0gZnVuY3Rpb24oY29ubikge1xuICB0aGlzLl9jb25uID0gY29ubjtcbn07XG5cbi8qKlxuICogR2V0IHJlcG9ydCBvYmplY3Qgb2YgQW5hbHl0aWNzIEFQSVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBpZCAtIFJlcG9ydCBJZFxuICogQHJldHVybnMge0FuYWx5dGljc35SZXBvcnR9XG4gKi9cbkFuYWx5dGljcy5wcm90b3R5cGUucmVwb3J0ID0gZnVuY3Rpb24oaWQpIHtcbiAgcmV0dXJuIG5ldyBSZXBvcnQodGhpcy5fY29ubiwgaWQpO1xufTtcblxuLyoqXG4gKiBHZXQgcmVjZW50IHJlcG9ydCBsaXN0XG4gKlxuICogQHBhcmFtIHtDYWxsYmFjay48QXJyYXkuPEFuYWx5dGljc35SZXBvcnRJbmZvPj59IFtjYWxsYmFja10gLSBDYWxsYmFjayBmdW5jdGlvblxuICogQHJldHVybnMge1Byb21pc2UuPEFycmF5LjxBbmFseXRpY3N+UmVwb3J0SW5mbz4+fVxuICovXG5BbmFseXRpY3MucHJvdG90eXBlLnJlcG9ydHMgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICB2YXIgdXJsID0gWyB0aGlzLl9jb25uLl9iYXNlVXJsKCksIFwiYW5hbHl0aWNzXCIsIFwicmVwb3J0c1wiIF0uam9pbignLycpO1xuICByZXR1cm4gdGhpcy5fY29ubi5yZXF1ZXN0KHVybCkudGhlbkNhbGwoY2FsbGJhY2spO1xufTtcblxuXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cbi8qXG4gKiBSZWdpc3RlciBob29rIGluIGNvbm5lY3Rpb24gaW5zdGFudGlhdGlvbiBmb3IgZHluYW1pY2FsbHkgYWRkaW5nIHRoaXMgQVBJIG1vZHVsZSBmZWF0dXJlc1xuICovXG5qc2ZvcmNlLm9uKCdjb25uZWN0aW9uOm5ldycsIGZ1bmN0aW9uKGNvbm4pIHtcbiAgY29ubi5hbmFseXRpY3MgPSBuZXcgQW5hbHl0aWNzKGNvbm4pO1xufSk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBBbmFseXRpY3M7XG4iXX0=
