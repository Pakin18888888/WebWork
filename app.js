const SUBJECTS = [
    "GDM 330 : GAME DESIGN AND DEVELOPMENT",
    "GDM 321 : GAME ANIMATION",
    "GDM 320 : ADVANCED GAME DESIGN AND DEVELOPMENT",
    "MDT 312 : WEB PROGRAMMING",
    "MDT 311 : DATABASE SYSTEM",
    "MDT 372 : SEMINAR",
    "MMI 320 : MEDICAL INSTRUCTION MEDIA TECHNOLOGY",
    "GEN 351 : MODERN MANAGEMENT AND LEADERSHIP"
];

let tasks = JSON.parse(localStorage.getItem('devPlannerTasks')) || [];
let myChart = null;
let currentFilter = null; // ตัวแปรใหม่: เก็บสถานะว่ากำลังดูวิชาอะไรอยู่

document.addEventListener('DOMContentLoaded', () => {
    initSubjects();
    renderApp();
});

function initSubjects() {
    const select = document.getElementById('inputSubject');
    const sidebar = document.getElementById('sidebarNav');
    
    // เพิ่มปุ่ม "ดูทั้งหมด (All Tasks)" ไว้บนสุด
    sidebar.innerHTML = `
        <a href="#" onclick="filterBySubject(null, this)" class="sidebar-item flex items-center gap-3 text-white bg-gray-800 border border-gray-700 px-4 py-3 rounded-xl transition group font-bold">
            <i class="fa-solid fa-border-all text-gray-400 group-hover:scale-110 transition-transform"></i>
            <span class="text-sm truncate">All Tasks</span>
        </a>
    `;
    
    SUBJECTS.forEach((sub, index) => {
        const subjectCode = sub.split(':')[0].trim();
        
        // ใส่ใน Dropdown
        const option = document.createElement('option');
        option.value = subjectCode;
        option.textContent = sub;
        select.appendChild(option);

        // ใส่ใน Sidebar พร้อมผูกคำสั่ง onclick
        const iconColors = ['text-indigo-400', 'text-pink-400', 'text-emerald-400', 'text-amber-400', 'text-blue-400', 'text-purple-400', 'text-rose-400', 'text-cyan-400'];
        sidebar.innerHTML += `
            <a href="#" onclick="filterBySubject('${subjectCode}', this)" class="sidebar-item flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-3 rounded-xl transition group">
                <i class="fa-solid fa-folder-closed ${iconColors[index % iconColors.length]} group-hover:scale-110 transition-transform"></i>
                <span class="text-sm truncate">${subjectCode}</span>
            </a>
        `;
    });
}

// ฟังก์ชันใหม่: กรองข้อมูลเมื่อคลิกเมนูซ้าย
function filterBySubject(subjectCode, element) {
    currentFilter = subjectCode;
    
    // รีเซ็ตสีปุ่มเมนูทั้งหมดให้เป็นสีเทา
    document.querySelectorAll('.sidebar-item').forEach(el => {
        el.classList.remove('bg-gray-800', 'text-white', 'border', 'border-gray-700', 'font-bold');
        el.classList.add('text-gray-400');
    });

    // ทำให้ปุ่มที่ถูกกดสว่างขึ้น (Active State)
    if (element) {
        element.classList.remove('text-gray-400');
        element.classList.add('bg-gray-800', 'text-white', 'border', 'border-gray-700', 'font-bold');
    }

    renderApp(); // สั่งให้อัปเดตตารางและตัวเลขใหม่
}

function toggleModal(show) {
    const modal = document.getElementById('taskModal');
    if (show) {
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('modal-active'), 10);
    } else {
        modal.classList.remove('modal-active');
        setTimeout(() => modal.classList.add('hidden'), 300);
        document.getElementById('taskForm').reset();
    }
}

document.getElementById('taskForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const newTask = {
        id: Date.now().toString(),
        subject: document.getElementById('inputSubject').value,
        task: document.getElementById('inputTask').value,
        date: document.getElementById('inputDate').value,
        priority: document.getElementById('inputPriority').value,
        status: 'pending'
    };
    tasks.push(newTask);
    saveData();
    toggleModal(false);
    renderApp();
});

function toggleStatus(id) {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if(taskIndex > -1) {
        tasks[taskIndex].status = tasks[taskIndex].status === 'pending' ? 'done' : 'pending';
        saveData();
        renderApp();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveData();
    renderApp();
}

function saveData() {
    localStorage.setItem('devPlannerTasks', JSON.stringify(tasks));
}

function renderApp() {
    const tbody = document.getElementById('taskTableBody');
    tbody.innerHTML = '';
    
    let pendingCount = 0, urgentCount = 0, doneCount = 0;

    // กรองข้อมูลตามวิชาที่เลือก (ถ้าไม่ได้เลือกวิชาไหนเลย จะดึงงานมาทั้งหมด)
    let displayTasks = currentFilter ? tasks.filter(t => t.subject === currentFilter) : tasks;
    
    // เรียงวันที่
    const sortedTasks = [...displayTasks].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedTasks.forEach(t => {
        if (t.status === 'done') doneCount++;
        else {
            pendingCount++;
            if (t.priority === 'Urgent') urgentCount++;
        }

        const isDone = t.status === 'done';
        const row = document.createElement('tr');
        row.className = isDone ? 'opacity-50' : '';
        
        row.innerHTML = `
            <td class="p-4 font-bold ${isDone ? 'line-through text-gray-500' : 'text-indigo-300'}">${t.subject}</td>
            <td class="p-4 ${isDone ? 'line-through text-gray-500' : 'text-gray-200'}">
                ${t.task}
                ${t.priority === 'Urgent' && !isDone ? '<span class="ml-2 text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20">🔥 URGENT</span>' : ''}
            </td>
            <td class="p-4 text-gray-400"><i class="fa-regular fa-calendar mr-2"></i>${t.date}</td>
            <td class="p-4 text-center">
                <span class="badge ${isDone ? 'badge-done' : 'badge-pending'} cursor-pointer" onclick="toggleStatus('${t.id}')">
                    ${isDone ? '<i class="fa-solid fa-check mr-1"></i> Done' : '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Pending'}
                </span>
            </td>
            <td class="p-4 text-center">
                <button onclick="deleteTask('${t.id}')" class="text-gray-500 hover:text-red-400 transition-colors">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    if(displayTasks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-gray-500">No tasks found for this view. 🎮</td></tr>`;
    }

    // อัปเดตตัวเลข 4 กล่องด้านบนตามวิชาที่กำลังดูอยู่
    document.getElementById('statTotal').innerText = displayTasks.length;
    document.getElementById('statPending').innerText = pendingCount;
    document.getElementById('statUrgent').innerText = urgentCount;
    document.getElementById('statDone').innerText = doneCount;

    updateChart();
}

function updateChart() {
    const ctx = document.getElementById('subjectChart').getContext('2d');
    
    // กราฟจะแสดงภาพรวมของ "งานทั้งหมด" เสมอ เพื่อให้เห็นน้ำหนักภาระงานรวม
    const subjectCounts = {};
    tasks.forEach(t => {
        subjectCounts[t.subject] = (subjectCounts[t.subject] || 0) + 1;
    });

    const labels = Object.keys(subjectCounts);
    const data = Object.values(subjectCounts);

    if(myChart) myChart.destroy();

    Chart.defaults.color = '#9CA3AF';
    Chart.defaults.font.family = "'Prompt', sans-serif";

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['No Data'],
            datasets: [{
                data: data.length ? data : [1],
                backgroundColor: data.length ? [
                    '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', 
                    '#F59E0B', '#10B981', '#06B6D4', '#3B82F6'
                ] : ['#374151'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            cutout: '70%',
            plugins: { legend: { display: false } }
        }
    });
}