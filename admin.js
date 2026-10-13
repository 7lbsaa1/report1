import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCk9l8XNO4y-6qnaOqKsfAKQPbaemOOHrU",
    authDomain: "students-d06e7.firebaseapp.com",
    databaseURL: "https://students-d06e7-default-rtdb.firebaseio.com",
    projectId: "students-d06e7",
    storageBucket: "students-d06e7.firebasestorage.app",
    messagingSenderId: "932035308750",
    appId: "1:932035308750:web:781364ca90256bca80749f",
    measurementId: "G-6VBEFTCHVG"
};

// تهيئة الفايربيز
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allReports = [];
let currentFilter = 'all';
let currentReportId = null;

// التشغيل الفوري عند فتح الصفحة بدون مصادقة أو تسجيل دخول
document.addEventListener('DOMContentLoaded', () => {
    fetchReports();
});

// جلب البلاغات فوراً من قاعدة البيانات
async function fetchReports() {
    try {
        const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        allReports = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        }));
        renderDashboard();
    } catch (error) {
        console.error("خطأ في جلب البلاغات:", error);
        document.getElementById('reportsTableBody').innerHTML = `
            <tr><td colspan="5" class="p-8 text-center text-red-500 font-bold">تعذر الاتصال بقاعدة البيانات. تأكد من إعدادات الفايربيز.</td></tr>
        `;
    }
}

// عرض البيانات وتصفيتها
function renderDashboard() {
    const searchVal = document.getElementById('searchInput').value.toLowerCase();

    // تحديث الإحصائيات
    document.getElementById('statTotal').innerText = allReports.length;
    document.getElementById('statNew').innerText = allReports.filter(r => r.status === 'new' || !r.status).length;
    document.getElementById('statProgress').innerText = allReports.filter(r => r.status === 'in_progress').length;
    document.getElementById('statResolved').innerText = allReports.filter(r => r.status === 'resolved').length;
    document.getElementById('statRejected').innerText = allReports.filter(r => r.status === 'rejected').length;

    // تصفية البلاغات حسب البحث والحالة
    const filtered = allReports.filter(r => {
        const matchesStatus = currentFilter === 'all' || r.status === currentFilter;
        const matchesSearch = (r.name && r.name.toLowerCase().includes(searchVal)) || 
                              (r.phone && r.phone.includes(searchVal)) || 
                              (r.email && r.email.toLowerCase().includes(searchVal));
        return matchesStatus && matchesSearch;
    });

    const tbody = document.getElementById('reportsTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400">لا توجد بلاغات مطابقة حالياً.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(r => `
        <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="p-4 font-bold text-slate-800">${r.name || 'بدون اسم'}</td>
            <td class="p-4 text-slate-600">${r.phone || r.email || 'غير متوفر'}</td>
            <td class="p-4 text-slate-600 truncate max-w-xs">${r.description || ''}</td>
            <td class="p-4">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    r.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                    r.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                    r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }">
                    ${r.status === 'resolved' ? 'تم الحل' : r.status === 'in_progress' ? 'قيد المراجعة' : r.status === 'rejected' ? 'مرفوض' : 'جديد'}
                </span>
            </td>
            <td class="p-4">
                <button onclick="window.openDetails('${r.id}')" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl font-bold transition-colors">عرض التفاصيل</button>
            </td>
        </tr>
    `).join('');
}

// تغيير تصفية الحالة
window.filterStatus = function(status) {
    currentFilter = status;
    ['all', 'new', 'in_progress', 'resolved', 'rejected'].forEach(s => {
        const btn = document.getElementById(`btn-${s}`);
        if (s === status) {
            btn.className = "w-full text-right px-4 py-2.5 rounded-xl bg-blue-600 text-white transition-colors";
        } else {
            btn.className = "w-full text-right px-4 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors";
        }
    });
    renderDashboard();
};

document.getElementById('searchInput').addEventListener('input', renderDashboard);

// فتح نافذة تفاصيل البلاغ
window.openDetails = function(id) {
    const report = allReports.find(r => r.id === id);
    if (!report) return;
    currentReportId = id;

    document.getElementById('modalTitle').innerText = `تفاصيل البلاغ #${id.slice(0, 6)}`;
    document.getElementById('modalName').innerText = report.name || 'بدون اسم';
    document.getElementById('modalPhone').innerText = report.phone || 'غير متوفر';
    document.getElementById('modalEmail').innerText = report.email || 'غير متوفر';
    document.getElementById('modalDesc').innerText = report.description || '';

    const userImgWrap = document.getElementById('userImgWrap');
    const issueImgWrap = document.getElementById('issueImgWrap');

    if (report.userImage) {
        document.getElementById('modalUserImg').src = report.userImage;
        userImgWrap.classList.remove('hidden');
    } else {
        userImgWrap.classList.add('hidden');
    }

    if (report.issueImage) {
        document.getElementById('modalIssueImg').src = report.issueImage;
        issueImgWrap.classList.remove('hidden');
    } else {
        issueImgWrap.classList.add('hidden');
    }

    document.getElementById('detailsModal').classList.remove('hidden');
};

window.closeModal = function() {
    document.getElementById('detailsModal').classList.add('hidden');
    currentReportId = null;
};

// تحديث حالة البلاغ مباشرة
window.updateStatus = async function(newStatus) {
    if (!currentReportId) return;
    try {
        await updateDoc(doc(db, "reports", currentReportId), { status: newStatus });
        allReports = allReports.map(r => r.id === currentReportId ? { ...r, status: newStatus } : r);
        renderDashboard();
        closeModal();
    } catch (err) {
        alert("فشل تحديث حالة البلاغ.");
    }
};

// حذف البلاغ نهائياً
window.deleteCurrentReport = async function() {
    if (!currentReportId || !confirm("هل أنت متأكد من حذف هذا البلاغ نهائياً؟")) return;
    try {
        await deleteDoc(doc(db, "reports", currentReportId));
        allReports = allReports.filter(r => r.id !== currentReportId);
        renderDashboard();
        closeModal();
    } catch (err) {
        alert("فشل حذف البلاغ.");
    }
};
