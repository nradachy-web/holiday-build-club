/* Original PD silhouette, extruded and shaded with ASCII characters. */
(() => {
  'use strict';
  const mask = ['1111100001111100','1100110001100110','1100110001100011','1111100001100011','1100000001100011','1100000001100110','1100000001111100','0000000000000000','0000000000001111'];
  const points = [];
  const occupied = (x,y) => mask[y]?.[x] === '1';
  for (let y=0;y<mask.length;y++) for(let x=0;x<16;x++) if(occupied(x,y)) {
    for(let a=0;a<6;a++) for(let b=0;b<6;b++) for(const z of [-.75,.75]) points.push([x+a/6-8,4.5-y-b/6,z,0,0,Math.sign(z)]);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if(!occupied(x+dx,y+dy)) {
      for(let a=0;a<6;a++) for(let b=0;b<8;b++) points.push([(dx?x+(dx===1?1:0):x+a/6)-8,4.5-(dy?y+(dy===1?1:0):y+a/6),-.75+b*.1875,dx,-dy,0]);
    }
  }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-ascii-logo]').forEach(canvas => {
    const ctx=canvas.getContext('2d'); if(!ctx) return;
    let visible=false,frame=0,phase=0,lastTime=0;
    const cols=108, rows=46;
    const depths=new Float32Array(cols*rows),glyphs=new Uint8Array(cols*rows);
    function draw(angle) {
      const bounds=canvas.getBoundingClientRect(); if(!bounds.width||!bounds.height) return;
      const ratio=Math.min(devicePixelRatio||1,2), w=Math.round(bounds.width*ratio),h=Math.round(bounds.height*ratio);
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      ctx.clearRect(0,0,w,h); depths.fill(-Infinity);glyphs.fill(0);
      const c=Math.cos(angle),s=Math.sin(angle),tx=Math.cos(-.17),ty=Math.sin(-.17);
      for(const [x,y,z,nx,ny,nz] of points){
        const xx=x*c+z*s, zz=-x*s+z*c, yy=y*tx-zz*ty, depth=y*ty+zz*tx;
        const gx=Math.round(cols/2+xx*5.4), gy=Math.round(rows/2-yy*2.8), index=gy*cols+gx;
        if(gx<0||gx>=cols||gy<0||gy>=rows||depth<=depths[index])continue;
        depths[index]=depth;
        const light=Math.max(0,Math.min(.999,.42+(nz*c-nx*s)*.34+ny*.2));
        glyphs[index]=1+Math.floor(light*5);
      }
      const cell=Math.min(w/cols,h/(rows*1.75)), left=(w-cols*cell)/2,top=(h-rows*cell*1.75)/2;
      ctx.font=`${cell*1.64}px monospace`;ctx.textBaseline='top';ctx.fillStyle=getComputedStyle(canvas).color;
      const chars=' .:+*#';
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const g=glyphs[y*cols+x];if(g)ctx.fillText(chars[g],left+x*cell,top+y*cell*1.75);}
      canvas.closest('.ascii-stage')?.classList.add('ascii-ready');
    }
    function tick(time){
      if(!visible||document.hidden||reduce.matches){frame=0;return;}
      if(lastTime) phase+=(time-lastTime)/9000*Math.PI*2;
      lastTime=time;draw(.35+phase);frame=requestAnimationFrame(tick);
    }
    function resume(){
      if(frame)cancelAnimationFrame(frame);frame=0;lastTime=0;
      if(reduce.matches){draw(.35);return;}
      if(visible&&!document.hidden)frame=requestAnimationFrame(tick);
    }
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();},{rootMargin:'60px'}).observe(canvas);
    new ResizeObserver(()=>draw(reduce.matches ? .35 : .35+phase)).observe(canvas);
    document.addEventListener('visibilitychange',resume);reduce.addEventListener('change',resume);draw(.35);
  });
})();
