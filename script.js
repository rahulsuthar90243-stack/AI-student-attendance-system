// Sample data
const initialStudents = [
    // Updated initial data to reflect 'Course'
    { id: '101', name: 'Alok Sharma', course: 'BCA' },
    { id: '102', name: 'Bhavna Kumari', course: 'B.Com' },
    { id: '103', name: 'Chirag Gupta', course: 'B.Tech' }
];

let students = JSON.parse(localStorage.getItem('students'));
// Agar students local storage mein nahi hain, toh initial data load karo
if (!students || students.length === 0) {
    students = initialStudents;
    localStorage.setItem('students', JSON.stringify(students));
} else {
    // Agar students pehle se hain, toh unki 'class' property ko 'course' mein badal do (compatibility ke liye)
    students = students.map(s => {
        if (s.class && !s.course) {
            s.course = s.class;
            delete s.class;
        }
        return s;
    });
    localStorage.setItem('students', JSON.stringify(students));
}

let attendance = JSON.parse(localStorage.getItem('attendance')) || {};

// DOM elements
const studentForm = document.getElementById('studentForm');
const studentsTable = document.getElementById('studentsTable').querySelector('tbody');
const attendanceTable = document.getElementById('attendanceTable').querySelector('tbody');
const reportsTable = document.getElementById('reportsTable').querySelector('tbody');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const absenceAlert = document.getElementById('absenceAlert');
const alertMessage = document.getElementById('alertMessage');

// Dashboard elements
const totalStudentsEl = document.getElementById('totalStudents');
const presentTodayEl = document.getElementById('presentToday');
const attendanceRateEl = document.getElementById('attendanceRate');
const todayDateEl = document.getElementById('todayDate');
const currentDateEl = document.getElementById('currentDate');

// 💡 FIX: Filter element IDs ko 'course' ke mutabik update kiya
const courseFilter = document.getElementById('courseFilter'); 
const reportCourseFilter = document.getElementById('reportCourse'); 


// Initialize the app
function init() {
    // Set today's date
    const today = new Date();
    const formattedDate = formatDate(today);
    todayDateEl.textContent = formattedDate;
    currentDateEl.textContent = `Date: ${formattedDate}`;
    
    // Update dashboard
    updateDashboard();
    
    // Render students table (Initial view)
    renderStudentsTable();
    
    // Set up event listeners
    setupEventListeners();
}

// Format date as DD/MM/YYYY
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Update dashboard statistics
function updateDashboard() {
    totalStudentsEl.textContent = students.length;
    
    const today = formatDate(new Date());
    let presentCount = 0;
    
    if (attendance[today]) {
        presentCount = Object.values(attendance[today]).filter(status => status === 'present').length;
    }
    
    presentTodayEl.textContent = presentCount;
    
    const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;
    attendanceRateEl.textContent = `${attendanceRate}%`;
}

// Save students to localStorage
function saveStudents() {
    localStorage.setItem('students', JSON.stringify(students));
}

// Save attendance to localStorage
function saveAttendance() {
    localStorage.setItem('attendance', JSON.stringify(attendance));
}

// --- STUDENT MANAGEMENT FUNCTIONS ---
function renderStudentsTable() {
    studentsTable.innerHTML = '';
    
    students.forEach(student => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${student.id}</td>
            <td>
                <div class="student-info">
                    <div class="student-avatar">${student.name.charAt(0)}</div>
                    ${student.name}
                </div>
            </td>
            <td>${student.course}</td>
            <td>
                <button class="action-btn btn-warning edit-btn" data-id="${student.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="action-btn btn-danger delete-btn" data-id="${student.id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        
        studentsTable.appendChild(row);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const studentId = this.getAttribute('data-id');
            editStudent(studentId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const studentId = this.getAttribute('data-id');
            deleteStudent(studentId);
        });
    });
}

function addStudent(studentId, studentName, studentCourse) {
    // ID uniqueness check
    if (students.some(s => s.id === studentId)) {
        alert(`Student with ID ${studentId} already exists! Please use the Edit function if you intended to update.`);
        return;
    }
    // 💡 FIX: studentCourse variable use kiya
    const newStudent = { id: studentId, name: studentName, course: studentCourse }; 
    students.push(newStudent);
    saveStudents();
    renderStudentsTable();
    updateDashboard();
    studentForm.reset();
}

function editStudent(studentId) {
    const student = students.find(s => s.id === studentId);
    if (student) {
        // Remove the student from the list first (prepares for update on form submit)
        students = students.filter(s => s.id !== studentId);
        saveStudents();
        renderStudentsTable();
        
        document.getElementById('studentId').value = student.id;
        document.getElementById('studentName').value = student.name;
        // 💡 FIX: studentCourse ID use kiya
        document.getElementById('studentCourse').value = student.course; 
        document.querySelector('#studentForm button[type="submit"]').textContent = 'Update Student';
        
        alert('Student data loaded for editing. Click "Update Student" to save changes or re-add the student.');
    }
}

function deleteStudent(studentId) {
    if (confirm('Are you sure you want to delete this student?')) {
        students = students.filter(s => s.id !== studentId);
        saveStudents();
        renderStudentsTable();
        updateDashboard();
    }
}

// --- ATTENDANCE FUNCTIONS ---

function calculateConsecutiveAbsences(studentId) {
    let consecutive = 0;
    const dates = Object.keys(attendance).sort((a, b) => {
        const datePartsA = a.split('/');
        const dateA = new Date(`${datePartsA[2]}-${datePartsA[1]}-${datePartsA[0]}`);
        const datePartsB = b.split('/');
        const dateB = new Date(`${datePartsB[2]}-${datePartsB[1]}-${datePartsB[0]}`);
        return dateB - dateA; // Descending sort (newest first)
    });
    
    for (let date of dates) {
        if (attendance[date] && attendance[date][studentId] === 'absent') {
            consecutive++;
        } else {
            break;
        }
    }
    return consecutive;
}

function updateAttendanceStatus(studentId, status) {
    const today = formatDate(new Date());
    
    if (!attendance[today]) {
        attendance[today] = {};
    }
    
    attendance[today][studentId] = status;
    saveAttendance();
    updateDashboard();
}

function markAttendanceBulk(status) {
    const today = formatDate(new Date());
    const courseFilterValue = courseFilter.value; // 💡 FIX: courseFilter use kiya
    
    if (!attendance[today]) {
        attendance[today] = {};
    }
    
    let filteredStudents = students;
    if (courseFilterValue && courseFilterValue !== 'all') {
        // 💡 FIX: student.course property use kiya
        filteredStudents = students.filter(student => student.course === courseFilterValue); 
    }
    
    filteredStudents.forEach(student => {
        attendance[today][student.id] = status;
    });
    
    saveAttendance();
    renderAttendanceTable(); 
    updateDashboard();
    
    // Update the dropdowns in the UI immediately
    document.querySelectorAll('.attendance-status').forEach(select => {
        const studentId = select.getAttribute('data-id');
        if (filteredStudents.some(s => s.id === studentId)) {
            select.value = status;
        }
    });
}

function renderAttendanceTable() {
    attendanceTable.innerHTML = '';
    const today = formatDate(new Date());
    const courseFilterValue = courseFilter.value; // 💡 FIX: courseFilter use kiya
    
    let filteredStudents = students;
    if (courseFilterValue && courseFilterValue !== 'all') {
        // 💡 FIX: student.course property use kiya
        filteredStudents = students.filter(student => student.course === courseFilterValue); 
    }
    
    let studentsWithThreeConsecutiveAbsences = [];
    
    filteredStudents.forEach(student => {
        const currentStatus = (attendance[today] && attendance[today][student.id]) || 'absent';
        const isPresent = currentStatus === 'present';
        const consecutiveAbsences = calculateConsecutiveAbsences(student.id);
        
        if (consecutiveAbsences >= 3) {
            studentsWithThreeConsecutiveAbsences.push(student.name);
        }
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${student.id}</td>
            <td>
                <div class="student-info">
                    <div class="student-avatar">${student.name.charAt(0)}</div>
                    ${student.name}
                </div>
            </td>
            <td>${student.course}</td>
            <td>
                <select class="attendance-status" data-id="${student.id}">
                    <option value="present" ${isPresent ? 'selected' : ''}>Present</option>
                    <option value="absent" ${!isPresent ? 'selected' : ''}>Absent</option>
                </select>
            </td>
            <td>
                <span class="${consecutiveAbsences >= 3 ? 'absent' : ''}">
                    ${consecutiveAbsences} days
                    ${consecutiveAbsences >= 3 ? ' <i class="fas fa-exclamation-triangle"></i>' : ''}
                </span>
            </td>
        `;
        
        attendanceTable.appendChild(row);
    });
    
    // Show/Hide alert
    if (studentsWithThreeConsecutiveAbsences.length > 0) {
        absenceAlert.style.display = 'flex';
        alertMessage.textContent = `${studentsWithThreeConsecutiveAbsences.join(', ')} ${
            studentsWithThreeConsecutiveAbsences.length === 1 ? 'has' : 'have'
        } been absent for 3 consecutive days.`;
    } else {
        absenceAlert.style.display = 'none';
    }
    
    // Re-attach event listeners for status change after re-render
    document.querySelectorAll('.attendance-status').forEach(select => {
        select.addEventListener('change', function() {
            const studentId = this.getAttribute('data-id');
            updateAttendanceStatus(studentId, this.value);
        });
    });
}


// --- REPORTS FUNCTIONS ---

function renderReportsTable() {
    reportsTable.innerHTML = '';
    const courseFilterValue = reportCourseFilter.value; // 💡 FIX: reportCourseFilter use kiya
    
    let filteredStudents = students;
    if (courseFilterValue && courseFilterValue !== 'all') {
        // 💡 FIX: student.course property use kiya
        filteredStudents = students.filter(student => student.course === courseFilterValue); 
    }
    
    filteredStudents.forEach(student => {
        let presentDays = 0;
        let absentDays = 0;
        
        // Calculate attendance stats
        Object.values(attendance).forEach(day => {
            if (day[student.id] === 'present') {
                presentDays++;
            } else if (day[student.id] === 'absent') {
                absentDays++;
            }
        });
        
        const totalDays = presentDays + absentDays;
        const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
        const consecutiveAbsences = calculateConsecutiveAbsences(student.id);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.id}</td>
            <td>
                <div class="student-info">
                    <div class="student-avatar">${student.name.charAt(0)}</div>
                    ${student.name}
                </div>
            </td>
            <td>${student.course}</td>
            <td>${presentDays}</td>
            <td>${absentDays}</td>
            <td>
                <span class="${attendancePercentage >= 80 ? 'present' : 'absent'}">
                    ${attendancePercentage}%
                </span>
            </td>
            <td>
                ${consecutiveAbsences >= 3 ? 
                    '<span class="absent"><i class="fas fa-exclamation-triangle"></i> 3+ Consecutive Absences</span>' : 
                    '<span class="present">Good</span>'
                }
            </td>
        `;
        
        reportsTable.appendChild(row);
    });
}


// --- EVENT LISTENERS ---

function setupEventListeners() {
    // Tab switching logic
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // Render appropriate content on tab switch
            if (tabId === 'attendance') {
                renderAttendanceTable(); 
            } else if (tabId === 'reports') {
                renderReportsTable(); 
            }
        });
    });
    
    // Student form submission
    studentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const studentId = document.getElementById('studentId').value;
        const studentName = document.getElementById('studentName').value;
        // 💡 FIX: studentCourse ID se value li
        const studentCourse = document.getElementById('studentCourse').value; 
        
        addStudent(studentId, studentName, studentCourse);
        
        document.querySelector('#studentForm button[type="submit"]').textContent = 'Add Student';
    });
    
    // Course filter for attendance
    courseFilter.addEventListener('change', function() {
        renderAttendanceTable();
    });
    
    // Report course filter
    reportCourseFilter.addEventListener('change', function() {
        renderReportsTable();
    });
    
    // Mark All Present
    document.getElementById('markAllPresent').addEventListener('click', function() {
        markAttendanceBulk('present');
    });
    
    // Mark All Absent
    document.getElementById('markAllAbsent').addEventListener('click', function() {
        markAttendanceBulk('absent');
    });
    
    // Save Attendance
    document.getElementById('saveAttendance').addEventListener('click', function() {
        saveAttendance();
        alert('Attendance saved successfully for today!');
        updateDashboard();
        
        // Saving attendance might change the attendance rate, so re-render reports if open
        if (document.getElementById('reports-tab').classList.contains('active')) {
             renderReportsTable();
        }
    });
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', init);