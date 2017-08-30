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

const pageSchemaToReact = ({layout, components, props})=>{
  const render = new PageSchema(components, {params: props});
  return render.render({layout});
};

export {
  PageSchema,
  pageSchemaToReact
};
