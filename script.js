(() => {
  "use strict";

  const STORAGE_KEY = "leadcontrol_leads_v1";
  const ACTIVITY_KEY = "leadcontrol_activities_v1";
  const STATUSES = ["Novo Lead", "Em Atendimento", "Em Negociação", "Convertido", "Perdido"];
  const STATUS_CLASS = {
    "Novo Lead": "status-novo",
    "Em Atendimento": "status-atendimento",
    "Em Negociação": "status-negociacao",
    "Convertido": "status-convertido",
    "Perdido": "status-perdido"
  };
  const STATUS_COLORS = {
    "Novo Lead": "#2563eb",
    "Em Atendimento": "#f59e0b",
    "Em Negociação": "#8b5cf6",
    "Convertido": "#16a36a",
    "Perdido": "#ef4444"
  };
  const SOURCES = ["WhatsApp", "Instagram", "Facebook", "Indicação", "Site", "Telefone", "Outro"];
  const $ = (id) => document.getElementById(id);
  let leads = [];
  let activities = [];
  let statusChart = null, performanceChart = null, sourceChart = null, monthlyChart = null;
  let activeDetailId = null;

  const todayISO = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  };
  const dateOffset = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const demoLeads = () => [
    {id:"demo-1",name:"Mariana Costa",phone:"(21) 99999-1201",email:"mariana.exemplo@email.com",source:"Instagram",date:dateOffset(0),status:"Novo Lead",notes:"Lead fictício para demonstração.",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},
    {id:"demo-2",name:"Rafael Almeida",phone:"(21) 99999-1202",email:"rafael.exemplo@email.com",source:"WhatsApp",date:dateOffset(1),status:"Em Atendimento",notes:"Solicitou mais informações sobre os serviços.",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},
    {id:"demo-3",name:"Camila Ferreira",phone:"(21) 99999-1203",email:"camila.exemplo@email.com",source:"Indicação",date:dateOffset(3),status:"Em Negociação",notes:"Aguardando retorno sobre a proposta.",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},
    {id:"demo-4",name:"Lucas Martins",phone:"(21) 99999-1204",email:"lucas.exemplo@email.com",source:"Site",date:dateOffset(5),status:"Convertido",notes:"Contato convertido em cliente fictício.",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},
    {id:"demo-5",name:"Beatriz Souza",phone:"(21) 99999-1205",email:"",source:"Facebook",date:dateOffset(8),status:"Perdido",notes:"Não houve continuidade do contato.",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},
    {id:"demo-6",name:"Pedro Ribeiro",phone:"(21) 99999-1206",email:"pedro.exemplo@email.com",source:"WhatsApp",date:dateOffset(12),status:"Em Atendimento",notes:"Prefere contato no período da tarde.",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},
    {id:"demo-7",name:"Ana Oliveira",phone:"(21) 99999-1207",email:"ana.exemplo@email.com",source:"Instagram",date:dateOffset(20),status:"Novo Lead",notes:"Lead fictício para testar pesquisa e filtros.",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}
  ];

  function safeParse(value, fallback) {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : fallback; }
    catch { return fallback; }
  }
  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activities.slice(0, 60)));
    } catch (error) {
      toast("Não foi possível salvar no navegador. Verifique o espaço disponível.", "error");
    }
  }
  function loadData() {
    const savedLeads = localStorage.getItem(STORAGE_KEY);
    const savedActivities = localStorage.getItem(ACTIVITY_KEY);
    if (savedLeads === null) {
      leads = demoLeads();
      activities = [{id:cryptoId(),text:"Dados demonstrativos carregados",time:new Date().toISOString(),symbol:"✦"}];
      saveData();
    } else {
      leads = safeParse(savedLeads, []);
      activities = safeParse(savedActivities || "[]", []);
    }
  }
  function cryptoId() {
    return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `lead-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  }
  function formatDate(value) {
    if (!value) return "—";
    const parts = value.split("-");
    if (parts.length !== 3) return value;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  function formatDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("pt-BR") + " às " + date.toLocaleTimeString("pt-BR", {hour:"2-digit",minute:"2-digit"});
  }
  function initials(name) {
    return String(name || "?").trim().split(/\s+/).slice(0,2).map(part => part[0] || "").join("").toUpperCase();
  }
  function statusBadge(status) {
    const known = STATUSES.includes(status) ? status : "Novo Lead";
    return `<span class="status-badge ${STATUS_CLASS[known]}">${escapeHTML(known)}</span>`;
  }
  function addActivity(text, symbol = "•") {
    activities.unshift({id:cryptoId(),text,time:new Date().toISOString(),symbol});
    activities = activities.slice(0, 60);
    saveData();
  }
  function toast(message, type = "success") {
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    $("toastRegion").appendChild(el);
    window.setTimeout(() => el.remove(), 3600);
  }
  function countsByStatus() {
    return Object.fromEntries(STATUSES.map(status => [status, leads.filter(lead => lead.status === status).length]));
  }
  function updateStats() {
    const counts = countsByStatus();
    $("statTotal").textContent = leads.length;
    $("statNew").textContent = counts["Novo Lead"];
    $("statContact").textContent = counts["Em Atendimento"];
    $("statNegotiation").textContent = counts["Em Negociação"];
    $("statConverted").textContent = counts["Convertido"];
    $("navLeadCount").textContent = leads.length;
    $("reportTotal").textContent = leads.length;
    $("reportConverted").textContent = counts["Convertido"];
    $("reportLost").textContent = counts["Perdido"];
    $("reportRate").textContent = leads.length ? `${((counts["Convertido"] / leads.length) * 100).toLocaleString("pt-BR",{maximumFractionDigits:1})}%` : "0%";
  }
  function filteredLeads() {
    const query = $("searchLeads").value.trim().toLocaleLowerCase("pt-BR");
    const status = $("filterStatus").value;
    const source = $("filterSource").value;
    const from = $("filterFrom").value;
    const to = $("filterTo").value;
    return [...leads].filter(lead => {
      const matchQuery = !query || lead.name.toLocaleLowerCase("pt-BR").includes(query) || String(lead.phone || "").toLocaleLowerCase("pt-BR").includes(query);
      return matchQuery && (!status || lead.status === status) && (!source || lead.source === source) && (!from || lead.date >= from) && (!to || lead.date <= to);
    }).sort((a,b) => (b.date || "").localeCompare(a.date || ""));
  }
  function renderLeadsTable() {
    const filtered = filteredLeads();
    $("leadsCount").textContent = filtered.length;
    $("leadsTableBody").innerHTML = filtered.map(lead => `
      <tr>
        <td><div class="lead-name-cell"><span class="mini-avatar">${escapeHTML(initials(lead.name))}</span><span>${escapeHTML(lead.name)}</span></div></td>
        <td>${escapeHTML(lead.phone || "—")}</td><td>${escapeHTML(lead.email || "—")}</td>
        <td>${escapeHTML(lead.source || "Não informada")}</td><td>${formatDate(lead.date)}</td><td>${statusBadge(lead.status)}</td>
        <td><div class="action-buttons"><button class="mini-action" data-action="details" data-id="${escapeHTML(lead.id)}" title="Ver detalhes" aria-label="Ver detalhes de ${escapeHTML(lead.name)}">↗</button><button class="mini-action" data-action="edit" data-id="${escapeHTML(lead.id)}" title="Editar lead" aria-label="Editar ${escapeHTML(lead.name)}">✎</button></div></td>
      </tr>`).join("");
    $("leadsEmpty").classList.toggle("hidden", filtered.length > 0);
    $("leadsTableBody").closest(".table-scroll").classList.toggle("hidden", filtered.length === 0);
  }
  function renderRecentLeads() {
    const recent = [...leads].sort((a,b) => (b.createdAt || b.date || "").localeCompare(a.createdAt || a.date || "")).slice(0,5);
    $("recentLeadsBody").innerHTML = recent.map(lead => `<tr><td><div class="lead-name-cell"><span class="mini-avatar">${escapeHTML(initials(lead.name))}</span><span>${escapeHTML(lead.name)}</span></div></td><td>${escapeHTML(lead.source || "—")}</td><td>${statusBadge(lead.status)}</td><td>${formatDate(lead.date)}</td></tr>`).join("");
    $("recentEmpty").classList.toggle("hidden", recent.length > 0);
    $("recentLeadsBody").closest(".table-scroll").classList.toggle("hidden", recent.length === 0);
  }
  function renderActivities() {
    const list = $("activityList");
    if (!activities.length) {
      list.innerHTML = '<div class="empty-state">Nenhuma atividade registrada.</div>';
      return;
    }
    list.innerHTML = activities.slice(0,5).map(item => `<div class="activity-item"><span class="activity-symbol">${escapeHTML(item.symbol || "•")}</span><div><div class="activity-text">${escapeHTML(item.text)}</div><div class="activity-time">${escapeHTML(formatDateTime(item.time))}</div></div></div>`).join("");
  }
  function monthKey(dateString) {
    if (!dateString) return "";
    return dateString.slice(0,7);
  }
  function monthLabel(key) {
    const [year, month] = key.split("-").map(Number);
    return new Date(year, month-1, 1).toLocaleDateString("pt-BR",{month:"short"}).replace(".","") + "/" + String(year).slice(-2);
  }
  function lastSixMonths() {
    const result = [];
    const now = new Date();
    for (let i=5;i>=0;i--) {
      const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
      result.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);
    }
    return result;
  }
  function chartDefaults() {
    return {responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{usePointStyle:true,boxWidth:7,boxHeight:7,color:"#64748b",font:{family:"Inter",size:10}}}},scales:{x:{grid:{display:false},ticks:{color:"#8795a8",font:{family:"Inter",size:9}},border:{display:false}},y:{beginAtZero:true,grid:{color:"#eef2f7"},ticks:{precision:0,color:"#8795a8",font:{family:"Inter",size:9}},border:{display:false}}}};
  }
  function destroyChart(chart) { if (chart) chart.destroy(); }
  function renderCharts() {
    if (typeof Chart === "undefined") {
      ["statusChartFallback","performanceChartFallback","sourceChartFallback","monthlyChartFallback"].forEach(id => { const el=$(id); if(el) {el.textContent="Gráficos indisponíveis sem conexão com a biblioteca Chart.js.";el.classList.remove("hidden");} });
      return;
    }
    const counts = countsByStatus();
    const statusCanvas = $("statusChart");
    destroyChart(statusChart);
    statusChart = new Chart(statusCanvas, {type:"doughnut",data:{labels:STATUSES,datasets:[{data:STATUSES.map(s=>counts[s]),backgroundColor:STATUSES.map(s=>STATUS_COLORS[s]),borderWidth:0,hoverOffset:5}]},options:{responsive:true,maintainAspectRatio:false,cutout:"69%",plugins:{legend:{position:"right",labels:{usePointStyle:true,pointStyle:"circle",padding:14,boxWidth:7,color:"#64748b",font:{family:"Inter",size:10}}}}}});
    $("statusChartFallback").classList.toggle("hidden", leads.length > 0);
    const months = lastSixMonths();
    const created = months.map(m => leads.filter(l=>monthKey(l.date)===m).length);
    const converted = months.map(m => leads.filter(l=>monthKey(l.date)===m && l.status==="Convertido").length);
    destroyChart(performanceChart);
    performanceChart = new Chart($("performanceChart"),{type:"line",data:{labels:months.map(monthLabel),datasets:[{label:"Cadastrados",data:created,borderColor:"#2563eb",backgroundColor:"rgba(37,99,235,.1)",fill:true,tension:.35,pointRadius:3},{label:"Convertidos",data:converted,borderColor:"#16a36a",backgroundColor:"rgba(22,163,106,.08)",fill:false,tension:.35,pointRadius:3}]},options:chartDefaults()});
    $("performanceChartFallback").classList.toggle("hidden", leads.length > 0);
    const sourceCounts = {};
    leads.forEach(l => {const key=l.source || "Não informada";sourceCounts[key]=(sourceCounts[key]||0)+1;});
    const sourceEntries = Object.entries(sourceCounts).sort((a,b)=>b[1]-a[1]);
    destroyChart(sourceChart);
    sourceChart = new Chart($("sourceChart"),{type:"bar",data:{labels:sourceEntries.map(x=>x[0]),datasets:[{label:"Leads",data:sourceEntries.map(x=>x[1]),backgroundColor:"#2563eb",borderRadius:5,maxBarThickness:32}]},options:{...chartDefaults(),indexAxis:"y",plugins:{legend:{display:false}}}});
    $("sourceChartFallback").classList.toggle("hidden", sourceEntries.length > 0);
    destroyChart(monthlyChart);
    monthlyChart = new Chart($("monthlyChart"),{type:"bar",data:{labels:months.map(monthLabel),datasets:[{label:"Cadastros",data:created,backgroundColor:"#60a5fa",borderRadius:5,maxBarThickness:34}]},options:chartDefaults()});
    $("monthlyChartFallback").classList.toggle("hidden", leads.length > 0);
  }
  function renderStatusSummary() {
    const counts = countsByStatus();
    $("statusSummary").innerHTML = STATUSES.map(status => {
      const count = counts[status];
      const percent = leads.length ? Math.round(count/leads.length*100) : 0;
      return `<div class="summary-row"><div>${statusBadge(status)}</div><div class="summary-track"><div class="summary-fill" style="width:${percent}%;background:${STATUS_COLORS[status]}"></div></div><div class="summary-percent">${count} · ${percent}%</div></div>`;
    }).join("");
  }
  function renderAll() {
    updateStats();
    renderLeadsTable();
    renderRecentLeads();
    renderActivities();
    renderCharts();
    renderStatusSummary();
    populateFilters();
  }
  function populateFilters() {
    const currentStatus = $("filterStatus").value;
    const currentSource = $("filterSource").value;
    $("filterStatus").innerHTML = '<option value="">Todos os status</option>' + STATUSES.map(s=>`<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join("");
    $("filterSource").innerHTML = '<option value="">Todas as origens</option>' + [...new Set([...SOURCES,...leads.map(l=>l.source).filter(Boolean)])].sort().map(s=>`<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join("");
    $("filterStatus").value = currentStatus;
    $("filterSource").value = currentSource;
  }
  function showPage(page) {
    const valid = ["overview","leads","reports","about"].includes(page) ? page : "overview";
    document.querySelectorAll(".page-view").forEach(section => section.classList.toggle("hidden", section.id !== `page-${valid}`));
    document.querySelectorAll(".nav-item").forEach(btn => btn.classList.toggle("active", btn.dataset.page === valid));
    const titles = {overview:"Visão Geral",leads:"Leads",reports:"Relatórios",about:"Sobre o Aplicativo"};
    $("breadcrumbTitle").textContent = titles[valid];
    $("sidebar").classList.remove("mobile-open");
    if (valid === "overview" || valid === "reports") renderCharts();
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function openForm(id = null) {
    const lead = id ? leads.find(l=>l.id===id) : null;
    $("leadForm").reset();
    $("leadId").value = lead ? lead.id : "";
    $("modalTitle").textContent = lead ? "Editar Lead" : "Novo Lead";
    $("leadName").value = lead?.name || "";
    $("leadPhone").value = lead?.phone || "";
    $("leadEmail").value = lead?.email || "";
    $("leadSource").value = lead?.source || "";
    $("leadStatus").innerHTML = STATUSES.map(s=>`<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join("");
    $("leadStatus").value = lead?.status || "Novo Lead";
    $("leadDate").value = lead?.date || todayISO();
    $("leadNotes").value = lead?.notes || "";
    $("leadModal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
    window.setTimeout(()=>$("leadName").focus(),50);
  }
  function closeForm() {
    $("leadModal").classList.add("hidden");
    document.body.style.overflow = "";
  }
  function openDetails(id) {
    const lead = leads.find(l=>l.id===id);
    if (!lead) return;
    activeDetailId = id;
    $("detailTitle").textContent = "Detalhes do Lead";
    $("leadDetails").innerHTML = `
      <div class="detail-header"><span class="detail-avatar">${escapeHTML(initials(lead.name))}</span><div><h3>${escapeHTML(lead.name)}</h3><p>${statusBadge(lead.status)} &nbsp; · &nbsp; Cadastrado em ${formatDate(lead.date)}</p></div></div>
      <dl class="detail-fields">
        <div class="detail-field"><dt>Telefone</dt><dd>${escapeHTML(lead.phone || "Não informado")}</dd></div>
        <div class="detail-field"><dt>E-mail</dt><dd>${escapeHTML(lead.email || "Não informado")}</dd></div>
        <div class="detail-field"><dt>Origem</dt><dd>${escapeHTML(lead.source || "Não informada")}</dd></div>
        <div class="detail-field"><dt>Status atual</dt><dd>${escapeHTML(lead.status)}</dd></div>
        <div class="detail-field full"><dt>Observações</dt><dd>${escapeHTML(lead.notes || "Nenhuma observação registrada.")}</dd></div>
      </dl>
      <div class="detail-activity"><h3>Histórico de atividades</h3><p>${escapeHTML(formatDateTime(lead.updatedAt || lead.createdAt))} — Última atualização registrada neste navegador.</p></div>`;
    const phoneDigits = String(lead.phone || "").replace(/\D/g,"");
    $("whatsappLead").disabled = !phoneDigits;
    $("whatsappLead").title = phoneDigits ? "Abrir conversa no WhatsApp" : "Este lead não possui telefone cadastrado";
    $("detailModal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
  function closeDetails() {
    $("detailModal").classList.add("hidden");
    document.body.style.overflow = "";
    activeDetailId = null;
  }
  function deleteLead(id) {
    const lead = leads.find(l=>l.id===id);
    if (!lead) return;
    if (!window.confirm(`Tem certeza de que deseja excluir o lead "${lead.name}"? Essa ação não pode ser desfeita.`)) return;
    leads = leads.filter(l=>l.id!==id);
    addActivity(`Lead ${lead.name} excluído`, "×");
    saveData();
    closeDetails();
    renderAll();
    toast("Lead excluído com sucesso.");
  }
  function saveLead(event) {
    event.preventDefault();
    const id = $("leadId").value;
    const oldLead = id ? leads.find(l=>l.id===id) : null;
    const name = $("leadName").value.trim();
    const phone = $("leadPhone").value.trim();
    const email = $("leadEmail").value.trim();
    const source = $("leadSource").value;
    const status = $("leadStatus").value;
    const date = $("leadDate").value;
    const notes = $("leadNotes").value.trim();
    if (!name || !phone || !status || !date) {
      toast("Preencha todos os campos obrigatórios.", "error");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast("Informe um e-mail válido ou deixe o campo vazio.", "error");
      $("leadEmail").focus();
      return;
    }
    const updated = {id:oldLead ? oldLead.id : cryptoId(),name,phone,email,source,status,date,notes,createdAt:oldLead?.createdAt || new Date().toISOString(),updatedAt:new Date().toISOString()};
    if (oldLead) {
      leads = leads.map(l=>l.id===oldLead.id ? updated : l);
      addActivity(`Informações de ${name} atualizadas`, "✎");
      if (oldLead.status !== status) addActivity(`Status de ${name} alterado para ${status}`, "⇄");
      toast("Lead atualizado com sucesso.");
    } else {
      leads.unshift(updated);
      addActivity(`Novo lead cadastrado: ${name}`, "＋");
      toast("Lead cadastrado com sucesso.");
    }
    saveData();
    closeForm();
    renderAll();
    showPage("leads");
  }
  function exportCSV() {
    const rows = filteredLeads();
    const headers = ["Nome","Telefone","E-mail","Origem","Data de cadastro","Status","Observações"];
    const csvCell = value => `"${String(value ?? "").replace(/"/g,'""')}"`;
    const content = "\uFEFF" + [headers,...rows.map(l=>[l.name,l.phone,l.email,l.source,l.date,l.status,l.notes])].map(row=>row.map(csvCell).join(";")).join("\r\n");
    const blob = new Blob([content],{type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leadcontrol-leads-${todayISO()}.csv`;
    document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
    toast(`${rows.length} lead(s) exportado(s) para CSV.`);
  }
  function resetDemo() {
    if (!window.confirm("Isso substituirá os registros atuais pelos leads demonstrativos. Deseja continuar?")) return;
    leads = demoLeads();
    activities = [{id:cryptoId(),text:"Dados demonstrativos restaurados",time:new Date().toISOString(),symbol:"↻"}];
    saveData();renderAll();toast("Dados demonstrativos restaurados.");
  }
  function setupEvents() {
    $("loginForm").addEventListener("submit",event=>{
      event.preventDefault();
      const email=$("loginEmail").value.trim().toLowerCase();
      const password=$("loginPassword").value;
      if(email==="demo@leadcontrol.com" && password==="Lead123!"){
        $("loginError").classList.add("hidden");
        $("welcomeScreen").classList.add("hidden");
        $("appShell").classList.remove("hidden");
        showPage("overview");renderAll();
      } else {
        $("loginError").classList.remove("hidden");
        $("loginPassword").value="";
        $("loginPassword").focus();
      }
    });
    document.querySelectorAll("[data-page]").forEach(btn=>btn.addEventListener("click",()=>showPage(btn.dataset.page)));
    document.querySelectorAll('[data-action="new-lead"]').forEach(btn=>btn.addEventListener("click",()=>openForm()));
    $("collapseSidebar").addEventListener("click",()=>{$("sidebar").classList.toggle("collapsed");$("appShell").querySelector(".main-content").classList.toggle("expanded");});
    $("mobileMenu").addEventListener("click",()=>$("sidebar").classList.toggle("mobile-open"));
    $("searchLeads").addEventListener("input",renderLeadsTable);
    ["filterStatus","filterSource","filterFrom","filterTo"].forEach(id=>$(id).addEventListener("change",renderLeadsTable));
    $("clearFilters").addEventListener("click",()=>{$("searchLeads").value="";$("filterStatus").value="";$("filterSource").value="";$("filterFrom").value="";$("filterTo").value="";renderLeadsTable();});
    $("exportCsv").addEventListener("click",exportCSV);
    $("exportCsvReport").addEventListener("click",exportCSV);
    $("leadForm").addEventListener("submit",saveLead);
    $("closeModal").addEventListener("click",closeForm);
    $("cancelModal").addEventListener("click",closeForm);
    $("closeDetail").addEventListener("click",closeDetails);
    $("editLead").addEventListener("click",()=>{const id=activeDetailId;closeDetails();openForm(id);});
    $("deleteLead").addEventListener("click",()=>{if(activeDetailId)deleteLead(activeDetailId);});
    $("whatsappLead").addEventListener("click",()=>{
      const lead=leads.find(l=>l.id===activeDetailId);
      if(!lead || !String(lead.phone||"").replace(/\D/g,"")){toast("Este lead não possui telefone cadastrado.","error");return;}
      let digits=String(lead.phone).replace(/\D/g,"");
      // Só adiciona o código brasileiro quando o telefone parece ser um número nacional de 10 ou 11 dígitos.
      if(digits.length===10 || digits.length===11) digits="55"+digits;
      window.open(`https://wa.me/${digits}`,"_blank","noopener,noreferrer");
    });
    $("resetDemo").addEventListener("click",resetDemo);
    document.addEventListener("click",event=>{
      const action = event.target.closest("[data-action]");
      if (!action) return;
      if (action.dataset.action==="details") openDetails(action.dataset.id);
      if (action.dataset.action==="edit") openForm(action.dataset.id);
    });
    ["leadModal","detailModal"].forEach(id=>$(id).addEventListener("click",event=>{if(event.target.id===id){$(id).classList.add("hidden");document.body.style.overflow="";}}));
    document.addEventListener("keydown",event=>{
      if(event.key==="Escape"){closeForm();closeDetails();$("sidebar").classList.remove("mobile-open");}
    });
  }
  function init() {
    $("leadStatus").innerHTML = STATUSES.map(s=>`<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join("");
    loadData();
    populateFilters();
    setupEvents();
    renderAll();
  }
  init();
})();
