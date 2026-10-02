// 1. นำ firebaseConfig จาก Firebase Console มาวางที่นี่
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAy7ghFc4cmHznswsGtmc2eVjioPe2Bgxs",
    authDomain: "backend-4d0e8.firebaseapp.com",
    projectId: "backend-4d0e8",
    storageBucket: "backend-4d0e8.firebasestorage.app",
    messagingSenderId: "537273772839",
    appId: "1:537273772839:web:ab74ee71d4ab97e9235702",
    measurementId: "G-JBHXKD4D59"
};

// เริ่มต้น Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

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

let tasks = [];
let myChart = null;
let currentFilter = null;
let currentUser = null; // ตัวแปรเก็บข้อมูลคนที่ล็อกอินอยู่

// ================= ระบบ LOGIN & LOGOUT =================
auth.onAuthStateChanged((user) => {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');

    if (user) {
        // ถ้ามีคน Login ให้ซ่อนหน้า Login แล้วโชว์ App
        currentUser = user;
        document.getElementById('userDisplay').innerText = user.email;
        loginScreen.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            loginScreen.classList.add('hidden');
            mainApp.classList.remove('hidden');
            setTimeout(() => mainApp.classList.remove('opacity-0'), 50);
        }, 500);

        // ดึงข้อมูล "เฉพาะของ User คนนี้" จาก Firestore
        loadTasksFromFirebase();
    } else {
        // ถ้าไม่มีคน Login โชว์หน้า Login
        currentUser = null;
        mainApp.classList.add('opacity-0');
        setTimeout(() => {
            mainApp.classList.add('hidden');
            loginScreen.classList.remove('hidden');
            setTimeout(() => loginScreen.classList.remove('opacity-0', 'pointer-events-none'), 50);
        }, 500);
    }
});

function login() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const errorMsg = document.getElementById('authError');
    auth.signInWithEmailAndPassword(email, pass)
        .catch(error => { errorMsg.innerText = error.message; errorMsg.classList.remove('hidden'); });
}

function register() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const errorMsg = document.getElementById('authError');
    auth.createUserWithEmailAndPassword(email, pass)
        .catch(error => { errorMsg.innerText = error.message; errorMsg.classList.remove('hidden'); });
}

function logout() {
    auth.signOut();
}

// ================= ระบบ DATABASE (ของใครของมัน) =================
document.addEventListener('DOMContentLoaded', () => {
    initSubjects();
});

function loadTasksFromFirebase() {
    // โค้ดพระเอก: ดึงเฉพาะงานที่ userId ตรงกับคนที่ Login
    db.collection("tasks").where("userId", "==", currentUser.uid)
        .onSnapshot((snapshot) => {
            tasks = [];
            snapshot.forEach((doc) => {
                tasks.push({ id: doc.id, ...doc.data() });
            });
            renderApp(); // ได้ข้อมูลปุ๊บ สั่งเรนเดอร์ตารางปั๊บ
        });
}

// เพิ่มงานใหม่ลง Firestore
document.getElementById('taskForm').addEventListener('submit', (e) => {
    e.preventDefault();
    db.collection("tasks").add({
        userId: currentUser.uid, // <--- แปะชื่อเจ้าของงานไว้เสมอ
        subject: document.getElementById('inputSubject').value,
        task: document.getElementById('inputTask').value,
        date: document.getElementById('inputDate').value,
        priority: document.getElementById('inputPriority').value,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    toggleModal(false);
});

// อัปเดตสถานะ (เสร็จ/ไม่เสร็จ)
function toggleStatus(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        db.collection("tasks").doc(id).update({
            status: task.status === 'pending' ? 'done' : 'pending'
        });
    }
}

// ลบงานออกจาก Database
function deleteTask(id) {
    if (confirm("แน่ใจหรือไม่ว่าต้องการลบงานนี้?")) {
        db.collection("tasks").doc(id).delete();
    }
}

// ================= ระบบ UI และ RENDER (เหมือนเดิม) =================
function initSubjects() {
    const select = document.getElementById('inputSubject');
    const sidebar = document.getElementById('sidebarNav');
    sidebar.innerHTML = `
        <a href="#" onclick="filterBySubject(null, this)" class="sidebar-item flex items-center gap-3 text-white bg-gray-800 border border-gray-700 px-4 py-3 rounded-xl transition group font-bold">
            <i class="fa-solid fa-border-all text-gray-400 group-hover:scale-110 transition-transform"></i>
            <span class="text-sm truncate">All Tasks</span>
        </a>
    `;
    SUBJECTS.forEach((sub, index) => {
        const subjectCode = sub.split(':')[0].trim();
        const option = document.createElement('option');
        option.value = subjectCode; option.textContent = sub;
        select.appendChild(option);
        const iconColors = ['text-indigo-400', 'text-pink-400', 'text-emerald-400', 'text-amber-400', 'text-blue-400', 'text-purple-400', 'text-rose-400', 'text-cyan-400'];
        sidebar.innerHTML += `
            <a href="#" onclick="filterBySubject('${subjectCode}', this)" class="sidebar-item flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-3 rounded-xl transition group">
                <i class="fa-solid fa-folder-closed ${iconColors[index % iconColors.length]} group-hover:scale-110 transition-transform"></i>
                <span class="text-sm truncate">${subjectCode}</span>
            </a>
        `;
    });
}

function filterBySubject(subjectCode, element) {
    currentFilter = subjectCode;
    document.querySelectorAll('.sidebar-item').forEach(el => {
        el.classList.remove('bg-gray-800', 'text-white', 'border', 'border-gray-700', 'font-bold');
        el.classList.add('text-gray-400');
    });
    if (element) {
        element.classList.remove('text-gray-400');
        element.classList.add('bg-gray-800', 'text-white', 'border', 'border-gray-700', 'font-bold');
    }
    renderApp();
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

function renderApp() {
    const tbody = document.getElementById('taskTableBody');
    tbody.innerHTML = '';
    let pendingCount = 0, urgentCount = 0, doneCount = 0;

    let displayTasks = currentFilter ? tasks.filter(t => t.subject === currentFilter) : tasks;
    const sortedTasks = [...displayTasks].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedTasks.forEach(t => {
        if (t.status === 'done') doneCount++;
        else { pendingCount++; if (t.priority === 'Urgent') urgentCount++; }

        const isDone = t.status === 'done';
        const row = document.createElement('tr');
        row.className = isDone ? 'opacity-50 hover:bg-gray-800/50 transition' : 'hover:bg-gray-800/80 transition';
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
                <button onclick="deleteTask('${t.id}')" class="text-gray-500 hover:text-red-400 transition-colors"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });

    if (displayTasks.length === 0) tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-gray-500">No tasks found. 🎮</td></tr>`;

    document.getElementById('statTotal').innerText = displayTasks.length;
    document.getElementById('statPending').innerText = pendingCount;
    document.getElementById('statUrgent').innerText = urgentCount;
    document.getElementById('statDone').innerText = doneCount;
    updateChart();
}

function updateChart() {
    const ctx = document.getElementById('subjectChart').getContext('2d');
    const subjectCounts = {};
    tasks.forEach(t => { subjectCounts[t.subject] = (subjectCounts[t.subject] || 0) + 1; });
    const labels = Object.keys(subjectCounts); const data = Object.values(subjectCounts);
    if (myChart) myChart.destroy();
    Chart.defaults.color = '#9CA3AF'; Chart.defaults.font.family = "'Prompt', sans-serif";
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: labels.length ? labels : ['No Data'], datasets: [{ data: data.length ? data : [1], backgroundColor: data.length ? ['#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6'] : ['#374151'], borderWidth: 0, hoverOffset: 4 }] },
        options: { responsive: true, cutout: '70%', plugins: { legend: { display: false } } }
    });
}