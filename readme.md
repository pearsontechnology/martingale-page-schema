# Martingale page-schema

Martingale Page Schema takes a simple JSON object and transforms it into React elements that can then be displayed within the UI. It does this by traversing the JSON object and outputting compoments from a component map.

## Install

Available once we opensource everything

```sh
yarn add martingale-page-schema
```

## Running tests

```
yarn test
```

## Creating a build

```
yarn compile
```

# Helpers

## pageSchemaToReact({layout, components})

Creates an instance of PageSchema and then uses it to generate an actual React element from the layout and components provided.

# Components

## PageSchema

Workhorse behind layouts, uses internal functions and tricks to create valid React elements from the JSON description.

### Methods

#### constructor(components)

Creates an instance of PageSchema and binds it to the hash of components provided.

#### render(layout)

Generates valid react elements from the layout provided.

## Example

```js
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {pageSchemaToReact} from 'martingale-page-schema';

// Some static properties to send
const data = {
  name: 'Test',
  people: [
    {name: 'Bob'},
    {name: 'Sue'},
    {name: 'Phil'},
    {name: 'Henry'},
  ]
};

// Some helper objects, just cuz
const Greet=({name='World'})=>(<div>Hello {name}!</div>);
Greet.propTypes={
  name: PropTypes.string
};
const GreetList=({people=[]})=><div>{people.map((person, index)=><Greet key={index} {...person} />)}</div>;

// The actual schema of the page to generate
const layout={
  type: 'div',
  children: [
    {
      type: 'Greet' // Creates "Hello World!"
    },
    {
      type: 'Greet',
      props: {
        name: 'Static' // Creates "Hello Static!"
      }
    },
    {
      type: 'Greet',
      props: {
        name: data.name // Creates "Hello Test!"
      }
    },
    {
      type: 'GreetList',
      props: {
        people: data.people // Creates a list of Hello's
      }
    }
  ]
};

// Hash of available components
const components={
  Greet,
  GreetList
};

class App extends Component {
  render() {
    return (
      {pageSchemaToReact({layout, compoments})}
    );
  }
};

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
```
