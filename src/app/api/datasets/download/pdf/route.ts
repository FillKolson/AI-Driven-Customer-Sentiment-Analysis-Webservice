import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../../supabase/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Ensure Node.js runtime for this route
export const runtime = 'nodejs';

// Helper: generate a PDF buffer with pdf-lib
async function generatePdfBuffer(
  title: string,
  summary: { total: number; positive: number; negative: number; neutral: number },
  rows: Array<{
    created_at: string;
    input_text: string;
    sentiment: string;
    confidence: number;
    key_phrases: string[];
  }>,
  fileName?: string
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait in points
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 40;
  const width = page.getWidth() - margin * 2;
  let cursorY = page.getHeight() - margin;

  const drawText = (text: string, x: number, y: number, options?: { size?: number; color?: any; font?: any }) => {
    page.drawText(text, {
      x,
      y,
      size: options?.size ?? 10,
      color: options?.color ?? rgb(0, 0, 0),
      font: options?.font ?? fontRegular,
    });
  };

  // Per requirement: only include graph images in the PDF (no text sections)

  // Charts section (QuickChart images)
  // Helper to fetch chart image as PNG bytes from QuickChart
  const fetchChartPng = async (config: any, w = 700, h = 350): Promise<Uint8Array | null> => {
    try {
      const url = `https://quickchart.io/chart?format=png&width=${w}&height=${h}&backgroundColor=white&c=${encodeURIComponent(JSON.stringify(config))}&plugins=chartjs-plugin-datalabels`;
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const ab = await resp.arrayBuffer();
      return new Uint8Array(ab);
    } catch {
      return null;
    }
  };
  // Helper aggregations from available fields
  const sentiments = rows.map(r => r.sentiment);
  const confidences = rows.filter(r => typeof r.confidence === 'number').map(r => Math.round((r.confidence || 0) * 100));
  const procTimes = rows.filter(r => (r as any).processing_time_ms != null).map(r => (r as any).processing_time_ms as number);
  const tokens = rows.filter(r => (r as any).tokens_used != null).map(r => (r as any).tokens_used as number);
  const byDay = new Map<string, number>();
  for (const r of rows) {
    const d = new Date(r.created_at);
    const key = d.toISOString().split('T')[0];
    byDay.set(key, (byDay.get(key) || 0) + 1);
  }
  const dayLabels = Array.from(byDay.keys()).sort();
  const dayCounts = dayLabels.map(k => byDay.get(k) || 0);

  // Key phrase frequency top 10
  const phraseCounts = new Map<string, number>();
  for (const r of rows) {
    for (const p of r.key_phrases || []) {
      const key = String(p).trim();
      if (!key) continue;
      phraseCounts.set(key, (phraseCounts.get(key) || 0) + 1);
    }
  }
  const topPhrases = Array.from(phraseCounts.entries()).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const phraseLabels = topPhrases.map(([k])=>k);
  const phraseValues = topPhrases.map(([,v])=>v);

  // Simple histogram binning utility
  const histogram = (arr: number[], bins = 10): { labels: string[]; counts: number[] } => {
    if (arr.length === 0) return { labels: [], counts: [] };
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const width = (max - min) / bins || 1;
    const counts = new Array(bins).fill(0);
    for (const v of arr) {
      let idx = Math.floor((v - min) / width);
      if (idx >= bins) idx = bins - 1;
      if (idx < 0) idx = 0;
      counts[idx]++;
    }
    const labels = counts.map((_, i) => {
      const start = Math.round(min + i * width);
      const end = Math.round(min + (i + 1) * width);
      return `${start}-${end}`;
    });
    return { labels, counts };
  };

  const confHist = histogram(confidences, 10);
  const timeHist = histogram(procTimes, 10);
  const tokenHist = histogram(tokens, 10);

  // Build additional charts to reach 15
  const additionalCharts: Array<{ config: any; title: string; caption: string; width?: number; height?: number }> = [];

  // 3) Sentiment over time (monthly, stacked)
  const monthMap: Record<string, { pos: number; neg: number; neu: number }> = {};
  for (const r of rows) {
    const d = new Date(r.created_at);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[m] ||= { pos: 0, neg: 0, neu: 0 };
    if (r.sentiment === 'positive') monthMap[m].pos++;
    else if (r.sentiment === 'negative') monthMap[m].neg++;
    else monthMap[m].neu++;
  }
  const months = Object.keys(monthMap).sort();
  additionalCharts.push({
    title: 'Monthly Sentiment Breakdown',
    caption: `Figure 3: Monthly Sentiment Breakdown — Dataset: ${fileName || title}`,
    config: {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          { label: 'Positive', data: months.map(m=>monthMap[m].pos), backgroundColor: '#22c55e' },
          { label: 'Neutral', data: months.map(m=>monthMap[m].neu), backgroundColor: '#9ca3af' },
          { label: 'Negative', data: months.map(m=>monthMap[m].neg), backgroundColor: '#ef4444' },
        ]
      },
      options: {
        layout: { padding: 12 },
        plugins: { title: { display: true, text: 'Monthly Sentiment Breakdown' }, legend: { position: 'bottom' } },
        scales: { x: { title: { display: true, text: 'Month' } }, y: { title: { display: true, text: 'Count' }, stacked: true }, xAxes: [], yAxes: [] },
      }
    }
  });

  // 4) Daily Record Counts
  additionalCharts.push({
    title: 'Daily Records',
    caption: `Figure 4: Daily Records — Dataset: ${fileName || title}`,
    config: {
      type: 'line',
      data: { labels: dayLabels, datasets: [{ label: 'Records', data: dayCounts, borderColor: '#3b82f6', fill: false }] },
      options: { layout: { padding: 12 }, plugins: { title: { display: true, text: 'Daily Records' }, legend: { display: false } }, scales: { x: { title: { display: true, text: 'Date' } }, y: { title: { display: true, text: 'Count' } } } }
    }
  });

  // 5) Confidence Histogram
  additionalCharts.push({
    title: 'Confidence Distribution (%)',
    caption: `Figure 5: Confidence Distribution — Dataset: ${fileName || title}`,
    config: {
      type: 'bar',
      data: { labels: confHist.labels, datasets: [{ label: 'Count', data: confHist.counts, backgroundColor: '#10b981' }] },
      options: { layout: { padding: 12 }, plugins: { title: { display: true, text: 'Confidence Distribution (%)' } }, scales: { x: { title: { display: true, text: 'Confidence (%)' } }, y: { title: { display: true, text: 'Count' } } } }
    }
  });

  // 6) Processing Time Histogram
  additionalCharts.push({
    title: 'Processing Time (ms)',
    caption: `Figure 6: Processing Time Distribution — Dataset: ${fileName || title}`,
    config: {
      type: 'bar',
      data: { labels: timeHist.labels, datasets: [{ label: 'Count', data: timeHist.counts, backgroundColor: '#f59e0b' }] },
      options: { layout: { padding: 12 }, plugins: { title: { display: true, text: 'Processing Time Distribution (ms)' } }, scales: { x: { title: { display: true, text: 'ms' } }, y: { title: { display: true, text: 'Count' } } } }
    }
  });

  // 7) Tokens Used Histogram
  additionalCharts.push({
    title: 'Tokens Used',
    caption: `Figure 7: Tokens Used Distribution — Dataset: ${fileName || title}`,
    config: {
      type: 'bar',
      data: { labels: tokenHist.labels, datasets: [{ label: 'Count', data: tokenHist.counts, backgroundColor: '#8b5cf6' }] },
      options: { layout: { padding: 12 }, plugins: { title: { display: true, text: 'Tokens Used Distribution' } }, scales: { x: { title: { display: true, text: 'Tokens' } }, y: { title: { display: true, text: 'Count' } } } }
    }
  });

  // 8) Key Phrases Top 10
  additionalCharts.push({
    title: 'Top 10 Key Phrases',
    caption: `Figure 8: Key Phrase Frequency — Dataset: ${fileName || title}`,
    config: {
      type: 'bar',
      data: { labels: phraseLabels, datasets: [{ label: 'Count', data: phraseValues, backgroundColor: '#06b6d4' }] },
      options: { indexAxis: 'y', layout: { padding: 12 }, plugins: { title: { display: true, text: 'Top 10 Key Phrases' }, legend: { display: false } } }
    }
  });

  // 9) Sentiment Ratio (Doughnut)
  const total = summary.total || rows.length;
  const pos = summary.positive; const neg = summary.negative; const neu = summary.neutral;
  additionalCharts.push({
    title: 'Sentiment Ratio',
    caption: `Figure 9: Sentiment Ratio — Dataset: ${fileName || title}`,
    config: {
      type: 'doughnut',
      data: { labels: ['Positive', 'Neutral', 'Negative'], datasets: [{ data: [pos, neu, neg], backgroundColor: ['#22c55e','#9ca3af','#ef4444'] }] },
      options: { plugins: { title: { display: true, text: 'Sentiment Ratio' }, legend: { position: 'bottom' } } }
    }
  });

  // 10) Average Confidence by Sentiment
  const avgBySentiment: Record<string, number[]> = { positive: [], negative: [], neutral: [] };
  for (const r of rows) { avgBySentiment[r.sentiment]?.push(Math.round((r.confidence || 0)*100)); }
  const avgConf = (arr: number[]) => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
  additionalCharts.push({
    title: 'Avg Confidence by Sentiment',
    caption: `Figure 10: Avg Confidence by Sentiment — Dataset: ${fileName || title}`,
    config: {
      type: 'bar',
      data: { labels: ['Positive','Neutral','Negative'], datasets: [{ label: 'Avg %', data: [avgConf(avgBySentiment.positive), avgConf(avgBySentiment.neutral), avgConf(avgBySentiment.negative)], backgroundColor: ['#22c55e','#9ca3af','#ef4444'] }] },
      options: { plugins: { title: { display: true, text: 'Average Confidence by Sentiment' }, legend: { display: false } }, scales: { y: { beginAtZero: true, title: { display: true, text: '%' } } } }
    }
  });

  // 11) Rolling 7-day records
  const rolling = dayCounts.map((_, i) => Math.round(dayCounts.slice(Math.max(0, i-6), i+1).reduce((a,b)=>a+b,0)/Math.min(i+1,7)));
  additionalCharts.push({
    title: 'Rolling 7-Day Records',
    caption: `Figure 11: Rolling 7-Day Records — Dataset: ${fileName || title}`,
    config: { type: 'line', data: { labels: dayLabels, datasets: [{ label: 'Avg', data: rolling, borderColor: '#14b8a6', fill: false }] }, options: { plugins: { title: { display: true, text: 'Rolling 7-Day Average of Records' } } } }
  });

  // 12) Cumulative Records over time
  const cumulative = dayCounts.reduce((arr, c, i) => { arr.push((arr[i-1]||0)+c); return arr; }, [] as number[]);
  additionalCharts.push({
    title: 'Cumulative Records',
    caption: `Figure 12: Cumulative Records — Dataset: ${fileName || title}`,
    config: { type: 'line', data: { labels: dayLabels, datasets: [{ label: 'Cumulative', data: cumulative, borderColor: '#a855f7', fill: false }] }, options: { plugins: { title: { display: true, text: 'Cumulative Records Over Time' } } } }
  });

  // 13) Sentiment Confidence Scatter
  const scatterData = rows.map(r => ({ x: new Date(r.created_at).getTime(), y: Math.round((r.confidence||0)*100) }));
  additionalCharts.push({
    title: 'Confidence over Time',
    caption: `Figure 13: Confidence over Time — Dataset: ${fileName || title}`,
    config: { type: 'scatter', data: { datasets: [{ label: 'Confidence %', data: scatterData, borderColor: '#f97316', backgroundColor: '#f97316' }] }, options: { plugins: { title: { display: true, text: 'Confidence over Time' } }, scales: { x: { type: 'time', time: { unit: 'day' }, title: { display: true, text: 'Date' } }, y: { title: { display: true, text: 'Confidence %' } } } } }
  });

  // 14) Records by Hour of Day
  const hourCounts = new Array(24).fill(0);
  for (const r of rows) { hourCounts[new Date(r.created_at).getHours()]++; }
  additionalCharts.push({
    title: 'Records by Hour',
    caption: `Figure 14: Records by Hour — Dataset: ${fileName || title}`,
    config: { type: 'bar', data: { labels: Array.from({length:24},(_,i)=>`${i}:00`), datasets: [{ label: 'Records', data: hourCounts, backgroundColor: '#60a5fa' }] }, options: { plugins: { title: { display: true, text: 'Records by Hour of Day' } }, scales: { x: { title: { display: true, text: 'Hour' } }, y: { title: { display: true, text: 'Count' } } } } }
  });

  // 15) Average Confidence per Day
  const avgConfPerDay: number[] = dayLabels.map((label) => {
    const dayRows = rows.filter(r => new Date(r.created_at).toISOString().startsWith(label));
    const vals = dayRows.map(r => Math.round((r.confidence||0)*100));
    return vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
  });
  additionalCharts.push({
    title: 'Avg Confidence per Day',
    caption: `Figure 15: Avg Confidence per Day — Dataset: ${fileName || title}`,
    config: { type: 'line', data: { labels: dayLabels, datasets: [{ label: 'Avg %', data: avgConfPerDay, borderColor: '#22c55e', fill: false }] }, options: { plugins: { title: { display: true, text: 'Average Confidence per Day' } }, scales: { y: { beginAtZero: true, title: { display: true, text: '%' } } } } }
  });

  // Render additional charts
  for (const [idx, chart] of additionalCharts.entries()) {
    const png = await fetchChartPng(chart.config, 700, 350);
    if (!png) continue;
    const img = await pdfDoc.embedPng(png);
    const imgW = width;
    const imgH = (imgW / img.width) * img.height;
    if (cursorY - imgH < margin) {
      page = pdfDoc.addPage([595.28, 841.89]);
      cursorY = page.getHeight() - margin;
    }
    page.drawImage(img, { x: margin, y: cursorY - imgH, width: imgW, height: imgH });
    cursorY -= imgH + 10;
    page.drawText(chart.caption, { x: margin, y: cursorY, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    cursorY -= 20;
  }
  

  // Sentiment distribution pie chart
  const pieConfig = {
    type: 'pie',
    data: {
      labels: ['Positive', 'Negative', 'Neutral'],
      datasets: [{
        data: [summary.positive, summary.negative, summary.neutral],
        backgroundColor: ['#22c55e', '#ef4444', '#9ca3af']
      }]
    },
    options: {
      layout: { padding: 12 },
      plugins: {
        legend: { position: 'bottom' },
        title: { display: true, text: 'Sentiment Distribution' },
        subtitle: { display: true, text: `Dataset: ${fileName || title} • Total: ${summary.total}` },
        datalabels: {
          color: '#111827',
          formatter: (v: number, ctx: any) => {
            const total = (ctx.dataset.data || []).reduce((a: number, b: number) => a + b, 0);
            const pct = total ? Math.round((v / total) * 100) : 0;
            return `${v} (${pct}%)`;
          },
          font: { weight: 'bold' }
        }
      }
    }
  };
  const piePng = await fetchChartPng(pieConfig, 700, 350);
  if (piePng) {
    const pieImg = await pdfDoc.embedPng(piePng);
    const imgW = width;
    const imgH = (imgW / pieImg.width) * pieImg.height;
    if (cursorY - imgH < margin) {
      page = pdfDoc.addPage([595.28, 841.89]);
      cursorY = page.getHeight() - margin;
    }
    page.drawImage(pieImg, { x: margin, y: cursorY - imgH, width: imgW, height: imgH });
    // Caption under figure
    const caption = `Figure 1: Sentiment Distribution — Dataset: ${fileName || title} (Total: ${summary.total})`;
    cursorY -= imgH + 10;
    page.drawText(caption, { x: margin, y: cursorY, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    cursorY -= 16;
  }

  // Monthly trend bar chart based on rows
  const byMonth = new Map<string, number>();
  for (const r of rows) {
    const d = new Date(r.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    byMonth.set(key, (byMonth.get(key) || 0) + 1);
  }
  const monthKeys = Array.from(byMonth.keys()).sort();
  if (monthKeys.length > 0) {
    const monthData = monthKeys.map((k) => byMonth.get(k) || 0);
    const barConfig = {
      type: 'bar',
      data: {
        labels: monthKeys,
        datasets: [{
          label: 'Records per Month',
          data: monthData,
          backgroundColor: '#3b82f6'
        }]
      },
      options: {
        layout: { padding: 12 },
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Monthly Records' },
          subtitle: { display: true, text: `Dataset: ${fileName || title} • Total: ${summary.total}` },
          datalabels: {
            anchor: 'end',
            align: 'top',
            color: '#111827',
            formatter: (v: number) => String(v),
            font: { weight: 'bold' }
          }
        },
        scales: {
          x: { title: { display: true, text: 'Month' } },
          y: { beginAtZero: true, title: { display: true, text: 'Record Count' } }
        }
      }
    };
    const barPng = await fetchChartPng(barConfig, 700, 350);
    if (barPng) {
      const barImg = await pdfDoc.embedPng(barPng);
      const imgW = width;
      const imgH = (imgW / barImg.width) * barImg.height;
      if (cursorY - imgH < margin) {
        page = pdfDoc.addPage([595.28, 841.89]);
        cursorY = page.getHeight() - margin;
      }
      page.drawImage(barImg, { x: margin, y: cursorY - imgH, width: imgW, height: imgH });
      // Caption under figure
      const caption2 = `Figure 2: Monthly Records — Dataset: ${fileName || title}`;
      cursorY -= imgH + 10;
      page.drawText(caption2, { x: margin, y: cursorY, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
      cursorY -= 20;
    }
  }

  // No records table is added to keep PDF images-only as requested

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Subscription check
    const { data: userData } = await supabase
      .from("users")
      .select("subscription_status")
      .eq("id", user.id)
      .single();

    if (userData && userData.subscription_status === "none") {
      return NextResponse.json(
        { error: "API access is unavailable without a subscription." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("file_name");

    if (!fileName) {
      return NextResponse.json({ error: "file_name query param is required" }, { status: 400 });
    }

    // Fetch processed dataset rows from sentiment_analyses for this user and dataset
    const { data, error } = await supabase
      .from("sentiment_analyses")
      .select("created_at,input_text,sentiment_result,file_name")
      .eq("user_id", user.id)
      .eq("file_name", fileName)
      .order("created_at", { ascending: false })
      .limit(1000); // practical upper bound

    if (error) {
      console.error("Error fetching dataset for PDF:", error);
      return NextResponse.json({ error: "Failed to fetch dataset" }, { status: 500 });
    }

    const rows = (data || []).map((r: any) => ({
      created_at: r.created_at,
      input_text: r.input_text || "",
      sentiment: r.sentiment_result?.sentiment || "neutral",
      confidence: r.sentiment_result?.confidence ?? 0,
      key_phrases: Array.isArray(r.sentiment_result?.key_phrases) ? r.sentiment_result.key_phrases : [],
    }));

    // Summary counts
    const summary = rows.reduce(
      (acc, r) => {
        acc.total += 1;
        if (r.sentiment === "positive") acc.positive += 1;
        else if (r.sentiment === "negative") acc.negative += 1;
        else acc.neutral += 1;
        return acc;
      },
      { total: 0, positive: 0, negative: 0, neutral: 0 }
    );

    const title = `Processed Dataset: ${fileName}`;
    const pdfBuffer = await generatePdfBuffer(title, summary, rows, fileName || undefined);

    const today = new Date().toISOString().split("T")[0];
    const outName = `processed-dataset-${today}-${encodeURIComponent(fileName)}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${outName}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err) {
    console.error("PDF download error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
