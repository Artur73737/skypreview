import { useEffect, useRef, useState } from "react";
import { raDecToAltAz } from "../../services/astroMath";
import { vecFromAltAz, type ViewBasis } from "../../services/viewProjection";
import type { HipsBackground } from "../../hooks/useHipsBackground/useHipsBackground";

const vertex = `attribute vec2 position; varying vec2 screen; void main(){ screen=position; gl_Position=vec4(position,0.,1.); }`;
const fragment = `precision highp float;
varying vec2 screen;
uniform vec3 forward, right, up, eqX, eqY, eqZ;
uniform float aspect, tangent, patchTangent, hasPatch;
uniform vec3 patchCenter, patchEast, patchNorth;
uniform sampler2D patch;
const float PI=3.141592653589793;
void main(){
 vec3 world=normalize(forward+tangent*(screen.x*aspect*right+screen.y*up));
 vec3 eq=vec3(dot(world,eqX),dot(world,eqY),dot(world,eqZ));
 float ra=atan(eq.y,eq.x); if(ra<0.) ra+=2.*PI;
 float dec=asin(clamp(eq.z,-1.,1.));
 vec4 color=vec4(2./255.,4./255.,9./255.,1.);
 float z=dot(eq,patchCenter);
 if(hasPatch>.5 && z>0.){
  vec2 uv=vec2(.5-dot(eq,patchEast)/(2.*z*patchTangent),.5+dot(eq,patchNorth)/(2.*z*patchTangent));
  if(uv.x>=0. && uv.x<=1. && uv.y>=0. && uv.y<=1.) color=texture2D(patch,uv);
 }
 gl_FragColor=vec4(color.rgb,1.);
}`;

interface Props { basis: ViewBasis; fov: number; width: number; height: number; lat: number; lon: number; date: Date; hips: HipsBackground }
export function SurveyBackground(props: Props) {
 const ref=useRef<HTMLCanvasElement>(null);
 const renderer=useRef<{gl: WebGLRenderingContext; program: WebGLProgram; patch: WebGLTexture; image: HTMLImageElement | null} | null>(null);
 const [error,setError]=useState(false);
 useEffect(()=>{
  const gl=ref.current?.getContext("webgl",{alpha:false,antialias:false});
  if(!gl){setError(true);return;}
  const compile=(type:number,source:string)=>{const shader=gl.createShader(type)!;gl.shaderSource(shader,source);gl.compileShader(shader);return shader;};
  const program=gl.createProgram()!;
  const vs=compile(gl.VERTEX_SHADER,vertex), fs=compile(gl.FRAGMENT_SHADER,fragment);
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){setError(true);return;}
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const location=gl.getAttribLocation(program,"position");gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);
  const patch=gl.createTexture()!; gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,patch); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([2,4,9,255]));
  gl.uniform1i(gl.getUniformLocation(program,"patch"),1);
  renderer.current={gl,program,patch,image:null};
  return()=>{gl.deleteTexture(patch);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);renderer.current=null;};
 },[]);
 useEffect(()=>{
  const r=renderer.current;if(!r)return;
  const {gl,program}=r, {basis,fov,width,height,lat,lon,date,hips}=props;
  gl.viewport(0,0,width,height);gl.useProgram(program);
  const v=(name:string,value:number[])=>gl.uniform3fv(gl.getUniformLocation(program,name),value);
  const f=(name:string,value:number)=>gl.uniform1f(gl.getUniformLocation(program,name),value);
  v("forward",basis.forward);v("right",basis.right);v("up",basis.up);
  for(const [name,ra,dec] of [["eqX",0,0],["eqY",6,0],["eqZ",0,90]] as const){const a=raDecToAltAz(ra,dec,lat,lon,date);v(name,vecFromAltAz(a.altDeg,a.azDeg));}
  f("aspect",width/height);f("tangent",Math.tan(fov*Math.PI/360));f("hasPatch",hips.img?1:0);
  const ra=hips.raDeg*Math.PI/180,dec=hips.decDeg*Math.PI/180;
  v("patchCenter",[Math.cos(dec)*Math.cos(ra),Math.cos(dec)*Math.sin(ra),Math.sin(dec)]);
  v("patchEast",[-Math.sin(ra),Math.cos(ra),0]);v("patchNorth",[-Math.sin(dec)*Math.cos(ra),-Math.sin(dec)*Math.sin(ra),Math.cos(dec)]);
  f("patchTangent",Math.tan(hips.fovDeg*Math.PI/360));
  if(hips.img && hips.img!==r.image){gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,r.patch);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,hips.img);r.image=hips.img;}
  gl.drawArrays(gl.TRIANGLES,0,6);
 },[props]);
 return <><canvas aria-label="Fotografia del cielo DSS2" ref={ref} width={props.width} height={props.height} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}/>{error && <div className="hd-loading" role="alert">Sfondo fotografico non disponibile: verifica WebGL.</div>}</>;
}
