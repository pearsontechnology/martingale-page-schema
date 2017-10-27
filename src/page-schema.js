import React from 'react';
import {
  betterType,
  getObjectValue
} from 'martingale-utils';

let __internalKey = 0;
const generateKey = (prefix)=>{
  const key = __internalKey+1;
  __internalKey=key;
  return `ik-${prefix?prefix+'-':''}${key}`;
};

const getKey = ({key, props = {}})=>{
  if(typeof(key)!=='undefined'){
    return key;
  }
  if(typeof(props.key)!=='undefined'){
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
class PageSchema{
  constructor(components, options = {params: {}}){
    this.components = components;
    this.handlers = Object.getOwnPropertyNames(PageSchema.prototype)
      .filter(x => x.charAt(0) === '$')
      .concat(...Object.getOwnPropertyNames(options.handlers || {}));
    this.params = options.params;
  }

  getHandler(from){
    if(!from){
      return false;
    }
    if(from.$type){
      return this.$component.bind(this);
    }
    return this.handlers.reduce((special, key)=>{
      if(special){
        return special;
      }
      return from && typeof(from[key])!=='undefined'?this[key].bind(this):false;
    }, false);
  }

  mapValues(src, data){
    try{
      const handler = this.getHandler(src);
      if(handler !== false){
        return handler(src, data);
      }

      const type = betterType(src);
      if(type === 'object'){
        return Object.keys(src).reduce((o, key)=>{
          const n = {...o, [key]: this.mapValues(src[key], data)};
          return n;
        }, {});
      }

      if(type === 'array'){
        return src.map((item)=>this.mapValues(item, data));
      }

      if(type === 'string'){
        return getObjectValue(src, data);
      }
      return src;
    }catch(e){
      console.error('Page Schema Error: ', e);
      console.error('Source: ', src);
      console.error('Data: ', data);
      throw e;
    }
  }

  createPropMap({from, key}){
    const type = betterType(from);
    if(type === 'undefined'){
      return ()=>{};
    }
    if(type === 'object'){
      const handler = this.getHandler(from);
      if(handler){
        return handler(from);
      }
      const objKeysFuncs = Object.keys(from).map((key)=>{
        const f = this.createPropMap({from: from[key], key});
        return (o, props)=>{
          return Object.assign({}, o, {[key]: f(props)});
        };
      });
      return (props)=>objKeysFuncs.reduce((o, f)=>f(o, props), {});
    }
    if(type === 'array'){
      const mapItemFuncs = from.map((item, index)=>this.createPropMap({from: item, key: index}));
      return (props)=>mapItemFuncs.map(f=>f(props));
    }
    return (props)=>from;
  }

  $raw(src){
    if(src.$raw){
      return this.$raw(src.$raw);
    }
    return ()=>src;
  }

  $map(src){
    if(src.$map){
      return this.$map(src.$map);
    }
    return (props)=>{
      return this.mapValues(src, Object.assign({}, {props}, this.params));
    }
  }

  $mapper(src){
    if(src.$mapper){
      return this.$mapper(src.$mapper);
    }
    return ()=> (props)=>this.mapValues(src, Object.assign({}, {props}, this.params));
  }

  getPropMap(rawProps){
    const mappedProps = rawProps && Object.keys(rawProps).map((key)=>{
      const value = rawProps[key];
      return {
        key,
        map: this.createPropMap({from: value})
      };
    });
    return rawProps?({key, ...props})=>{
      return mappedProps.reduce((pl, o)=>{
        return Object.assign(pl, {
          [o.key]: o.map(props)
        });
      }, {});
    }:()=>{};
  }

  $function(src, srcProps, srcChildren){
    if(src.$function){
      return this.$function(src.$function, src.props, src.children);
    }
    if(typeof(src)==='string'){
      return ()=> {
        return new Function('', src);
      };
    }
    if(typeof(src)==='object'){
      return ()=>{
        return new Function(src.args || '', src.source);
      }
    }
  }

  $component(src, srcProps, srcChildren){
    if(src.$component){
      return this.$component(src.$component, src.props, src.children);
    }
    if(typeof(src)==='string'){
      const Type = this.components[src] || src;
      if(srcProps || srcChildren){
        return ()=>{
          const propMap = this.getPropMap(srcProps);
          return (props)=>{
            return this.render({layout: {$type: src, props: propMap(props), children: srcChildren}});
          };
        };
      }
      return (props)=>Type;
    }
    const {
      $type,
      children: compChildren,
      props: rawProps
    } = src;
    const key = getKey(src);
    const propMap = this.getPropMap(rawProps);
    const Type = this.components[$type] || $type;
    const children = compChildren || propMap.children;
    return (props)=>{
      const mapped = Object.assign({children}, props, propMap(props));
      if(mapped && mapped.children){
        return <Type key={key} {...mapped}>{this.render({layout: mapped.children})}</Type>;
      }
      return <Type key={key} {...mapped} />;
    };
  }

  render({layout, key = generateKey('render'), ...rest}){
    if(React.isValidElement(layout)){
      return layout;
    }
    if(Array.isArray(layout)){
      return layout.map((layoutItem)=>{
        return this.render({layout: layoutItem});
      });
    }
    const handler = this.getHandler(layout);
    if(handler){
      return handler(layout)({key});
    }
    return layout;
  }
};

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
const pageSchemaToReact = ({layout, components, props})=>{
  const render = new PageSchema(components, {params: props});
  return render.render({layout});
};

export {
  PageSchema,
  pageSchemaToReact
};
