import React from 'react';
import {
  betterType,
  getObjectValue
} from 'martingale-utils';

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
  }

  createPropMap(from){
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
        const f = this.createPropMap(from[key]);
        return (o, props)=>{
          return Object.assign({}, o, {[key]: f(props)});
        };
      });
      return (props)=>objKeysFuncs.reduce((o, f)=>f(o, props), {});
    }
    if(type === 'array'){
      const mapItemFuncs = from.map((item)=>this.createPropMap(item));
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
      return this.mapValues(src, {props, params: this.params});
    }
  }

  $mapper(src){
    if(src.$mapper){
      return this.$mapper(src.$mapper);
    }
    return ()=> (props)=>this.mapValues(src, {props, params: this.params});
  }

  $component(src){
    if(src.$component){
      return this.$component(src.$component);
    }
    if(typeof(src)==='string'){
      const Type = this.components[src] || src;
      return (props)=>Type;
    }
    const {
      $type,
      children: compChildren,
      props: rawProps
    } = src;
    const mappedProps = rawProps && Object.keys(rawProps).map((key)=>{
      const value = rawProps[key];
      return {
        key,
        map: this.createPropMap(value)
      };
    });
    const propMap = rawProps?(props)=>{
      return mappedProps.reduce((pl, o)=>{
        return Object.assign(pl, {
          [o.key]: o.map(props)
        });
      }, {});
    }:()=>{};
    const Type = this.components[$type] || $type;
    const children = compChildren || propMap.children;
    return (props)=>{
      const mapped = Object.assign({children}, props, propMap(props));
      if(mapped && mapped.children){
        return <Type {...mapped}>{this.render({layout: mapped.children, props: mapped})}</Type>;
      }
      return <Type {...mapped} />;
    };
  }

  render({layout, key}){
    if(React.isValidElement(layout)){
      return layout;
    }
    if(Array.isArray(layout)){
      return layout.map((layout, key)=>this.render({layout, key}));
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
