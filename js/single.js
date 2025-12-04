
(function(){
  const inputRaw1 = document.getElementById('inputRaw1');
  const outputText1 = document.getElementById('outputText1');
  const titleInput1 = document.getElementById('titleInput1');
  const yearSelect1 = document.getElementById('yearSelect1');
  const monthSelect1 = document.getElementById('monthSelect1');
  const status1 = document.getElementById('status1');
  const stats1 = document.getElementById('stats1');
  const btnParse1 = document.getElementById('btnParse1');
  const btnCopy1 = document.getElementById('btnCopy1');
  const btnClear1 = document.getElementById('btnClear1');
  const btnDownloadTxt1 = document.getElementById('btnDownloadTxt1');
  const btnDownloadICS1 = document.getElementById('btnDownloadICS1');
  let lastEvents1 = [];

  function setStatus(msg,type){
    if(!msg){status1.innerHTML='';return;}
    const cls = type==='ok'?'ok':type==='error'?'error':'';
    status1.innerHTML = `<span class=\"${cls}\">${msg}</span>`;
  }

  (function initYM(){
    const now=new Date();
    const y=now.getFullYear();
    const m=now.getMonth()+1;
    for(let i=y-1;i<=y+3;i++){
      const o=document.createElement('option');
      o.value=i;o.textContent=i+'年';
      if(i===y) o.selected=true;
      yearSelect1.appendChild(o);
    }
    for(let i=1;i<=12;i++){
      const o=document.createElement('option');
      o.value=i;o.textContent=i+'月';
      if(i===m) o.selected=true;
      monthSelect1.appendChild(o);
    }
  })();

  function updateStatsBox(stats){
    stats1.innerHTML =
      `早早：${stats.zaozao}　白：${stats.bai}　中：${stats.zhong}　晚：${stats.wan}　晚晚：${stats.wanwan}　夜：${stats.ye}<br>`+
      `年假：${stats.nianjia}　休息：${stats.rest}　出勤：${stats.chuqin}`;
  }

  btnParse1.onclick = () => {
    try{
      const month = parseInt(monthSelect1.value,10) || null;
      const {entries,stats,events} = parseFeishuSchedule(inputRaw1.value, month);
      lastEvents1 = events;
      const name = titleInput1.value.trim() || '我的';
      const title = `${name}的 ${yearSelect1.value} 年 ${monthSelect1.value} 月时间表`;
      const lines = entries.map(e=>{
        const w = e.weekStr ? `（${e.weekStr}）` : '';
        return `${e.dateStr}${w}：${e.displayShift}`;
      });
      outputText1.value = title + "\n" + lines.join("\n");
      updateStatsBox(stats);
      setStatus('已生成时间表', 'ok');
    }catch(e){
      lastEvents1 = [];
      stats1.innerHTML='';
      setStatus(e.message||'解析失败','error');
    }
  };

  btnCopy1.onclick = async () => {
    try{
      await navigator.clipboard.writeText(outputText1.value);
      setStatus('已复制到剪贴板','ok');
    }catch{
      setStatus('复制失败，请手动复制','error');
    }
  };

  btnDownloadTxt1.onclick = () => {
    const txt = outputText1.value.trim();
    if(!txt){ setStatus('没有可下载内容','error'); return; }
    const name = (titleInput1.value.trim() || 'schedule').replace(/[\\/:*?\"<>|]/g,'_');
    const file = `${name}_${yearSelect1.value}-${pad(parseInt(monthSelect1.value,10))}_班表.txt`;
    const blob = new Blob([txt],{type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url;a.download=file;
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus('已下载 TXT','ok');
  };

  btnDownloadICS1.onclick = () => {
    if(!lastEvents1.length){ setStatus('没有可导出的班次（请先生成）','error'); return; }
    const ics = buildICS(lastEvents1, yearSelect1.value, monthSelect1.value, titleInput1.value.trim()||'我的');
    const name = (titleInput1.value.trim() || 'schedule').replace(/[\\/:*?\"<>|]/g,'_');
    const file = `${name}_${yearSelect1.value}-${pad(parseInt(monthSelect1.value,10))}_班表.ics`;
    const blob = new Blob([ics],{type:'text/calendar;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url;a.download=file;
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus('已导出日历文件','ok');
  };

  btnClear1.onclick = () => {
    inputRaw1.value='';
    outputText1.value='';
    stats1.innerHTML='';
    lastEvents1=[];
    setStatus('已清空','ok');
  };
})();
