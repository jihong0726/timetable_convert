
// 公共工具函数
const pad = n => (n < 10 ? "0" + n : "" + n);

// 中英混合姓名识别
function isNameLine(line) {
  const s = line.trim();
  if (!s) return false;
  const clean = s.replace(/^[-•·\s]+/, "");
  if (/^\d{1,2}:\d{2}$/.test(clean)) return false;
  if (/^\d+(\.\d+)?$/.test(clean)) return false;
  if (/^\d/.test(clean)) return false;
  if (/OFF|REST|AL|MC|UPL|PCU|PH|MT|PL|ML|CL|HOSP|AWOL|GL/i.test(clean)) return false;
  const hasHan = /[\u4e00-\u9fff]/.test(clean);
  const hasLat = /[A-Za-z]/.test(clean);
  return hasHan && hasLat;
}

const TYPE_NAME = {
  ZAOZAO: "早早班",
  BAI: "白班",
  ZHONG: "中班",
  WAN: "晚班",
  WANWAN: "晚晚班",
  YE: "夜班",
  NIANJIA: "年假",
  REST: "休息"
};
function isWorkType(key) {
  return ["ZAOZAO","BAI","ZHONG","WAN","WANWAN","YE"].includes(key);
}

// 班次分类 + 统计
function classifyShift(rawShift, stats) {
  const s = rawShift.trim().toUpperCase();
  if (!s) return null;
  if (s === "AL") {
    stats.nianjia++; return "NIANJIA";
  }
  if (s === "OFF" || s === "REST") {
    stats.rest++; return "REST";
  }
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m) {
    const h = parseInt(m[1],10);
    const mm = parseInt(m[2],10);
    if (mm === 0) {
      if (h === 8)  { stats.zaozao++; return "ZAOZAO"; }
      if (h === 9)  { stats.bai++;    return "BAI";    }
      if (h === 12) { stats.zhong++;  return "ZHONG";  }
      if (h === 15) { stats.wan++;    return "WAN";    }
      if (h === 16) { stats.wanwan++; return "WANWAN"; }
      if (h === 0 || h === 24) { stats.ye++; return "YE"; }
    }
  }
  return null;
}

// 把 9:00 -> 09:00 - 18:00
function formatShift(rawShift) {
  const s = rawShift.trim();
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return s;
  const startHour = parseInt(m[1],10);
  const minute    = parseInt(m[2],10);
  const added     = startHour + 9;
  const endHour24 = added % 24;
  const displayEndHour = (added >= 24 && endHour24 === 0) ? 24 : endHour24;
  return `${pad(startHour)}:${pad(minute)} - ${pad(displayEndHour)}:${pad(minute)}`;
}

// 解析单人：飞书三行（日期+星期+时间）
function parseFeishuSchedule(raw, monthHint) {
  const lines = raw.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  if (!lines.length) throw new Error("请先粘贴排班内容");
  const rows = lines.map(l=>l.split(/\s+/).filter(Boolean));
  const dateRe = /(\d{1,2})\s*月\s*(\d{1,2})\s*日/;
  let startCol = null;
  rows.forEach(r=>{
    r.forEach((c,i)=>{
      if(dateRe.test(c)){
        if (startCol===null || i<startCol) startCol=i;
      }
    });
  });
  if (startCol===null) throw new Error("未识别到日期行（例如 12月1日）");

  const colCount = Math.max(...rows.map(r=>r.length));
  const dates = new Array(colCount).fill("");
  const weeks = new Array(colCount).fill("");
  const days  = new Array(colCount).fill(null);

  rows.forEach(r=>{
    for(let i=startCol;i<r.length;i++){
      const c=r[i];
      const dm=c.match(dateRe);
      if(dm){
        dates[i]=c;
        const dNum=parseInt(dm[2],10);
        if(!isNaN(dNum)) days[i]=dNum;
      }
      if(/星期[一二三四五六日天]/.test(c)) weeks[i]=c;
    }
  });

  const lastRow = rows[rows.length-1];
  const stats={zaozao:0,bai:0,zhong:0,wan:0,wanwan:0,ye:0,nianjia:0,rest:0,chuqin:0};
  const entries=[];
  const events=[];
  for(let i=startCol;i<lastRow.length;i++){
    const rawShift=(lastRow[i]||"").trim();
    if(!rawShift) continue;
    const typeKey=classifyShift(rawShift,stats);
    let dateStr=dates[i];
    let dayNum=days[i];
    if(!dateStr){
      const dayIndex=i-startCol+1;
      if(monthHint){
        dateStr=`${monthHint}月${dayIndex}日`;
        dayNum=dayIndex;
      }else{
        dateStr=`第${dayIndex}天`;
      }
    }
    const weekStr=weeks[i]||"";
    const displayShift=formatShift(rawShift);
    entries.push({dateStr,weekStr,dayNum,rawShift,typeKey,displayShift});
    const timeMatch=rawShift.match(/^(\d{1,2}):(\d{2})$/);
    if(timeMatch && typeKey && ["ZAOZAO","BAI","ZHONG","WAN","WANWAN","YE"].includes(typeKey) && monthHint && dayNum){
      const startHour=parseInt(timeMatch[1],10);
      const startMinute=parseInt(timeMatch[2],10);
      const added=startHour+9;
      const endHour24=added%24;
      const endHour=(added>=24 && endHour24===0)?24:endHour24;
      const endMinute=startMinute;
      events.push({day:dayNum,startHour,startMinute,endHour,endMinute,typeKey});
    }
  }
  stats.chuqin = stats.zaozao+stats.bai+stats.zhong+stats.wan+stats.wanwan+stats.ye;
  return {entries,stats,events};
}

// 仅时间行（用于对比 B / C 成员）
function parseTimesOnly(raw, refEntries){
  const lines=raw.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  if(!lines.length) throw new Error("排班内容为空");
  const lastLine=lines[lines.length-1];
  const tokens=lastLine.split(/\s+/).filter(Boolean);
  if(!tokens.length) throw new Error("时间行为空");
  const entries=[];
  for(let i=0;i<refEntries.length && i<tokens.length;i++){
    const ref=refEntries[i];
    const rawShift=tokens[i].trim();
    if(!rawShift) continue;
    const dummyStats={zaozao:0,bai:0,zhong:0,wan:0,wanwan:0,ye:0,nianjia:0,rest:0,chuqin:0};
    const typeKey=classifyShift(rawShift,dummyStats);
    const displayShift=formatShift(rawShift);
    entries.push({
      dateStr:ref.dateStr,
      weekStr:ref.weekStr,
      dayNum:ref.dayNum,
      rawShift,
      typeKey,
      displayShift
    });
  }
  return entries;
}

// 构建 ICS
function buildICS(events, year, month, name) {
  const now=new Date();
  const dtstamp = now.getFullYear()+pad(now.getMonth()+1)+pad(now.getDate())+
                  "T"+pad(now.getHours())+pad(now.getMinutes())+pad(now.getSeconds());
  const lines=[];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//ScheduleTool//CN");

  events.forEach((e,idx)=>{
    const y=parseInt(year,10);
    const m=parseInt(month,10);
    const d=e.day;
    const dtstart=`${y}${pad(m)}${pad(d)}T${pad(e.startHour)}${pad(e.startMinute)}00`;
    const endHour=e.endHour===24?23:e.endHour;
    const endMinute=e.endHour===24?59:e.endMinute;
    const dtend=`${y}${pad(m)}${pad(d)}T${pad(endHour)}${pad(endMinute)}00`;
    const label=TYPE_NAME[e.typeKey]||"上班";
    const summary=label;
    const uid=`${y}${pad(m)}${pad(d)}-${pad(e.startHour)}${pad(e.startMinute)}-${idx}@schedule.local`;
    lines.push("BEGIN:VEVENT");
    lines.push("UID:"+uid);
    lines.push("DTSTAMP:"+dtstamp);
    lines.push("DTSTART:"+dtstart);
    lines.push("DTEND:"+dtend);
    lines.push("SUMMARY:"+summary);
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

// 三区结构解析：日期+星期 / 姓名 / 时间&代码
function parseThreeZoneSchedule(datesWeeksText, namesText, codesText) {
  const dateLines = datesWeeksText.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  if (dateLines.length < 1) throw new Error("请在【日期 + 星期区域】粘贴至少一行内容");
  const dateRow = dateLines[0].split(/\s+/).filter(Boolean);
  if (!dateRow.length) throw new Error("未识别到日期内容");
  const weekRow = dateLines.length >= 2 ? dateLines[1].split(/\s+/).filter(Boolean) : [];
  const nDays = dateRow.length;

  function parseDayNum(token, index) {
    const m = token.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
    if (m) return parseInt(m[2],10);
    const m2 = token.match(/(\d{1,2})\s*日/);
    if (m2) return parseInt(m2[1],10);
    return index+1;
  }

  const days=[];
  const dayToLabel={};
  for(let i=0;i<nDays;i++){
    const tok=dateRow[i];
    const dayNum=parseDayNum(tok,i);
    const weekStr = weekRow[i] || "";
    const label = weekStr ? `${tok}（${weekStr}）` : tok;
    days.push({index:i, day:dayNum, label});
    dayToLabel[dayNum]=label;
  }

  const nameLines = namesText.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const names = nameLines.filter(l=>isNameLine(l));
  if(!names.length) throw new Error("未识别到有效姓名，请确认姓名为中英混合（如：Joyi Xiang 项梦梦）");

  const codeLines = codesText.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  if (!codeLines.length) throw new Error("请在【时间 / 代码区域】粘贴内容，每行对应一个姓名的整个月数据");

  const staffRows=[];
  for(let i=0;i<names.length;i++){
    const rowLine = codeLines[i] || "";
    const tokens = rowLine.split(/\s+/).filter(Boolean);
    const codes = {};
    for(let j=0;j<Math.min(tokens.length,nDays);j++){
      const v = tokens[j].trim();
      if (!v) continue;
      const d = days[j].day;
      codes[d] = v;
    }
    staffRows.push({name:names[i], codes});
  }

  return { days, dayToLabel, staffRows };
}

// 用于“代码/班次”选择过滤：不能是日期
const CODE_WHITELIST = new Set([
  "TRAINING","SUPPORT","BUDDY","PRACTICAL",
  "AL","M-AL-1H","M-AL-2H","A-AL-1H","A-AL-2H",
  "N-AL-1H","N-AL-2H","MN-AL-1H","MN-AL-2H",
  "MC","M-MC-1H","M-MC-2H","A-MC-1H","A-MC-2H",
  "N-MC-1H","N-MC-2H","MN-MC-1H","MN-MC-2H",
  "UPL","M-UPL-1H","M-UPL-2H","A-UPL-1H","A-UPL-2H",
  "N-UPL-1H","N-UPL-2H","MN-UPL-1H","MN-UPL-2H",
  "PCU","M-PCU-1H","M-PCU-2H","A-PCU-1H","A-PCU-2H",
  "N-PCU-1H","N-PCU-2H","MN-PCU-1H","MN-PCU-2H",
  "PH","MT","PL","ML","CL","HOSP",
  "AWOL","M-AWOL-1H","M-AWOL-2H","A-AWOL-1H","A-AWOL-2H",
  "N-AWOL-1H","N-AWOL-2H","MN-AWOL-1H","MN-AWOL-2H",
  "GL","M-GL-1H","M-GL-2H","A-GL-1H","A-GL-2H",
  "N-GL-1H","N-GL-2H","MN-GL-1H","MN-GL-2H",
  "RESIGN","OFF","REST"
]);

function isTimeToken(s){
  return /^\d{1,2}:\d{2}(\s*-\s*\d{1,2}:\d{2})?$/.test(s);
}
function isCodeOrShiftToken(s){
  const t=s.trim();
  if(!t) return false;
  if(t.includes("月") || t.includes("日")) return false;
  if(isTimeToken(t)) return true;
  if(CODE_WHITELIST.has(t.toUpperCase())) return true;
  return false;
}
