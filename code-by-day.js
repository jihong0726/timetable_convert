
(function(){
  const inputDates = document.getElementById('inputDates4');
  const inputNames = document.getElementById('inputNames4');
  const inputCodes = document.getElementById('inputCodes4');
  const daySelect  = document.getElementById('daySelect4');
  const codeSelect = document.getElementById('codeSelect4');
  const btnParse   = document.getElementById('btnParse4');
  const btnClear   = document.getElementById('btnClear4');
  const btnQuery   = document.getElementById('btnQuery4');
  const status4    = document.getElementById('status4');
  const output     = document.getElementById('outputText4');

  let sheet = null;

  function setStatus(msg,type){
    if(!msg){status4.innerHTML='';return;}
    const cls=type==='ok'?'ok':type==='error'?'error':'';
    status4.innerHTML=`<span class=\"${cls}\">${msg}</span>`;
  }

  btnParse.onclick = () => {
    try{
      sheet = parseThreeZoneSchedule(inputDates.value, inputNames.value, inputCodes.value);
      daySelect.innerHTML='<option value="">请选择日期</option>';
      sheet.days.forEach(d=>{
        const opt=document.createElement('option');
        opt.value=d.day;
        opt.textContent=d.label;
        daySelect.appendChild(opt);
      });
      codeSelect.innerHTML='<option value="">请选择代码 / 班次</option>';
      output.value='';
      setStatus('解析成功，请选择日期与代码','ok');
    }catch(e){
      sheet=null;
      daySelect.innerHTML='<option value="">请选择日期</option>';
      codeSelect.innerHTML='<option value="">请选择代码 / 班次</option>';
      output.value='';
      setStatus(e.message||'解析失败','error');
    }
  };

  daySelect.onchange = () => {
    if(!sheet){return;}
    const day = parseInt(daySelect.value,10);
    if(!day){ codeSelect.innerHTML='<option value="">请选择代码 / 班次</option>'; return; }
    const set = new Set();
    sheet.staffRows.forEach(r=>{
      const v = (r.codes[day]||'').trim();
      if(!v) return;
      if(!isCodeOrShiftToken(v)) return;
      set.add(v);
    });
    const list = Array.from(set).sort();
    codeSelect.innerHTML='<option value="">请选择代码 / 班次</option>';
    list.forEach(c=>{
      const opt=document.createElement('option');
      opt.value=c;
      opt.textContent=c;
      codeSelect.appendChild(opt);
    });
  };

  btnQuery.onclick = () => {
    try{
      if(!sheet) throw new Error('请先解析表格');
      const day = parseInt(daySelect.value,10);
      const code=(codeSelect.value||'').trim();
      if(!day) throw new Error('请选择日期');
      if(!code) throw new Error('请选择代码 / 班次');
      const names=[];
      sheet.staffRows.forEach(r=>{
        const v=(r.codes[day]||'').trim();
        if(v.toUpperCase()===code.toUpperCase()) names.push(r.name);
      });
      const label = sheet.dayToLabel[day] || `本月第${day}天`;
      let text = `${label} 代码 ${code} 对应人员（共 ${names.length} 人）：\n`;
      if(!names.length){
        text += '\n当前日期没有该代码。';
      }else{
        names.forEach(n=>{ text += `\n- ${n}`; });
      }
      output.value=text;
      setStatus('查询完成','ok');
    }catch(e){
      output.value='';
      setStatus(e.message||'查询失败','error');
    }
  };

  btnClear.onclick = () => {
    inputDates.value='';
    inputNames.value='';
    inputCodes.value='';
    daySelect.innerHTML='<option value="">请选择日期</option>';
    codeSelect.innerHTML='<option value="">请选择代码 / 班次</option>';
    output.value='';
    sheet=null;
    setStatus('已清空','ok');
  };
})();
