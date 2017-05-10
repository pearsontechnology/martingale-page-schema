'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pageSchemaToReact = exports.PageSchema = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _martingaleUtils = require('martingale-utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
    }
  }, {
    key: 'createPropMap',
    value: function createPropMap(from) {
      var _this3 = this;

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
          var f = _this3.createPropMap(from[key]);
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
        var mapItemFuncs = from.map(function (item) {
          return _this3.createPropMap(item);
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
        return _this4.mapValues(src, { props: props, params: _this4.params });
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
          return _this5.mapValues(src, { props: props, params: _this5.params });
        };
      };
    }
  }, {
    key: '$component',
    value: function $component(src) {
      var _this6 = this;

      if (src.$component) {
        return this.$component(src.$component);
      }
      if (typeof src === 'string') {
        var _Type = this.components[src] || src;
        return function (props) {
          return _Type;
        };
      }
      var $type = src.$type,
          compChildren = src.children,
          rawProps = src.props;

      var mappedProps = rawProps && Object.keys(rawProps).map(function (key) {
        var value = rawProps[key];
        return {
          key: key,
          map: _this6.createPropMap(value)
        };
      });
      var propMap = rawProps ? function (props) {
        return mappedProps.reduce(function (pl, o) {
          return Object.assign(pl, _defineProperty({}, o.key, o.map(props)));
        }, {});
      } : function () {};
      var Type = this.components[$type] || $type;
      var children = compChildren || propMap.children;
      return function (props) {
        var mapped = Object.assign({ children: children }, props, propMap(props));
        if (mapped && mapped.children) {
          return _react2.default.createElement(
            Type,
            mapped,
            _this6.render({ layout: mapped.children, props: mapped })
          );
        }
        return _react2.default.createElement(Type, mapped);
      };
    }
  }, {
    key: 'render',
    value: function render(_ref) {
      var _this7 = this;

      var layout = _ref.layout,
          key = _ref.key;

      if (_react2.default.isValidElement(layout)) {
        return layout;
      }
      if (Array.isArray(layout)) {
        return layout.map(function (layout, key) {
          return _this7.render({ layout: layout, key: key });
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

var pageSchemaToReact = function pageSchemaToReact(_ref2) {
  var layout = _ref2.layout,
      components = _ref2.components,
      props = _ref2.props;

  var render = new PageSchema(components, { params: props });
  return render.render({ layout: layout });
};

exports.PageSchema = PageSchema;
exports.pageSchemaToReact = pageSchemaToReact;