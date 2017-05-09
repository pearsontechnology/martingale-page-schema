'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; // page-schema-test.js


var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _ = require('../');

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _reactTestRenderer = require('react-test-renderer');

var _reactTestRenderer2 = _interopRequireDefault(_reactTestRenderer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Greet = function Greet(_ref) {
  var _ref$name = _ref.name,
      name = _ref$name === undefined ? 'World' : _ref$name;
  return _react2.default.createElement(
    'div',
    null,
    'Hello ',
    name,
    '!'
  );
};
Greet.propTypes = {
  name: _propTypes2.default.string
};
var GreetList = function GreetList(_ref2) {
  var _ref2$people = _ref2.people,
      people = _ref2$people === undefined ? [] : _ref2$people;
  return _react2.default.createElement(
    'div',
    null,
    people.map(function (person, index) {
      return _react2.default.createElement(Greet, _extends({ key: index }, person));
    })
  );
};

var data = {
  name: 'Test',
  people: [{ name: 'Bob' }, { name: 'Sue' }, { name: 'Phil' }, { name: 'Henry' }]
};

var layout = {
  $type: 'div',
  children: [{
    $type: 'Greet'
  }, {
    $type: 'Greet',
    props: {
      name: 'Static'
    }
  }, {
    $type: 'Greet',
    props: {
      name: data.name
    }
  }, {
    $type: 'Greet',
    props: data
  }, {
    $type: 'GreetList',
    props: data
  }]
};

var components = {
  Greet: Greet,
  GreetList: GreetList
};

test('pageSchemaToReact', function () {
  var component = _reactTestRenderer2.default.create((0, _.pageSchemaToReact)({ layout: layout, components: components }));
  var tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});