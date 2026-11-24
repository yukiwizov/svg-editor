import { ShapeProvider } from "../../core/ShapeProvider";
import { Shape, parseNumber } from "../../core/Shape";
import { Rect } from "../../core/Rect";
import { Circle } from "../../core/Circle";
import { Ellipse } from "../../core/Ellipse";
import { Line } from "../../core/Line";
import { TextShape } from "../../core/TextShape";
import { Group } from "../../core/Group";

function numeric(params: string[], index: number, label: string): number | { error: string } {
  const value = parseNumber(params[index]);
  return value === null ? { error: `invalid value for ${label}: ${params[index]}` } : value;
}
function domNumber(attrs: Record<string,string>, name: string): number {
  const value = attrs[name];
  if (value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function presentation(shape: Shape, attrs: Record<string,string>): void {
  if (attrs.stroke !== undefined) shape.setAttribute("stroke", attrs.stroke);
  if (attrs["stroke-width"] !== undefined) shape.setAttribute("stroke-width", attrs["stroke-width"]);
}
function build(name: string, count: number, max: number, usage: string, labels: string[], create: (id:string, p:string[])=>Shape): ShapeProvider {
  return {
    name,
    create(id, params) {
      if (params.length < count || params.length > max) return { error: usage };
      for (let i=0;i<labels.length;i++) {
        const value = numeric(params, i, labels[i]);
        if (typeof value !== "number") return value;
      }
      return create(id, params);
    },
    createFromDom(id, attrs, text) {
      const shape = createFromDomShape(name, id, attrs, text);
      presentation(shape, attrs);
      return shape;
    },
  };
}
function createFromDomShape(name:string,id:string,a:Record<string,string>,t:string|null):Shape {
  if (name==="rect") return new Rect(id,domNumber(a,"x"),domNumber(a,"y"),domNumber(a,"width"),domNumber(a,"height"),a.fill);
  if (name==="circle") return new Circle(id,domNumber(a,"cx"),domNumber(a,"cy"),domNumber(a,"r"),a.fill);
  if (name==="ellipse") return new Ellipse(id,domNumber(a,"cx"),domNumber(a,"cy"),domNumber(a,"rx"),domNumber(a,"ry"),a.fill);
  if (name==="line") return new Line(id,domNumber(a,"x1"),domNumber(a,"y1"),domNumber(a,"x2"),domNumber(a,"y2"),a.stroke);
  if (name==="text") return new TextShape(id,domNumber(a,"x"),domNumber(a,"y"),t??"");
  return new Group(id);
}

export const builtinShapeProviders: ShapeProvider[] = [
  build("rect",4,5,"rect expects 4 or 5 params: <x> <y> <w> <h> [fill]",["rect.x","rect.y","rect.width","rect.height"],(id,p)=>new Rect(id,Number(p[0]),Number(p[1]),Number(p[2]),Number(p[3]),p[4])),
  build("circle",3,4,"circle expects 3 or 4 params: <cx> <cy> <r> [fill]",["circle.cx","circle.cy","circle.r"],(id,p)=>new Circle(id,Number(p[0]),Number(p[1]),Number(p[2]),p[3])),
  build("ellipse",4,5,"ellipse expects 4 or 5 params: <cx> <cy> <rx> <ry> [fill]",["ellipse.cx","ellipse.cy","ellipse.rx","ellipse.ry"],(id,p)=>new Ellipse(id,Number(p[0]),Number(p[1]),Number(p[2]),Number(p[3]),p[4])),
  build("line",4,5,"line expects 4 or 5 params: <x1> <y1> <x2> <y2> [stroke]",["line.x1","line.y1","line.x2","line.y2"],(id,p)=>new Line(id,Number(p[0]),Number(p[1]),Number(p[2]),Number(p[3]),p[4])),
  {
    name:"text",
    create(id,p) {
      if (p.length!==3) return {error:'text expects 3 params: <x> <y> "<content>"'};
      const x=numeric(p,0,"text.x"); if(typeof x!=="number") return x;
      const y=numeric(p,1,"text.y"); if(typeof y!=="number") return y;
      return new TextShape(id,x,y,p[2]);
    },
    createFromDom(id,a,t) { const s=new TextShape(id,domNumber(a,"x"),domNumber(a,"y"),t??""); presentation(s,a); return s; },
  },
  {
    name:"g",
    create(id,p) { return p.length ? {error:"g takes no params"} : new Group(id); },
    createFromDom(id) { return new Group(id); },
  },
];
