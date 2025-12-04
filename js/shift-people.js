
(function(){
  const input = document.getElementById('inputShift3');
  const dateLabelInput = document.getElementById('dateLabel3');
  const btnClear = document.getElementById('btnClear3');
  const btnParse = document.getElementById('btnParse3');
  const status3 = document.getElementById('status3');
  const output = document.getElementById('outputText3');
  const stats3 = document.getElementById('stats3');

  function setStatus(msg,type){
    if(!msg){status3.innerHTML='';return;}
    const cls=type==='ok'?'ok':type==='error'?'error':'';
    status3.innerHTML=`<span class=\"${cls}\">${msg}</span>`;
  }

  btnParse.onclick = () => {
    try{
      const raw = input.value;
      const parts = raw.split(/\r?\n\s*\r?\n/); // 用空行分割姓名区 & 班次区
      if(parts.length<2) throw new Error('请使用“姓名 + 空行 + 直列班次”的结构');
      const nameLines = parts[0].split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
      const names = nameLines.filter(l=>isNameLine(l));
      if(!names.length) throw new Error('未识别到有效姓名，请确认姓名为中英混合');
      const shiftLines = parts[1].split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
      if(shiftLines.length < names.length) throw new Error('直列班次数量少于姓名数量，请检查顺序是否一一对应');

      const stats={zaozao:0,bai:0,zhong:0,wan:0,wanwan:0,ye:0,nianjia:0,rest:0,chuqin:0};
      const groups={ZAOZAO:[],BAI:[],ZHONG:[],WAN:[],WANWAN:[],YE:[],NIANJIA:[],REST:[]};

      for(let i=0;i<names.length;i++){
        const name=names[i];
        const rawShift=shiftLines[i] || '';
        const typeKey=classifyShift(rawShift,stats);
        if(!typeKey) continue;
        groups[typeKey].push({name,rawShift});
      }
      stats.chuqin = stats.zaozao+stats.bai+stats.zhong+stats.wan+stats.wanwan+stats.ye;

      const order=['ZAOZAO','BAI','ZHONG','WAN','WANWAN','YE','NIANJIA','REST'];
      const out=[];
      const header = dateLabelInput.value.trim() || '本日';
      out.push(`${header} 各班次人员`);
      out.push('');
      order.forEach(key=>{
        const arr=groups[key];
        if(!arr || !arr.length) return;
        const label=TYPE_NAME[key]||key;
        let title=label;
        if(['ZAOZAO','BAI','ZHONG','WAN','WANWAN','YE'].includes(key)){
          const first=arr[0].rawShift;
          title += ' ' + formatShift(first);
        }
        out.push(`${title}（共 ${arr.length} 人）：`);
        arr.forEach(item=>{ out.push(`- ${item.name}`); });
        out.push('');
      });
      output.value = out.join('\n');
      stats3.innerHTML =
        `早早：${stats.zaozao}　白：${stats.bai}　中：${stats.zhong}　晚：${stats.wan}　晚晚：${stats.wanwan}　夜：${stats.ye}<br>`+
        `年假：${stats.nianjia}　休息：${stats.rest}　出勤：${stats.chuqin}`;
      setStatus('解析完成','ok');
    }catch(e){
      output.value='';
      stats3.innerHTML='';
      setStatus(e.message||'解析失败','error');
    }
  };

  btnClear.onclick = () => {
    input.value='';
    dateLabelInput.value='';
    output.value='';
    stats3.innerHTML='';
    setStatus('已清空','ok');
  };
})();
