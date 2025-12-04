
(function(){
  const container = document.getElementById('compareInputs');
  const countSelect = document.getElementById('compareCount');
  const status2 = document.getElementById('status2');
  const output = document.getElementById('outputCompare');
  const btnCompare = document.getElementById('btnCompare');
  const btnClear = document.getElementById('btnClear2');

  function setStatus(msg,type){
    if(!msg){status2.innerHTML='';return;}
    const cls=type==='ok'?'ok':type==='error'?'error':'';
    status2.innerHTML=`<span class=\"${cls}\">${msg}</span>`;
  }

  function renderInputs(){
    container.innerHTML='';
    const n=parseInt(countSelect.value,10)||2;
    for(let i=1;i<=n;i++){
      const div=document.createElement('div');
      div.className='panel';
      div.style.background='rgba(15,23,42,0.85)';
      div.style.marginTop='8px';
      const title = i===1 ? '成员 1（完整：日期+星期+时间）' : `成员 ${i}（可只粘贴时间行）`;
      div.innerHTML = `
        <div class=\"panel-header\"><span>${title}</span></div>
        <textarea id=\"cmpInput${i}\" class=\"input-area\" style=\"height:80px;\" placeholder=\"${title}\"></textarea>
        <div class=\"field-line\">
          <input id=\"cmpName${i}\" type=\"text\" placeholder=\"成员 ${i} 名字\">
        </div>
      `;
      container.appendChild(div);
    }
  }
  countSelect.onchange = renderInputs;
  renderInputs();

  btnCompare.onclick = () => {
    try{
      const n=parseInt(countSelect.value,10)||2;
      if(n<2) throw new Error('至少需要 2 个人');
      const raws=[]; const names=[];
      for(let i=1;i<=n;i++){
        const raw=document.getElementById(`cmpInput${i}`).value.trim();
        const name=document.getElementById(`cmpName${i}`).value.trim()||`成员${i}`;
        if(!raw) throw new Error(`请先粘贴成员 ${i} 的排班内容`);
        raws.push(raw); names.push(name);
      }
      const monthHint=null;
      const parsed0 = parseFeishuSchedule(raws[0],monthHint);
      const refEntries = parsed0.entries;
      const maps=[];
      const map0=new Map();
      refEntries.forEach(e=>{ if(e.dayNum!=null) map0.set(e.dayNum,e); });
      maps.push(map0);
      for(let i=1;i<n;i++){
        let entries;
        try{
          entries = parseFeishuSchedule(raws[i],monthHint).entries;
        }catch(e){
          if((e.message||'').includes('未识别到日期行')){
            entries = parseTimesOnly(raws[i],refEntries);
          }else{
            throw new Error(`成员 ${i+1} 解析失败：`+e.message);
          }
        }
        const m=new Map();
        entries.forEach(e=>{ if(e.dayNum!=null) m.set(e.dayNum,e); });
        maps.push(m);
      }
      let commonDays = Array.from(maps[0].keys());
      for(let i=1;i<n;i++){
        const keySet=new Set(maps[i].keys());
        commonDays=commonDays.filter(d=>keySet.has(d));
      }
      commonDays.sort((a,b)=>a-b);
      let allWorkCount=0;
      let sameShiftCount=0;
      const details=[];
      commonDays.forEach(day=>{
        const es=maps.map(m=>m.get(day));
        const allWork=es.every(e=>e && isWorkType(e.typeKey));
        if(allWork) allWorkCount++;
        const first=es[0];
        const same=allWork && es.every(e=>e.typeKey===first.typeKey);
        if(same){
          sameShiftCount++;
          const w=first.weekStr?`（${first.weekStr}）`:'';
          const shiftName=TYPE_NAME[first.typeKey]||'';
          details.push(`${first.dateStr}${w}，${shiftName} ${first.displayShift}`);
        }
      });
      let text=`本次对比人数：${n} 人\n`;
      text+=`所有人都上班的日期：${allWorkCount} 天\n`;
      text+=`所有人同班次上班的日期：${sameShiftCount} 天\n\n`;
      if(details.length){
        text+='同班次日期如下：\n\n'+details.join('\n');
      }else{
        text+='目前没有找到 “所有人同班次上班” 的日期。';
      }
      output.value=text;
      setStatus('对比完成','ok');
    }catch(e){
      output.value='';
      setStatus(e.message||'对比失败','error');
    }
  };

  btnClear.onclick=()=>{
    const n=parseInt(countSelect.value,10)||2;
    for(let i=1;i<=n;i++){
      const t=document.getElementById(`cmpInput${i}`); if(t) t.value='';
      const nEl=document.getElementById(`cmpName${i}`); if(nEl) nEl.value='';
    }
    output.value='';
    setStatus('已清空','ok');
  };
})();
