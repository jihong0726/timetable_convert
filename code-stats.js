
(function(){
  const inputDates = document.getElementById('inputDates5');
  const inputNames = document.getElementById('inputNames5');
  const inputCodes = document.getElementById('inputCodes5');
  const codeInput  = document.getElementById('codeInput5');
  const btnClear   = document.getElementById('btnClear5');
  const btnStats   = document.getElementById('btnStats5');
  const status5    = document.getElementById('status5');
  const output     = document.getElementById('outputText5');

  let sheet = null;

  function setStatus(msg,type){
    if(!msg){status5.innerHTML='';return;}
    const cls=type==='ok'?'ok':type==='error'?'error':'';
    status5.innerHTML=`<span class=\"${cls}\">${msg}</span>`;
  }

  btnStats.onclick = () => {
    try{
      sheet = parseThreeZoneSchedule(inputDates.value, inputNames.value, inputCodes.value);
      const code = (codeInput.value.trim()||'MC').toUpperCase();
      const countMap = new Map();
      sheet.staffRows.forEach(r=>{
        let cnt=0;
        sheet.days.forEach(d=>{
          const v=(r.codes[d.day]||'').trim().toUpperCase();
          if(v===code) cnt++;
        });
        if(cnt>0) countMap.set(r.name,cnt);
      });
      const list=Array.from(countMap.entries()).sort((a,b)=>{
        if(b[1]!==a[1]) return b[1]-a[1];
        return a[0].localeCompare(b[0]);
      });
      let total=0;
      list.forEach(([_,c])=>{total+=c;});
      let text=`整个月代码 ${code} 统计：\n\n`;
      text+=`共有 ${list.length} 人出现过该代码，总次数 ${total} 次。\n\n`;
      if(!list.length){
        text+='当前表格中未找到该代码。';
      }else{
        list.forEach(([name,c])=>{
          text+=`- ${name}：${code} ${c} 次\n`;
        });
      }
      output.value=text;
      setStatus('统计完成','ok');
    }catch(e){
      output.value='';
      setStatus(e.message||'统计失败','error');
    }
  };

  btnClear.onclick = () => {
    inputDates.value='';
    inputNames.value='';
    inputCodes.value='';
    codeInput.value='';
    output.value='';
    sheet=null;
    setStatus('已清空','ok');
  };
})();
