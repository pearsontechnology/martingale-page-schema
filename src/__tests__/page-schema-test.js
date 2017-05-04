// page-schema-test.js
import React from 'react';
import {pageSchemaToReact} from '../';
import PropTypes from 'prop-types';
import renderer from 'react-test-renderer';

const Greet=({name='World'})=>(<div>Hello {name}!</div>);
Greet.propTypes={
  name: PropTypes.string
};
const GreetList=({people=[]})=><div>{people.map((person, index)=><Greet key={index} {...person} />)}</div>;

const data = {
  name: 'Test',
  people: [
    {name: 'Bob'},
    {name: 'Sue'},
    {name: 'Phil'},
    {name: 'Henry'},
  ]
};

const layout={
  type: 'div',
  children: [
    {
      type: 'Greet'
    },
    {
      type: 'Greet',
      props: {
        name: 'Static'
      }
    },
    {
      type: 'Greet',
      props: {
        name: data.name
      }
    },
    {
      type: 'Greet',
      props: data
    },
    {
      type: 'GreetList',
      props: data
    }
  ]
};

const components={
  Greet,
  GreetList
};

test('pageSchemaToReact', () => {
  const component = renderer.create(
    pageSchemaToReact({layout, components})
  );
  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
