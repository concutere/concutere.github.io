(function() {//TODO encapsulate ...
  var svgNS = "http://www.w3.org/2000/svg";
  var gf; 
  /* keeping these around in case canvas rendering becomes relevant again ...
  var cvs;// = document.getElementById('canvas');
  var ctx;// = cvs.getContext('2d'); //
  */
  var svg = document.getElementById('svg');
  var gPath = document.getElementById('gPath');
  var gCtls = document.getElementById('gCtls');
  var h = 0;
  var w = 0;
  var fontSize = 72;

  opentype.load('fonts/Roboto-Black.ttf', function (err, font) {
      if (err) {
           alert('Font could not be loaded: ' + err);
      } else {
          gf=font;

          // Construct a Path object containing the letter shapes of the given text.
          // The other parameters are x, y and fontSize.
          // Note that y is the position of the baseline.

          // is this too late to be pulling these? (dont think so but not 100%)
          h = svg.height.baseVal.value;
          w = svg.width.baseVal.value;
          var path = font.getPath('Enter text', 25, h/2 + fontSize/2, fontSize);
          // If you just want to draw the text you can also use font.draw(ctx, text, x, y, fontSize).
          path.fill='crimson';
          path.drawSVG(gPath);
      }
  });

  var text="";
  var chars=[];
  var cPaths=[]; //TODO use for animating transition from user's statement text into set of letters
  var showpath;
  var showCtls = true;

  document.addEventListener('keydown',handleCmd);
  function handleCmd(e) {
    if (e.keyCode === 8) {
      e.preventDefault();
      //DELETE CHAR
      chars.pop();
      if (text.length > 1) text = text.substr(0,text.length-1);
      drawTypedText();
      return false;
    }
    else if (e.keyCode === 27) {
      showCtls = !showCtls;
      reshowCtls();
    }
    else if (e.keyCode === 46) {
      if(selIds.length > 0)
      delSel();
    }
  }

  document.addEventListener('keypress',update);
  function update(e) {
    if (text=="") {
      clearPath();
    }
    else if (e.keyCode == 13) { //enter key
      setKeys(text);
      return;
    }

    var c = String.fromCharCode(e.keyCode);
    if (([' ', '\n', '\t']).indexOf(c) < 0 && chars.indexOf(c) < 0) {
      chars.push(c);
      /*var path=gf.getPath(c, 25,100,72);
      path.fill='crimson';
      cPaths.push(path);*/
    }
    text+=c;
    drawTypedText();
  }

  function drawTypedText() {
    var path = gf.getPath(text,25,h/2 + fontSize/4,fontSize/2);
    path.fill='crimson';
    clearPath();
    path.drawSVG(gPath);
  }

  function clear() {
    ctx.clearRect(0,0,cvs.width, cvs.height);
  }

  function clearPath() {
    clearsvg(gPath);
  }
  function clearCtls() {
    clearsvg(gCtls);
  }
  
  function clearsvg(svg) {
    while(svg.lastChild) {
      svg.removeChild(svg.lastChild);
    }
  }

  var tranx = 0;
  function setKeys(text,skipCtls) {
    document.removeEventListener('keypress',update);
    
    clearPath();
    
    var ffsize = fontSize * 1.2;
    var path = gf.getPath(chars.join(''),25,h/2 + ffsize/2,ffsize);
    path.fill='crimson';
    var pel = path.drawSVG(gPath);
    var bb = pel.getBBox();
    var pw = bb.width;

    tranx = w/2 - (pw + bb.x)/2;
    var tran=svg.createSVGTransform();
    tran.setTranslate(tranx, 0);
    gPath.transform.baseVal.appendItem(tran);
    var tran=svg.createSVGTransform();
    tran.setTranslate(tranx, 0);
    gCtls.transform.baseVal.appendItem(tran);

    showpath=path;
    //setup edit els
    if(!skipCtls) {
      clearCtls();
      drawCtls(path.commands);
    }

    gPath.addEventListener('dblclick',editPathColor);

    svg.addEventListener('dblclick',function(e) {if(e.target.constructor.name=="SVGSVGElement") { showCtls = !showCtls; reshowCtls(); }});
    svg.addEventListener('mousedown',dragFrom);
    svg.addEventListener('mouseup',dragTo);
  }

  function editPathColor(e) {
    if (e.target.getAttribute('fill')=='crimson') {
      e.target.setAttribute('fill', 'forestgreen');
    }
    else {
      e.target.setAttribute('fill', 'crimson');
    }
  }

  function reshowCtls() {
    //actually just toggles visibility ...
    var ctls = document.getElementsByClassName('ctl');
    for(var i=0; i <ctls.length; i++) {
      var ctl = ctls[i];
      ctl.style.visibility = showCtls ? 'visible' : 'hidden';
    }
  }

  function drawCtls(cmds) {
    //console.log('drawCtls # ' + cmds.length)
    for (var i = 0; i < cmds.length; i++) {
      var cmd = cmds[i];
      switch(cmd.type) {
        case 'M':
        case 'L':
          drawCtl(i,cmd, cmd.x, cmd.y);
          break;
        case 'Q':
          drawCtl(i,cmd, cmd.x, cmd.y);
          drawCtl(i+.1, cmd, cmd.x1, cmd.y1);
          break;
        case 'Z': //close 
          break;
        default: //just in case
          console.log(cmd);
          break;
      }
    }
  }
  
  function drawCtl(id,cmd, x, y) {
    var isCtlPt = parseFloat(id) != Math.floor(id);
    var i = parseInt(Math.floor(id));
    var el = document.createElementNS(svgNS, "circle");
    el.id='ctl'+id;
    el.r.baseVal.value=isCtlPt ? 3.5 : 4;
    el.cx.baseVal.value = x;
    el.cy.baseVal.value = y;
    el.setAttribute('class','ctl');
    el.setAttribute(isCtlPt ? 'stroke' : 'fill','azure');
    if (isCtlPt) {
      el.setAttribute('fill','transparent');
      el.setAttribute('stroke-opacity', '0.5');
    }
    else {
      el.setAttribute('fill-opacity', '0.5');
    }

    gCtls.appendChild(el);
    el.addEventListener('mousedown',mousedown);
    el.addEventListener('mouseup',mouseup); 
    el.addEventListener('dblclick',delEl);
    return el;
  }
  
  function delSel() {
    //console.log('delSel')
    for (var i = 0; i < selCtls.length; i++) {
      var cmd = selCtls[i].cmd;
      var cid = showpath.commands.indexOf(cmd);
      if (cid > -1) {
        showpath.commands.splice(cid,1);
      }
      selCtls[i].el.parentElement.removeChild(selCtls[i].el);
    }
      clearPath();
      clearCtls();
      showpath.drawSVG(gPath);
      drawCtls(showpath.commands);
  }
  function delEl(e) {
    var id = e.target.id.substr(3);
    if (!isNaN(id) && id > -1) {
      if(isSelId(id)) {
        delSel();
      }
      else {
        var i = parseInt(Math.floor(id));
        var cmd = showpath.commands[i];
        showpath.commands.splice(i,1);
      clearPath();
      clearCtls();
      showpath.drawSVG(gPath);
      drawCtls(showpath.commands);
      }

    }
  }
  
  //TODO encapsulate ...
  var downpos=[0,0];
  var lastpos=[0,0];
  var dragel=undefined;
  function mousedown(e) {
    //console.log('mousedown')
    e.stopPropagation();
    lastpos=downpos=[e.x,e.y];
    document.removeEventListener('mousemove',dragOver);
    document.addEventListener('mousemove',mousemove);
    dragel=e.target;
    return false;
  }
  
  function mousemove(e) {
    //console.log('mousemove')
    if (!dragel) return;
    shiftPos(e.x,e.y,dragel);
    //TODO live-update change to seg (need to find the right seg, should be able to use ctl#)
  }
  
  function shiftPos(x,y,target) {
    if (!target || !target.cx) {
      console.log('wtf');
      return;
    }
    else {
      var newpos=[x,y];
      var diff=[newpos[0]-lastpos[0], newpos[1]-lastpos[1]];
      lastpos=newpos;     
      var cid = target.id.substr(3);
      //console.log ('shiftPos cid='+cid +' - ' + selIds.join(','))
      if (isSelId(cid)) {
        //console.log('cid in selIds')
        var done = [];
        for (var i = 0; i < selCtls.length; i++) {
          if (selCtls[i].cmd in done) continue;
          var ctl = selCtls[i].el;
          ctl.cx.baseVal.value += diff[0];
          ctl.cy.baseVal.value += diff[1];
          /*if(selCtls[i].cmd.x1) {
            selCtls[i].cmd.x1 += diff[0];
            selCtls[i].cmd.y1 += diff[1];
          }
          selCtls[i].cmd.x += diff[0];
          selCtls[i].cmd.y += diff[1];*/
          done.push(selCtls[i].cmd);
        }
      }
      else {
        target.cx.baseVal.value += diff[0];
        target.cy.baseVal.value += diff[1];        
      }
    }
  }
  
  function mouseup(e) {
    //console.log('mouseup')
    if (!dragel) return;
    document.removeEventListener('mousemove',mousemove);
    shiftPos(e.x,e.y,dragel);
    //var type = dragel.id.substr(0,1);
    var id=dragel.id.substr(3);

    if (isSelId(id)) {
      for (var i = 0; i < selCtls.length; i++) {
        var use1=selCtls[i].el.id.indexOf('.1') > 0;
        selCtls[i].el.setAttribute(use1 ? 'stroke' : 'fill', 'azure');
        if (use1) {
          selCtls[i].cmd.x1 = selCtls[i].el.cx.baseVal.value;
          selCtls[i].cmd.y1 = selCtls[i].el.cy.baseVal.value;
        }
        else {
          selCtls[i].cmd.x = selCtls[i].el.cx.baseVal.value;
          selCtls[i].cmd.y = selCtls[i].el.cy.baseVal.value;
        }
      }
    }
    else {
      var ii = parseInt(Math.floor(id));
      if (parseFloat(id) != Math.floor(id)) {
        showpath.commands[ii].x1 = dragel.cx.baseVal.value;
        showpath.commands[ii].y1 = dragel.cy.baseVal.value;
      }
      else {
        showpath.commands[ii].x = dragel.cx.baseVal.value;
        showpath.commands[ii].y = dragel.cy.baseVal.value;
      }
    }
    selCtls=[];
    selIds=[];

    dragel=undefined;   
    clearPath();
    showpath.drawSVG(gPath);
  }

  ////////////////////////////////

  var seldragging = false;
  var dfpos;
  var rel = document.getElementById('selection');
  function dragFrom(e) {

    if(seldragging || (e.target && e.target.tagName && !(e.target.tagName == 'svg' || e.target.tagName == 'g'))) return;
    //console.log('dragFrom')

    seldragging = true;  
    dfpos = {x: e.x, y: e.y};
    rel.setAttribute('class','show');
    updateSel(e);
    document.removeEventListener('mousemove',mousemove); //necessary?
    document.addEventListener('mousemove',dragOver); 
      //console.log('dragFrom2')
      return false;
  }

  function dragOver(e) {
    //console.log('dragOver');
    if(!seldragging) {
      return;
    }
    updateSel(e);
  }

  function dragTo(e) {
    //console.log('dragTo')
    if (!seldragging) return;

    document.removeEventListener('mousemove',dragOver);
    // updateSel(e); //why? hiding it next step ... (debugging .........)
    rel.setAttribute('class','hide')

    updateSelCtls(e);

    dfpos = undefined;
    seldragging = false;
  }

  var setCtls=[];
  var selIds=[];
  function updateSelCtls(e) {
    if (!dfpos) return;
    var x = dfpos.x > e.x ? e.x : dfpos.x;
    var y = dfpos.y > e.y ? e.y : dfpos.y;
    var w = Math.abs(e.x - dfpos.x);
    var h = Math.abs(e.y - dfpos.y);
    var x2 = x + w;
    var y2 = y + h;

    selCtls=[];
    selIds=[];
    for (var i =0; i < showpath.commands.length; i++) {
      var cmd = showpath.commands[i];
      if(cmd.x + tranx > x && cmd.x + tranx < x2 && cmd.y > y && cmd.y < y2) {
        var el = document.getElementById('ctl'+i);
        if (el) {
          el.setAttribute('fill','limegreen');
          selCtls.push({x:cmd.x, y:cmd.y, el:el, cmd:cmd});
          selIds.push(i);
        }
      }
      if(!isNaN(cmd.x1) && !isNaN(cmd.y1) && cmd.x1 + tranx > x && cmd.x1 + tranx < x2 && cmd.y1 > y && cmd.y1 < y2) {
        var el = document.getElementById('ctl'+i+'.1');
        if (el) {
          el.setAttribute('stroke','limegreen');
          selCtls.push({x:cmd.x1, y:cmd.y1, el:el, cmd:cmd});
          selIds.push(i+'.1');
        }
      }
    }

  }

  function updateSel(e) {
    //console.log('updateSel')
    if (!dfpos) return;

    var x = dfpos.x > e.x ? e.x : dfpos.x;
    var y = dfpos.y > e.y ? e.y : dfpos.y;
    var w = Math.abs(e.x - dfpos.x);
    var h = Math.abs(e.y - dfpos.y);

//console.log(x+','+y+','+w+','+h)
    //draw
    rel.setAttribute('x',x);
    rel.setAttribute('y',y);
    rel.setAttribute('width',w);
    rel.setAttribute('height',h);

  }

  function isSelId(cid) {
    //love that weak typing ...
    var found = false;
    var pos=-1;
    for (var i=0; i<selIds.length;i++) {
      if(selIds[i].toString() == cid.toString()) {
        found=true;
        pos = i;
        break;
      }
    }
    //console.log('isSelId? '+ found + '\t' + pos + '\t' + cid + '\t' + selIds)
    return found;
  }
})();