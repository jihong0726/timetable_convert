// js/code-stats.js
// 功能 5：整月代码统计（按人汇总）

(function () {
  const datesInput = document.getElementById('codeStatsDatesInput');
  const namesInput = document.getElementById('codeStatsNamesInput');
  const codesInput = document.getElementById('codeStatsCodesInput');
  const targetInput = document.getElementById('codeStatsTargetInput');

  const btnRun = document.getElementById('btnCodeStatsRun');
  const btnClear = document.getElementById('btnCodeStatsClear');

  const statusEl = document.getElementById('codeStatsStatus');
  const summaryEl = document.getElementById('codeStatsSummary');
  const listEl = document.getElementById('codeStatsList');

  function normalizeLine(line) {
    return line.replace(/\s+/g, ' ').trim();
  }

  function parseLines(text) {
    return text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);
  }

  function countCode() {
    const target = targetInput.value.trim();

    if (!target) {
      statusEl.textContent = '请先输入要统计的代码，例如 MC / AL / OFF。';
      summaryEl.textContent = '';
      listEl.textContent = '';
      return;
    }

    const nameLines = parseLines(namesInput.value);
    const codeLines = parseLines(codesInput.value);

    if (nameLines.length === 0 || codeLines.length === 0) {
      statusEl.textContent = '未识别到有效的姓名行或代码行，请确认已粘贴完整的【姓名列表】和【每日代码/班次】。';
      summaryEl.textContent = '';
      listEl.textContent = '';
      return;
    }

    if (codeLines.length < nameLines.length) {
      statusEl.textContent =
        `注意：代码行数量（${codeLines.length}）少于姓名行数量（${nameLines.length}），` +
        '将按较少的一方进行匹配。';
    } else if (codeLines.length > nameLines.length) {
      statusEl.textContent =
        `注意：代码行数量（${codeLines.length}）多于姓名行数量（${nameLines.length}），` +
        '多出来的行会被忽略。';
    } else {
      statusEl.textContent = '解析成功：姓名与代码行数量一致，可以正常统计。';
    }

    const pairs = [];
    const rowCount = Math.min(nameLines.length, codeLines.length);

    for (let i = 0; i < rowCount; i++) {
      const name = normalizeLine(nameLines[i]);
      if (!name) continue;

      const codesRow = normalizeLine(codeLines[i]);
      if (!codesRow) continue;

      const tokens = codesRow.split(' ');
      let count = 0;
      tokens.forEach(t => {
        if (t === target) count += 1;
      });

      pairs.push({ name, count });
    }

    // 统计 & 过滤
    const withCode = pairs.filter(p => p.count > 0);

    let totalCount = 0;
    withCode.forEach(p => {
      totalCount += p.count;
    });

    // 从大到小排序
    withCode.sort((a, b) => b.count - a.count);

    // 写 summary
    if (withCode.length === 0) {
      summaryEl.textContent =
        `统计代码：${target}\n` +
        '在当前整月数据中，没有找到任何匹配该代码的记录。';
      listEl.textContent = '（没有人使用这个代码）';
      return;
    }

    summaryEl.textContent =
      `统计代码：${target}\n` +
      `涉及人数：${withCode.length} 人\n` +
      `总出现次数：${totalCount} 次\n` +
      '说明：同一天出现多次会全部计入，例如 1 天内 2 个 MC 算 2 次。';

    // 写详细列表
    const lines = withCode.map((p, idx) => {
      return `${idx + 1}. ${p.name} - ${p.count} 次`;
    });

    listEl.textContent = lines.join('\n');
  }

  function clearAll() {
    datesInput.value = '';
    namesInput.value = '';
    codesInput.value = '';
    targetInput.value = 'MC';
    statusEl.textContent = '已清空输入内容。请先粘贴三块数据，再输入要统计的代码（如 MC / AL / OFF），点击「统计代码次数」。';
    summaryEl.textContent = '';
    listEl.textContent = '';
  }

  if (btnRun) {
    btnRun.addEventListener('click', countCode);
  }

  if (btnClear) {
    btnClear.addEventListener('click', clearAll);
  }
})();
