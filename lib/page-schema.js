'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pageSchemaToReact = exports.PageSchema = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _martingaleUtils = require('martingale-utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var __internalKey = 0;
var generateKey = function generateKey(prefix) {
  var key = __internalKey + 1;
  __internalKey = key;
  return 'ik-' + (prefix ? prefix + '-' : '') + key;
};

var getKey = function getKey(_ref) {
  var key = _ref.key,
      _ref$props = _ref.props,
      props = _ref$props === undefined ? {} : _ref$props;

  if (typeof key !== 'undefined') {
    return key;
  }
  if (typeof props.key !== 'undefined') {
    return props.key;
  }
  return generateKey('getKey');
};

/**
* Workhorse behind layouts, uses internal functions and tricks to create valid React elements from the JSON description.
* @param {object} components - Hash of React Components that are available for use within the layout.
* @param {object} options
* @param {object} options.params - Hash of properties to be passed into the root element.
* @param {object} options.handlers - Hash of handlers to be used to create or mutate elements.
 */

var PageSchema = function () {
  function PageSchema(components) {
    var _Object$getOwnPropert;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { params: {} };

    _classCallCheck(this, PageSchema);

    this.components = components;
    this.handlers = (_Object$getOwnPropert = Object.getOwnPropertyNames(PageSchema.prototype).filter(function (x) {
      return x.charAt(0) === '$';
    })).concat.apply(_Object$getOwnPropert, _toConsumableArray(Object.getOwnPropertyNames(options.handlers || {})));
    this.params = options.params;
  }

  _createClass(PageSchema, [{
    key: 'getHandler',
    value: function getHandler(from) {
      var _this = this;

      if (!from) {
        return false;
      }
      if (from.$type) {
        return this.$component.bind(this);
      }
      return this.handlers.reduce(function (special, key) {
        if (special) {
          return special;
        }
        return from && typeof from[key] !== 'undefined' ? _this[key].bind(_this) : false;
      }, false);
    }
  }, {
    key: 'mapValues',
    value: function mapValues(src, data) {
      var _this2 = this;

      try {
        var handler = this.getHandler(src);
        if (handler !== false) {
          return handler(src, data);
        }

        var type = (0, _martingaleUtils.betterType)(src);
        if (type === 'object') {
          return Object.keys(src).reduce(function (o, key) {
            var n = _extends({}, o, _defineProperty({}, key, _this2.mapValues(src[key], data)));
            return n;
          }, {});
        }

        if (type === 'array') {
          return src.map(function (item) {
            return _this2.mapValues(item, data);
          });
        }

        if (type === 'string') {
          return (0, _martingaleUtils.getObjectValue)(src, data);
        }
        return src;
      } catch (e) {
        console.error('Page Schema Error: ', e);
        console.error('Source: ', src);
        console.error('Data: ', data);
        throw e;
      }
    }
  }, {
    key: 'createPropMap',
    value: function createPropMap(_ref2) {
      var _this3 = this;

      var from = _ref2.from,
          key = _ref2.key;

      var type = (0, _martingaleUtils.betterType)(from);
      if (type === 'undefined') {
        return function () {};
      }
      if (type === 'object') {
        var handler = this.getHandler(from);
        if (handler) {
          return handler(from);
        }
        var objKeysFuncs = Object.keys(from).map(function (key) {
          var f = _this3.createPropMap({ from: from[key], key: key });
          return function (o, props) {
            return Object.assign({}, o, _defineProperty({}, key, f(props)));
          };
        });
        return function (props) {
          return objKeysFuncs.reduce(function (o, f) {
            return f(o, props);
          }, {});
        };
      }
      if (type === 'array') {
        var mapItemFuncs = from.map(function (item, index) {
          return _this3.createPropMap({ from: item, key: index });
        });
        return function (props) {
          return mapItemFuncs.map(function (f) {
            return f(props);
          });
        };
      }
      return function (props) {
        return from;
      };
    }
  }, {
    key: '$raw',
    value: function $raw(src) {
      if (src.$raw) {
        return this.$raw(src.$raw);
      }
      return function () {
        return src;
      };
    }
  }, {
    key: '$map',
    value: function $map(src) {
      var _this4 = this;

      if (src.$map) {
        return this.$map(src.$map);
      }
      return function (props) {
        return _this4.mapValues(src, Object.assign({}, { props: props }, _this4.params));
      };
    }
  }, {
    key: '$mapper',
    value: function $mapper(src) {
      var _this5 = this;

      if (src.$mapper) {
        return this.$mapper(src.$mapper);
      }
      return function () {
        return function (props) {
          return _this5.mapValues(src, Object.assign({}, { props: props }, _this5.params));
        };
      };
    }
  }, {
    key: 'getPropMap',
    value: function getPropMap(rawProps) {
      var _this6 = this;

      var mappedProps = rawProps && Object.keys(rawProps).map(function (key) {
        var value = rawProps[key];
        return {
          key: key,
          map: _this6.createPropMap({ from: value })
        };
      });
      return rawProps ? function (_ref3) {
        var key = _ref3.key,
            props = _objectWithoutProperties(_ref3, ['key']);

        return mappedProps.reduce(function (pl, o) {
          return Object.assign(pl, _defineProperty({}, o.key, o.map(props)));
        }, {});
      } : function () {};
    }
  }, {
    key: '$function',
    value: function $function(src, srcProps, srcChildren) {
      if (src.$function) {
        return this.$function(src.$function, src.props, src.children);
      }
      if (typeof src === 'string') {
        return function () {
          return new Function('', src);
        };
      }
      if ((typeof src === 'undefined' ? 'undefined' : _typeof(src)) === 'object') {
        return function () {
          return new Function(src.args || '', src.source);
        };
      }
    }
  }, {
    key: '$component',
    value: function $component(src, srcProps, srcChildren) {
      var _this7 = this;

      if (src.$component) {
        return this.$component(src.$component, src.props, src.children);
      }
      if (typeof src === 'string') {
        var _Type = this.components[src] || src;
        if (srcProps || srcChildren) {
          return function () {
            var propMap = _this7.getPropMap(srcProps);
            return function (props) {
              return _this7.render({ layout: { $type: src, props: propMap(props), children: srcChildren } });
            };
          };
        }
        return function (props) {
          return _Type;
        };
      }
      var $type = src.$type,
          compChildren = src.children,
          rawProps = src.props;

      var key = getKey(src);
      var propMap = this.getPropMap(rawProps);
      var Type = this.components[$type] || $type;
      var children = compChildren || propMap.children;
      return function (props) {
        var mapped = Object.assign({ children: children }, props, propMap(props));
        if (mapped && mapped.children) {
          return _react2.default.createElement(
            Type,
            _extends({ key: key }, mapped),
            _this7.render({ layout: mapped.children })
          );
        }
        return _react2.default.createElement(Type, _extends({ key: key }, mapped));
      };
    }
  }, {
    key: 'render',
    value: function render(_ref4) {
      var _this8 = this;

      var layout = _ref4.layout,
          _ref4$key = _ref4.key,
          key = _ref4$key === undefined ? generateKey('render') : _ref4$key,
          rest = _objectWithoutProperties(_ref4, ['layout', 'key']);

      if (_react2.default.isValidElement(layout)) {
        return layout;
      }
      if (Array.isArray(layout)) {
        return layout.map(function (layoutItem) {
          return _this8.render({ layout: layoutItem });
        });
      }
      var handler = this.getHandler(layout);
      if (handler) {
        return handler(layout)({ key: key });
      }
      return layout;
    }
  }]);

  return PageSchema;
}();

;

/**
 * Creates an instance of PageSchema and then uses it to generate an actual React element from the layout and components provided.
 * @param {object} options
 * @param {object} options.layout - The JSON layout used to define the output React element.
 * @param {object} options.components - Hash of React Components that are available for use within the layout.
 * @param {object} options.props - Hash of properties to be passed into the root element.
 *
 * @example
 * import React, {Component} from 'react';
 * import ReactDOM from 'react-dom';
 * import PropTypes from 'prop-types';
 * import {pageSchemaToReact} from 'martingale-page-schema';
 *
 * // Some static properties to send
 * const data = {
 *   name: 'Test',
 *   people: [
 *     {name: 'Bob'},
 *     {name: 'Sue'},
 *     {name: 'Phil'},
 *     {name: 'Henry'},
 *   ]
 * };
 *
 * // Some helper objects, just cuz
 * const Greet=({name='World'})=>(<div>Hello {name}!</div>);
 * Greet.propTypes={
 *   name: PropTypes.string
 * };
 * const GreetList=({people=[]})=><div>{people.map((person, index)=><Greet key={index} {...person} />)}</div>;
 *
 * // The actual schema of the page to generate
 * const layout={
 *   $type: 'div',
 *   children: [
 *     {
 *       $type: 'Greet' // Creates "Hello World!"
 *     },
 *     {
 *       $type: 'Greet',
 *       props: {
 *         name: 'Static' // Creates "Hello Static!"
 *       }
 *     },
 *     {
 *       $type: 'Greet',
 *       props: {
 *         name: data.name // Creates "Hello Test!"
 *       }
 *     },
 *     {
 *       $type: 'GreetList',
 *       props: {
 *         people: data.people // Creates a list of Hello's
 *       }
 *     }
 *   ]
 * };
 *
 * // Hash of available components
 * const components={
 *   Greet,
 *   GreetList
 * };
 *
 * class App extends Component {
 *   render() {
 *     return (
 *       {pageSchemaToReact({layout, compoments})}
 *     );
 *   }
 * };
 *
 * ReactDOM.render(
 *   <App />,
 *   document.getElementById('root')
 * );
*/
var pageSchemaToReact = function pageSchemaToReact(_ref5) {
  var layout = _ref5.layout,
      components = _ref5.components,
      props = _ref5.props;

  var render = new PageSchema(components, { params: props });
  return render.render({ layout: layout });
};

exports.PageSchema = PageSchema;
exports.pageSchemaToReact = pageSchemaToReact;