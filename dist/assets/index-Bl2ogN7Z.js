(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))a(r);new MutationObserver(r=>{for(const o of r)if(o.type==="childList")for(const i of o.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&a(i)}).observe(document,{childList:!0,subtree:!0});function t(r){const o={};return r.integrity&&(o.integrity=r.integrity),r.referrerPolicy&&(o.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?o.credentials="include":r.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function a(r){if(r.ep)return;r.ep=!0;const o=t(r);fetch(r.href,o)}})();const w=[{id:"task-101",title:"Implement Authentication Flow & JWT Handling",description:"Build secure token-based user authentication, token refresh logic, and role-based route protection.",category:"Development",priority:"High",status:"In Progress",lead:"Manveer Singh",dueDate:"2026-09-10",estimatedHours:16,tags:["Security","Backend","API"],archived:!1,createdAt:"2026-08-25T10:00:00.000Z"},{id:"task-102",title:"Design UI Glassmorphism Theme System",description:"Create design tokens, CSS variables, and glassmorphic card elements for dark/light dashboard themes.",category:"Design",priority:"Urgent",status:"Completed",lead:"Sarah Connor",dueDate:"2026-08-30",estimatedHours:12,tags:["UI/UX","CSS","Frontend"],archived:!1,createdAt:"2026-08-20T14:30:00.000Z"},{id:"task-103",title:"Q4 Marketing Strategy & Campaign Launch",description:"Draft content calendar, coordinate social media collateral, and schedule promotional email sequences.",category:"Marketing",priority:"Medium",status:"To Do",lead:"Alex Rivera",dueDate:"2026-09-15",estimatedHours:20,tags:["Growth","Campaign","Content"],archived:!1,createdAt:"2026-08-28T09:15:00.000Z"},{id:"task-104",title:"Quarterly Financial Audit & Budget Allocation",description:"Review operational expenditure, calculate ROI on dev tooling, and finalize next quarter budget allocations.",category:"Finance",priority:"High",status:"Under Review",lead:"Elena Rostova",dueDate:"2026-09-05",estimatedHours:10,tags:["Audit","Budget","Finance"],archived:!1,createdAt:"2026-08-22T11:00:00.000Z"},{id:"task-105",title:"Database Schema Migration & Indexing",description:"Optimize query execution plan, add composite indexes on high-frequency tables, and execute zero-downtime migration.",category:"Development",priority:"Urgent",status:"Backlog",lead:"Manveer Singh",dueDate:"2026-09-20",estimatedHours:24,tags:["Database","SQL","Performance"],archived:!1,createdAt:"2026-08-29T16:00:00.000Z"},{id:"task-106",title:"CI/CD Deployment Pipeline Automation",description:"Set up GitHub Actions / GitLab CI workflows with automated unit tests, build validation, and staging deployment.",category:"Operations",priority:"Medium",status:"In Progress",lead:"Devon Vance",dueDate:"2026-09-12",estimatedHours:14,tags:["DevOps","CI/CD","Automation"],archived:!1,createdAt:"2026-08-26T08:45:00.000Z"},{id:"task-107",title:"Customer Onboarding Experience Redesign",description:"Streamline user registration steps and introduce interactive product walkthrough guide.",category:"Design",priority:"Low",status:"To Do",lead:"Sarah Connor",dueDate:"2026-09-25",estimatedHours:18,tags:["UX","Product","Onboarding"],archived:!1,createdAt:"2026-08-31T13:20:00.000Z"},{id:"task-108",title:"API Performance & Response Caching",description:"Integrate Redis caching layer for heavy read endpoints to reduce server response latency below 50ms.",category:"Development",priority:"High",status:"Completed",lead:"Manveer Singh",dueDate:"2026-08-29",estimatedHours:8,tags:["Backend","Redis","Optimization"],archived:!1,createdAt:"2026-08-15T09:00:00.000Z"}],x="ate_operations_tasks",T="ate_theme";function A(){try{const s=localStorage.getItem(x);return s?JSON.parse(s):(y(w),w)}catch(s){return console.error("Failed to parse local storage tasks",s),w}}function y(s){try{localStorage.setItem(x,JSON.stringify(s))}catch(e){console.error("Failed to save tasks to local storage",e)}}function E(){return localStorage.getItem(T)||"dark"}function H(s){localStorage.setItem(T,s)}function B(s){const e="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(s,null,2)),t=document.createElement("a");t.setAttribute("href",e),t.setAttribute("download",`ate_tasks_export_${new Date().toISOString().slice(0,10)}.json`),document.body.appendChild(t),t.click(),t.remove()}class O{constructor(){this.state={tasks:A(),currentView:"grid",theme:E(),filters:{search:"",category:"All",priority:"All",status:"All",lead:"All",sortBy:"dueDate",sortOrder:"asc"},modalState:{isOpen:!1,mode:"create",activeTaskId:null},confirmModalState:{isOpen:!1,title:"",message:"",actionType:null,targetId:null},toasts:[]},this.listeners=[]}getState(){return this.state}subscribe(e){return this.listeners.push(e),()=>{this.listeners=this.listeners.filter(t=>t!==e)}}notify(){this.listeners.forEach(e=>e(this.state))}setTasks(e){this.state.tasks=e,y(e),this.notify()}addTask(e){this.state.tasks=[e,...this.state.tasks],y(this.state.tasks),this.addToast("Task created successfully!","success"),this.notify()}updateTask(e){this.state.tasks=this.state.tasks.map(t=>t.id===e.id?{...t,...e}:t),y(this.state.tasks),this.addToast("Task updated successfully!","success"),this.notify()}updateTaskStatus(e,t){const a=this.state.tasks.find(r=>r.id===e);a&&(a.status=t,y(this.state.tasks),this.addToast(`Moved to ${t}`,"info"),this.notify())}archiveTask(e){this.state.tasks=this.state.tasks.map(t=>t.id===e?{...t,archived:!0}:t),y(this.state.tasks),this.addToast("Task moved to archive","info"),this.notify()}restoreTask(e){this.state.tasks=this.state.tasks.map(t=>t.id===e?{...t,archived:!1}:t),y(this.state.tasks),this.addToast("Task restored from archive","success"),this.notify()}deleteTaskPermanently(e){this.state.tasks=this.state.tasks.filter(t=>t.id!==e),y(this.state.tasks),this.addToast("Task permanently deleted","error"),this.notify()}setCurrentView(e){this.state.currentView=e,this.notify()}setFilter(e,t){this.state.filters[e]=t,this.notify()}toggleTheme(){const e=this.state.theme==="dark"?"light":"dark";this.state.theme=e,H(e),document.documentElement.setAttribute("data-theme",e),this.notify()}openTaskModal(e="create",t=null){this.state.modalState={isOpen:!0,mode:e,activeTaskId:t},this.notify()}closeTaskModal(){this.state.modalState.isOpen=!1,this.notify()}openConfirmModal({title:e,message:t,actionType:a,targetId:r}){this.state.confirmModalState={isOpen:!0,title:e,message:t,actionType:a,targetId:r},this.notify()}closeConfirmModal(){this.state.confirmModalState.isOpen=!1,this.notify()}addToast(e,t="info"){const a=Date.now();this.state.toasts.push({id:a,message:e,type:t}),this.notify(),setTimeout(()=>{this.removeToast(a)},3500)}removeToast(e){this.state.toasts=this.state.toasts.filter(t=>t.id!==e),this.notify()}}const n=new O;function I(s){const e=n.getState();s.innerHTML=`
    <div class="flex items-center gap-3">
      <div class="search-box">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          id="global-search-input" 
          placeholder="Search operations, leads, tags..." 
          value="${e.filters.search||""}"
        />
      </div>
    </div>

    <div class="header-actions">
      <!-- Data Export Menu -->
      <button class="btn btn-secondary btn-sm" id="btn-export-json" title="Export as JSON">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Export
      </button>

      <!-- Theme Switcher -->
      <button class="btn btn-icon" id="btn-theme-toggle" title="Toggle Theme">
        ${e.theme==="dark"?`
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        `:`
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        `}
      </button>

      <!-- New Task Primary CTA -->
      <button class="btn btn-primary" id="btn-new-task">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        New Operation
      </button>
    </div>
  `;const t=s.querySelector("#global-search-input");t&&t.addEventListener("input",i=>{n.setFilter("search",i.target.value)});const a=s.querySelector("#btn-theme-toggle");a&&a.addEventListener("click",()=>{n.toggleTheme()});const r=s.querySelector("#btn-new-task");r&&r.addEventListener("click",()=>{n.openTaskModal("create")});const o=s.querySelector("#btn-export-json");o&&o.addEventListener("click",()=>{const i=n.getState().tasks.filter(l=>!l.archived);B(i),n.addToast("Data exported successfully!","success")})}function q(s){const e=n.getState(),t=e.tasks.filter(i=>!i.archived).length,a=e.tasks.filter(i=>i.archived).length;s.innerHTML=`
    <div class="sidebar-header">
      <img src="./assets/images/logo.jpg" alt="ATE Ops Logo" class="app-brand-logo" />
      <div>
        <div class="app-brand-title">ATE Suite</div>
        <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500;">Operations Control</div>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div 
        class="nav-item ${e.currentView==="grid"?"active":""}" 
        data-view="grid"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <span>Card Grid</span>
        <span class="nav-badge">${t}</span>
      </div>

      <div 
        class="nav-item ${e.currentView==="table"?"active":""}" 
        data-view="table"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
        <span>Data Table</span>
      </div>

      <div 
        class="nav-item ${e.currentView==="kanban"?"active":""}" 
        data-view="kanban"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3h4v18H3zM10 3h4v12h-4zM17 3h4v15h-4z"></path>
        </svg>
        <span>Kanban Board</span>
      </div>

      <div 
        class="nav-item ${e.currentView==="analytics"?"active":""}" 
        data-view="analytics"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
        <span>Analytics</span>
      </div>

      <div style="height: 1px; background: var(--border-color); margin: 0.5rem 0;"></div>

      <div 
        class="nav-item ${e.currentView==="archive"?"active":""}" 
        data-view="archive"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="21 8 21 21 3 21 3 8"></polyline>
          <rect x="1" y="3" width="22" height="5"></rect>
          <line x1="10" y1="12" x2="14" y2="12"></line>
        </svg>
        <span>Archive Trash</span>
        <span class="nav-badge">${a}</span>
      </div>
    </nav>

    <div class="sidebar-footer">
      <button class="btn btn-secondary btn-sm" id="btn-seed-data" style="width: 100%;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
        </svg>
        Reset Demo Data
      </button>
    </div>
  `,s.querySelectorAll(".nav-item").forEach(i=>{i.addEventListener("click",()=>{const l=i.getAttribute("data-view");n.setCurrentView(l)})});const o=s.querySelector("#btn-seed-data");o&&o.addEventListener("click",()=>{n.setTasks(w),n.addToast("Demo data restored successfully!","info")})}function $(s,e,t=!1){let a=s.filter(o=>t?o.archived:!o.archived);if(e.search&&e.search.trim()!==""){const o=e.search.toLowerCase().trim();a=a.filter(i=>i.title&&i.title.toLowerCase().includes(o)||i.description&&i.description.toLowerCase().includes(o)||i.lead&&i.lead.toLowerCase().includes(o)||i.category&&i.category.toLowerCase().includes(o)||i.tags&&i.tags.some(l=>l.toLowerCase().includes(o)))}e.category&&e.category!=="All"&&(a=a.filter(o=>o.category===e.category)),e.priority&&e.priority!=="All"&&(a=a.filter(o=>o.priority===e.priority)),e.status&&e.status!=="All"&&(a=a.filter(o=>o.status===e.status)),e.lead&&e.lead!=="All"&&(a=a.filter(o=>o.lead===e.lead));const r={Urgent:4,High:3,Medium:2,Low:1};return a.sort((o,i)=>{let l=0;if(e.sortBy==="dueDate"){const v=o.dueDate?new Date(o.dueDate).getTime():9999999999999,u=i.dueDate?new Date(i.dueDate).getTime():9999999999999;l=v-u}else e.sortBy==="priority"?l=(r[i.priority]||0)-(r[o.priority]||0):e.sortBy==="title"?l=o.title.localeCompare(i.title):e.sortBy==="estimatedHours"?l=(o.estimatedHours||0)-(i.estimatedHours||0):e.sortBy==="createdAt"&&(l=new Date(i.createdAt).getTime()-new Date(o.createdAt).getTime());return e.sortOrder==="desc"?-l:l}),a}function S(s){const e=s.filter(c=>!c.archived),t=new Date;t.setHours(0,0,0,0);const a=e.length,r=e.filter(c=>c.status==="Completed").length,o=e.filter(c=>c.status==="In Progress").length,i=e.filter(c=>c.priority==="Urgent").length,l=e.filter(c=>{if(c.status==="Completed"||!c.dueDate)return!1;const p=new Date(c.dueDate);return p.setHours(0,0,0,0),p<t}).length,v=e.reduce((c,p)=>c+(Number(p.estimatedHours)||0),0),u=a>0?Math.round(r/a*100):0,h={};e.forEach(c=>{const p=c.category||"Unassigned";h[p]=(h[p]||0)+1});const m={Low:0,Medium:0,High:0,Urgent:0};return e.forEach(c=>{m[c.priority]!==void 0&&m[c.priority]++}),{total:a,completed:r,inProgress:o,urgent:i,overdue:l,totalEstimatedHours:v,completionRate:u,categories:h,priorities:m}}function P(s){const e={};return!s.title||s.title.trim()===""?e.title="Title is required":s.title.length<3&&(e.title="Title must be at least 3 characters long"),s.category||(e.category="Please select a category"),s.priority||(e.priority="Please select a priority"),s.status||(e.status="Please select a status"),s.estimatedHours!==void 0&&(isNaN(s.estimatedHours)||s.estimatedHours<0)&&(e.estimatedHours="Hours must be a positive number"),{isValid:Object.keys(e).length===0,errors:e}}function V(s){const{tasks:e}=n.getState(),t=S(e);s.innerHTML=`
    <div class="stats-grid animate-fade-in">
      <!-- Total Tasks Card -->
      <div class="glass-card stat-card" style="--stat-accent: #38bdf8;">
        <div class="stat-icon-wrapper">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">${t.total}</div>
          <div class="stat-label">Active Operations</div>
        </div>
      </div>

      <!-- Completion Rate Card -->
      <div class="glass-card stat-card" style="--stat-accent: #10b981;">
        <div class="stat-icon-wrapper" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">${t.completed} <span style="font-size: 1rem; color: var(--text-muted);">(${t.completionRate}%)</span></div>
          <div class="stat-label">Completed</div>
        </div>
      </div>

      <!-- In Progress Card -->
      <div class="glass-card stat-card" style="--stat-accent: #f59e0b;">
        <div class="stat-icon-wrapper" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">${t.inProgress}</div>
          <div class="stat-label">In Progress</div>
        </div>
      </div>

      <!-- Overdue Warning Card -->
      <div class="glass-card stat-card" style="--stat-accent: #ef4444;">
        <div class="stat-icon-wrapper" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value" style="color: ${t.overdue>0?"#ef4444":"inherit"};">${t.overdue}</div>
          <div class="stat-label">Overdue Items</div>
        </div>
      </div>

      <!-- Total Work Hours -->
      <div class="glass-card stat-card" style="--stat-accent: #818cf8;">
        <div class="stat-icon-wrapper" style="background: rgba(129, 140, 248, 0.1); color: #818cf8;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">${t.totalEstimatedHours} <span style="font-size: 0.9rem; color: var(--text-muted);">hrs</span></div>
          <div class="stat-label">Total Allocated</div>
        </div>
      </div>
    </div>
  `}function z(s){const e=n.getState(),{filters:t,currentView:a}=e,r=["All","Development","Design","Marketing","Finance","Operations"],o=["All",...new Set(e.tasks.map(d=>d.lead).filter(Boolean))],i=["All","Low","Medium","High","Urgent"],l=["All","Backlog","To Do","In Progress","Under Review","Completed"];s.innerHTML=`
    <div class="filter-bar animate-fade-in">
      <div class="filter-group">
        <!-- Category Filter -->
        <div class="flex items-center gap-1">
          <label style="font-size: 0.8rem; color: var(--text-muted);">Category:</label>
          <select id="filter-category" class="select-sm">
            ${r.map(d=>`<option value="${d}" ${t.category===d?"selected":""}>${d}</option>`).join("")}
          </select>
        </div>

        <!-- Priority Filter -->
        <div class="flex items-center gap-1">
          <label style="font-size: 0.8rem; color: var(--text-muted);">Priority:</label>
          <select id="filter-priority" class="select-sm">
            ${i.map(d=>`<option value="${d}" ${t.priority===d?"selected":""}>${d}</option>`).join("")}
          </select>
        </div>

        <!-- Status Filter -->
        <div class="flex items-center gap-1">
          <label style="font-size: 0.8rem; color: var(--text-muted);">Status:</label>
          <select id="filter-status" class="select-sm">
            ${l.map(d=>`<option value="${d}" ${t.status===d?"selected":""}>${d}</option>`).join("")}
          </select>
        </div>

        <!-- Lead Filter -->
        <div class="flex items-center gap-1">
          <label style="font-size: 0.8rem; color: var(--text-muted);">Lead:</label>
          <select id="filter-lead" class="select-sm">
            ${o.map(d=>`<option value="${d}" ${t.lead===d?"selected":""}>${d}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="filter-group">
        <!-- Sorting dropdown -->
        <div class="flex items-center gap-1">
          <label style="font-size: 0.8rem; color: var(--text-muted);">Sort By:</label>
          <select id="filter-sort-by" class="select-sm">
            <option value="dueDate" ${t.sortBy==="dueDate"?"selected":""}>Due Date</option>
            <option value="priority" ${t.sortBy==="priority"?"selected":""}>Priority</option>
            <option value="title" ${t.sortBy==="title"?"selected":""}>Title</option>
            <option value="estimatedHours" ${t.sortBy==="estimatedHours"?"selected":""}>Est. Hours</option>
            <option value="createdAt" ${t.sortBy==="createdAt"?"selected":""}>Creation Date</option>
          </select>

          <button class="btn btn-icon btn-sm" id="btn-toggle-sort-order" title="Toggle Sort Direction (${t.sortOrder.toUpperCase()})">
            ${t.sortOrder==="asc"?"↑":"↓"}
          </button>
        </div>

        <!-- View Switch Buttons -->
        ${a==="grid"||a==="table"?`
          <div class="flex items-center gap-1" style="background: var(--bg-tertiary); padding: 2px; border-radius: var(--radius-md);">
            <button class="btn btn-sm ${a==="grid"?"btn-primary":""}" id="btn-view-grid" title="Grid View">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
            <button class="btn btn-sm ${a==="table"?"btn-primary":""}" id="btn-view-table" title="Table View">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
              </svg>
            </button>
          </div>
        `:""}
      </div>
    </div>
  `;const v=s.querySelector("#filter-category");v&&v.addEventListener("change",d=>n.setFilter("category",d.target.value));const u=s.querySelector("#filter-priority");u&&u.addEventListener("change",d=>n.setFilter("priority",d.target.value));const h=s.querySelector("#filter-status");h&&h.addEventListener("change",d=>n.setFilter("status",d.target.value));const m=s.querySelector("#filter-lead");m&&m.addEventListener("change",d=>n.setFilter("lead",d.target.value));const c=s.querySelector("#filter-sort-by");c&&c.addEventListener("change",d=>n.setFilter("sortBy",d.target.value));const p=s.querySelector("#btn-toggle-sort-order");p&&p.addEventListener("click",()=>{n.setFilter("sortOrder",t.sortOrder==="asc"?"desc":"asc")});const b=s.querySelector("#btn-view-grid");b&&b.addEventListener("click",()=>n.setCurrentView("grid"));const f=s.querySelector("#btn-view-table");f&&f.addEventListener("click",()=>n.setCurrentView("table"))}function C(s){if(!s)return"No Date";const e=new Date(s);return isNaN(e.getTime())?s:new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric"}).format(e)}function F(s){if(!s)return{text:"No due date",class:"normal"};const e=new Date(s),t=new Date;e.setHours(0,0,0,0),t.setHours(0,0,0,0);const a=e.getTime()-t.getTime(),r=Math.ceil(a/(1e3*60*60*24));return r<0?{text:`Overdue by ${Math.abs(r)} d`,class:"urgent"}:r===0?{text:"Due Today",class:"high"}:r===1?{text:"Due Tomorrow",class:"medium"}:{text:`${r} days left`,class:"normal"}}function R(){return"task-"+Math.random().toString(36).substr(2,9)}function g(s){return s?String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):""}function k(s){return`<span class="badge badge-priority-${(s||"low").toLowerCase()}">
    <span class="badge-dot"></span>${g(s)}
  </span>`}function D(s){return`<span class="badge badge-status-${(s||"backlog").toLowerCase().replace(/\s+/g,"")}">
    <span class="badge-dot"></span>${g(s)}
  </span>`}function U(s){const{tasks:e,filters:t,currentView:a}=n.getState(),r=a==="archive",o=$(e,t,r);if(o.length===0){s.innerHTML=`
      <div class="glass-card animate-fade-in" style="padding: 3rem; text-align: center;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom: 1rem;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3 style="margin-bottom: 0.5rem; color: var(--text-secondary);">No Operations Found</h3>
        <p style="font-size: 0.9rem; color: var(--text-muted);">
          ${r?"The archive is currently empty.":"No tasks match your current search and filter criteria."}
        </p>
      </div>
    `;return}a==="table"||r?N(s,o,r):j(s,o)}function j(s,e){const t=e.map(a=>{const r=F(a.dueDate),o=(a.tags||[]).map(i=>`<span class="tag-category">#${g(i)}</span>`).join(" ");return`
      <div class="glass-card task-card draggable animate-fade-in" data-id="${a.id}" draggable="true">
        <div class="task-card-header">
          <span class="tag-category">${g(a.category||"General")}</span>
          ${k(a.priority)}
        </div>

        <div>
          <h4 class="task-title" title="${g(a.title)}">${g(a.title)}</h4>
          <p class="task-description" style="margin-top: 0.35rem;">${g(a.description||"No description provided.")}</p>
        </div>

        <div class="flex items-center justify-between" style="margin-top: 0.25rem;">
          ${D(a.status)}
          <span style="font-size: 0.8rem; color: var(--text-muted);">${a.estimatedHours||0} hrs</span>
        </div>

        ${o?`<div class="flex flex-wrap gap-1">${o}</div>`:""}

        <div class="task-meta-row">
          <div class="flex items-center gap-1" title="Assigned Lead">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>${g(a.lead||"Unassigned")}</span>
          </div>

          <div style="color: ${r.class==="urgent"?"#ef4444":"inherit"}; font-weight: 500;">
            📅 ${C(a.dueDate)}
          </div>
        </div>

        <div class="task-actions flex justify-end gap-1" style="margin-top: 0.25rem;">
          <button class="btn btn-secondary btn-sm btn-edit" data-id="${a.id}" title="Edit Task">
            Edit
          </button>
          <button class="btn btn-danger btn-sm btn-archive" data-id="${a.id}" title="Move to Archive">
            Archive
          </button>
        </div>
      </div>
    `}).join("");s.innerHTML=`<div class="tasks-grid-view">${t}</div>`,L(s)}function N(s,e,t){const a=e.map(r=>`
      <tr data-id="${r.id}" class="animate-fade-in">
        <td><strong>${g(r.title)}</strong></td>
        <td><span class="tag-category">${g(r.category||"General")}</span></td>
        <td>${k(r.priority)}</td>
        <td>${D(r.status)}</td>
        <td>${g(r.lead||"Unassigned")}</td>
        <td>${C(r.dueDate)}</td>
        <td>${r.estimatedHours||0} hrs</td>
        <td class="flex gap-1 justify-end">
          ${t?`
            <button class="btn btn-secondary btn-sm btn-restore" data-id="${r.id}">Restore</button>
            <button class="btn btn-danger btn-sm btn-delete-perm" data-id="${r.id}">Delete</button>
          `:`
            <button class="btn btn-secondary btn-sm btn-edit" data-id="${r.id}">Edit</button>
            <button class="btn btn-danger btn-sm btn-archive" data-id="${r.id}">Archive</button>
          `}
        </td>
      </tr>
    `).join("");s.innerHTML=`
    <div class="table-container animate-fade-in">
      <table class="data-table">
        <thead>
          <tr>
            <th>Operation Title</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Lead</th>
            <th>Due Date</th>
            <th>Est. Hours</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${a}
        </tbody>
      </table>
    </div>
  `,L(s)}function L(s){s.querySelectorAll(".btn-edit").forEach(e=>{e.addEventListener("click",t=>{t.stopPropagation();const a=e.getAttribute("data-id");n.openTaskModal("edit",a)})}),s.querySelectorAll(".btn-archive").forEach(e=>{e.addEventListener("click",t=>{t.stopPropagation();const a=e.getAttribute("data-id");n.archiveTask(a)})}),s.querySelectorAll(".btn-restore").forEach(e=>{e.addEventListener("click",t=>{t.stopPropagation();const a=e.getAttribute("data-id");n.restoreTask(a)})}),s.querySelectorAll(".btn-delete-perm").forEach(e=>{e.addEventListener("click",t=>{t.stopPropagation();const a=e.getAttribute("data-id");n.openConfirmModal({title:"Delete Operation Permanently",message:"Are you sure you want to permanently delete this task? This action cannot be undone.",actionType:"delete_perm",targetId:a})})})}function G(s){const{tasks:e,filters:t}=n.getState(),a=$(e,t,!1),o=[{title:"Backlog",status:"Backlog",color:"#94a3b8"},{title:"To Do",status:"To Do",color:"#38bdf8"},{title:"In Progress",status:"In Progress",color:"#f59e0b"},{title:"Under Review",status:"Under Review",color:"#a855f7"},{title:"Completed",status:"Completed",color:"#10b981"}].map(i=>{const l=a.filter(u=>u.status===i.status),v=l.map(u=>`
      <div 
        class="glass-card task-card draggable animate-fade-in" 
        data-id="${u.id}" 
        draggable="true"
        style="padding: 1rem;"
      >
        <div class="task-card-header">
          <span class="tag-category">${g(u.category)}</span>
          ${k(u.priority)}
        </div>
        <h4 class="task-title" style="font-size: 0.95rem;">${g(u.title)}</h4>
        <div class="flex items-center justify-between" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">
          <span>👤 ${g(u.lead||"Unassigned")}</span>
          <span>⏱️ ${u.estimatedHours||0}h</span>
        </div>
        <div class="flex justify-end gap-1" style="margin-top: 0.5rem;">
          <button class="btn btn-secondary btn-sm btn-edit" data-id="${u.id}">Edit</button>
        </div>
      </div>
    `).join("");return`
      <div class="kanban-column" data-status="${i.status}">
        <div class="kanban-column-header">
          <div class="flex items-center gap-2">
            <span style="width: 10px; height: 10px; border-radius: 50%; background: ${i.color};"></span>
            <span>${i.title}</span>
          </div>
          <span class="badge" style="background: var(--bg-tertiary);">${l.length}</span>
        </div>
        <div class="kanban-cards-container" data-status="${i.status}">
          ${v.length?v:'<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 2rem 0;">Drag items here</div>'}
        </div>
      </div>
    `}).join("");s.innerHTML=`<div class="kanban-board animate-fade-in">${o}</div>`,s.querySelectorAll(".btn-edit").forEach(i=>{i.addEventListener("click",l=>{l.stopPropagation();const v=i.getAttribute("data-id");n.openTaskModal("edit",v)})}),_(s)}function _(s){let e=null;s.querySelectorAll(".draggable").forEach(t=>{t.addEventListener("dragstart",a=>{e=t.getAttribute("data-id"),t.classList.add("dragging"),a.dataTransfer.setData("text/plain",e)}),t.addEventListener("dragend",()=>{t.classList.remove("dragging")})}),s.querySelectorAll(".kanban-cards-container").forEach(t=>{t.addEventListener("dragover",a=>{a.preventDefault(),t.classList.add("drag-over")}),t.addEventListener("dragleave",()=>{t.classList.remove("drag-over")}),t.addEventListener("drop",a=>{a.preventDefault(),t.classList.remove("drag-over");const r=t.getAttribute("data-status");e&&r&&n.updateTaskStatus(e,r)})})}function J(s){const{tasks:e}=n.getState(),t=S(e),a=Object.entries(t.categories),r=Object.entries(t.priorities);s.innerHTML=`
    <div class="analytics-grid animate-fade-in">
      <!-- Category Distribution -->
      <div class="glass-card analytics-card">
        <h3>Category Breakdown</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Distribution of active operations by department.</p>

        <div class="chart-bar-group" style="margin-top: 1rem;">
          ${a.map(([o,i])=>{const l=t.total>0?Math.round(i/t.total*100):0;return`
              <div class="chart-bar-item">
                <div class="chart-bar-label">
                  <span>${g(o)}</span>
                  <span>${i} tasks (${l}%)</span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: ${l}%;"></div>
                </div>
              </div>
            `}).join("")}
        </div>
      </div>

      <!-- Priority Distribution -->
      <div class="glass-card analytics-card">
        <h3>Priority Heatmap</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Volume of tasks categorized by urgency level.</p>

        <div class="chart-bar-group" style="margin-top: 1rem;">
          ${r.map(([o,i])=>{const l=t.total>0?Math.round(i/t.total*100):0;return`
              <div class="chart-bar-item">
                <div class="chart-bar-label">
                  <span>${o} Priority</span>
                  <span>${i} tasks (${l}%)</span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: ${l}%; background: ${{Urgent:"#ef4444",High:"#f97316",Medium:"#3b82f6",Low:"#10b981"}[o]||"var(--accent-primary)"};"></div>
                </div>
              </div>
            `}).join("")}
        </div>
      </div>

      <!-- Workflow Velocity -->
      <div class="glass-card analytics-card">
        <h3>Completion Velocity</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Overall progress towards completing current workload.</p>

        <div class="flex flex-col items-center justify-center" style="padding: 2rem 0;">
          <div style="font-size: 3rem; font-weight: 800; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            ${t.completionRate}%
          </div>
          <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.5rem;">
            ${t.completed} of ${t.total} Active Operations Finished
          </p>
        </div>
      </div>
    </div>
  `}function K(s){const{modalState:e,tasks:t}=n.getState();if(!e.isOpen){s.innerHTML="";return}const a=e.mode==="edit",r=a?t.find(c=>c.id===e.activeTaskId):null,o={title:"",description:"",category:"Development",priority:"Medium",status:"To Do",lead:"Manveer Singh",dueDate:new Date(Date.now()+7*864e5).toISOString().slice(0,10),estimatedHours:8,tags:[]},i=r?{...r}:o;s.innerHTML=`
    <div class="modal-overlay active" id="task-modal-overlay">
      <div class="modal-content animate-fade-in">
        <div class="modal-header">
          <h3>${a?"Edit Operation Details":"Create New Operation"}</h3>
          <button class="btn btn-icon btn-sm" id="btn-close-modal">✕</button>
        </div>

        <form id="task-form">
          <div class="modal-body">
            <!-- Title -->
            <div class="form-group">
              <label for="form-title">Operation Title *</label>
              <input type="text" id="form-title" value="${i.title||""}" placeholder="e.g. Database Index Optimization" required />
              <span class="error-text" id="err-title"></span>
            </div>

            <!-- Description -->
            <div class="form-group">
              <label for="form-description">Description</label>
              <textarea id="form-description" rows="3" placeholder="Provide operational scope, goals, or requirements...">${i.description||""}</textarea>
            </div>

            <!-- Category & Priority Row -->
            <div class="form-row">
              <div class="form-group">
                <label for="form-category">Category *</label>
                <select id="form-category">
                  <option value="Development" ${i.category==="Development"?"selected":""}>Development</option>
                  <option value="Design" ${i.category==="Design"?"selected":""}>Design</option>
                  <option value="Marketing" ${i.category==="Marketing"?"selected":""}>Marketing</option>
                  <option value="Finance" ${i.category==="Finance"?"selected":""}>Finance</option>
                  <option value="Operations" ${i.category==="Operations"?"selected":""}>Operations</option>
                </select>
              </div>

              <div class="form-group">
                <label for="form-priority">Priority *</label>
                <select id="form-priority">
                  <option value="Low" ${i.priority==="Low"?"selected":""}>Low</option>
                  <option value="Medium" ${i.priority==="Medium"?"selected":""}>Medium</option>
                  <option value="High" ${i.priority==="High"?"selected":""}>High</option>
                  <option value="Urgent" ${i.priority==="Urgent"?"selected":""}>Urgent</option>
                </select>
              </div>
            </div>

            <!-- Status & Lead Row -->
            <div class="form-row">
              <div class="form-group">
                <label for="form-status">Status *</label>
                <select id="form-status">
                  <option value="Backlog" ${i.status==="Backlog"?"selected":""}>Backlog</option>
                  <option value="To Do" ${i.status==="To Do"?"selected":""}>To Do</option>
                  <option value="In Progress" ${i.status==="In Progress"?"selected":""}>In Progress</option>
                  <option value="Under Review" ${i.status==="Under Review"?"selected":""}>Under Review</option>
                  <option value="Completed" ${i.status==="Completed"?"selected":""}>Completed</option>
                </select>
              </div>

              <div class="form-group">
                <label for="form-lead">Assigned Lead</label>
                <input type="text" id="form-lead" value="${i.lead||""}" placeholder="e.g. Manveer Singh" />
              </div>
            </div>

            <!-- Due Date & Estimated Hours Row -->
            <div class="form-row">
              <div class="form-group">
                <label for="form-due-date">Target Due Date</label>
                <input type="date" id="form-due-date" value="${i.dueDate||""}" />
              </div>

              <div class="form-group">
                <label for="form-hours">Estimated Hours</label>
                <input type="number" id="form-hours" min="0" value="${i.estimatedHours||0}" />
                <span class="error-text" id="err-hours"></span>
              </div>
            </div>

            <!-- Tags -->
            <div class="form-group">
              <label for="form-tags">Tags (comma separated)</label>
              <input type="text" id="form-tags" value="${(i.tags||[]).join(", ")}" placeholder="e.g. Backend, API, Performance" />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="btn-cancel-modal">Cancel</button>
            <button type="submit" class="btn btn-primary">${a?"Save Changes":"Create Operation"}</button>
          </div>
        </form>
      </div>
    </div>
  `;const l=s.querySelector("#task-modal-overlay"),v=s.querySelector("#btn-close-modal"),u=s.querySelector("#btn-cancel-modal"),h=s.querySelector("#task-form"),m=()=>n.closeTaskModal();v&&v.addEventListener("click",m),u&&u.addEventListener("click",m),l&&l.addEventListener("click",c=>{c.target===l&&m()}),h&&h.addEventListener("submit",c=>{c.preventDefault();const p=s.querySelector("#form-tags").value,b=p?p.split(",").map(M=>M.trim()).filter(Boolean):[],f={title:s.querySelector("#form-title").value,description:s.querySelector("#form-description").value,category:s.querySelector("#form-category").value,priority:s.querySelector("#form-priority").value,status:s.querySelector("#form-status").value,lead:s.querySelector("#form-lead").value,dueDate:s.querySelector("#form-due-date").value,estimatedHours:Number(s.querySelector("#form-hours").value)||0,tags:b},d=P(f);if(!d.isValid){d.errors.title&&(s.querySelector("#err-title").innerText=d.errors.title),d.errors.estimatedHours&&(s.querySelector("#err-hours").innerText=d.errors.estimatedHours);return}a&&r?n.updateTask({...r,...f}):n.addTask({id:R(),...f,archived:!1,createdAt:new Date().toISOString()}),m()})}function W(s){var a,r,o,i;const{confirmModalState:e}=n.getState();if(!e.isOpen){s.innerHTML="";return}s.innerHTML=`
    <div class="modal-overlay active" id="confirm-modal-overlay">
      <div class="modal-content animate-fade-in" style="max-width: 440px;">
        <div class="modal-header" style="border-bottom-color: rgba(239, 68, 68, 0.2);">
          <h3 style="color: #ef4444;">${e.title||"Confirm Action"}</h3>
          <button class="btn btn-icon btn-sm" id="btn-close-confirm">✕</button>
        </div>

        <div class="modal-body">
          <p style="color: var(--text-secondary); font-size: 0.95rem;">
            ${e.message||"Are you sure you want to proceed with this operation?"}
          </p>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="btn-cancel-confirm">Cancel</button>
          <button type="button" class="btn btn-danger" id="btn-execute-confirm">Confirm Delete</button>
        </div>
      </div>
    </div>
  `;const t=()=>n.closeConfirmModal();(a=s.querySelector("#btn-close-confirm"))==null||a.addEventListener("click",t),(r=s.querySelector("#btn-cancel-confirm"))==null||r.addEventListener("click",t),(o=s.querySelector("#confirm-modal-overlay"))==null||o.addEventListener("click",l=>{l.target.id==="confirm-modal-overlay"&&t()}),(i=s.querySelector("#btn-execute-confirm"))==null||i.addEventListener("click",()=>{e.actionType==="delete_perm"&&e.targetId&&n.deleteTaskPermanently(e.targetId),t()})}function Q(s){const{toasts:e}=n.getState();s.innerHTML=`
    <div class="toast-container">
      ${e.map(t=>`
        <div class="toast toast-${t.type} animate-slide-right">
          <div class="flex items-center gap-2">
            <span>${X(t.type)}</span>
            <span style="font-size: 0.9rem; font-weight: 500;">${t.message}</span>
          </div>
          <button class="btn btn-icon btn-sm btn-dismiss-toast" data-id="${t.id}" style="width: 24px; height: 24px;">✕</button>
        </div>
      `).join("")}
    </div>
  `,s.querySelectorAll(".btn-dismiss-toast").forEach(t=>{t.addEventListener("click",()=>{const a=Number(t.getAttribute("data-id"));n.removeToast(a)})})}function X(s){switch(s){case"success":return"✓";case"error":return"✕";default:return"ℹ"}}class Y{constructor(){this.initDOMReferences(),this.subscribeToStore(),this.render()}initDOMReferences(){this.headerContainer=document.getElementById("header-container"),this.sidebarContainer=document.getElementById("sidebar-container"),this.statsContainer=document.getElementById("stats-container"),this.filterBarContainer=document.getElementById("filter-bar-container"),this.mainViewContainer=document.getElementById("main-view-container"),this.taskModalContainer=document.getElementById("task-modal-container"),this.confirmModalContainer=document.getElementById("confirm-modal-container"),this.toastContainer=document.getElementById("toast-container")}subscribeToStore(){n.subscribe(()=>{this.render()})}render(){const e=n.getState();switch(I(this.headerContainer),q(this.sidebarContainer),V(this.statsContainer),e.currentView==="analytics"?this.filterBarContainer.style.display="none":(this.filterBarContainer.style.display="block",z(this.filterBarContainer)),e.currentView){case"kanban":G(this.mainViewContainer);break;case"analytics":J(this.mainViewContainer);break;case"grid":case"table":case"archive":default:U(this.mainViewContainer);break}K(this.taskModalContainer),W(this.confirmModalContainer),Q(this.toastContainer)}}document.addEventListener("DOMContentLoaded",()=>{new Y});
//# sourceMappingURL=index-Bl2ogN7Z.js.map
