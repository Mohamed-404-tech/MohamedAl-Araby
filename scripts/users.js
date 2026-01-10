// نظام إدارة المستخدمين
const UsersManager = {
  // الحصول على جميع المستخدمين
  getAllUsers: () => {
    const users = Storage.get('users') || [];
    // إزالة كلمات المرور من القائمة
    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  },

  // الحصول على مستخدم بالمعرف
  getUserById: (id) => {
    const users = Storage.get('users') || [];
    return users.find(u => u.id === id);
  },

  // الحصول على مستخدم بالكود
  getUserByCode: (code) => {
    const users = Storage.get('users') || [];
    return users.find(u => u.code === code.toString());
  },

  // إضافة مستخدم جديد
  addUser: (userData) => {
    const users = Storage.get('users') || [];
    
    // التحقق من أن الكود غير مستخدم
    if (UsersManager.getUserByCode(userData.code)) {
      return {
        success: false,
        message: 'كود العامل مستخدم بالفعل'
      };
    }
    
    // إنشاء معرف فريد
    const newId = Date.now().toString();
    
    const newUser = {
      id: newId,
      code: userData.code.toString(),
      name: userData.name,
      password: userData.password,
      role: userData.role || 'موظف',
      email: userData.email || '',
      permissions: userData.permissions || UsersManager.getDefaultPermissions(userData.role || 'موظف'),
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    Storage.set('users', users);
    
    return {
      success: true,
      message: 'تم إضافة المستخدم بنجاح',
      user: newUser
    };
  },

  // تحديث مستخدم
  updateUser: (id, userData) => {
    const users = Storage.get('users') || [];
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return {
        success: false,
        message: 'المستخدم غير موجود'
      };
    }
    
    // التحقق من أن الكود غير مستخدم من قبل مستخدم آخر
    if (userData.code && userData.code !== users[userIndex].code) {
      if (UsersManager.getUserByCode(userData.code)) {
        return {
          success: false,
          message: 'كود العامل مستخدم بالفعل'
        };
      }
    }
    
    // تحديث البيانات
    const updatedUser = {
      ...users[userIndex],
      ...userData,
      id: users[userIndex].id, // الحفاظ على المعرف
      createdAt: users[userIndex].createdAt // الحفاظ على تاريخ الإنشاء
    };
    
    // تحديث كلمة المرور فقط إذا تم إدخالها
    if (userData.password && userData.password.trim() !== '') {
      updatedUser.password = userData.password;
    } else {
      updatedUser.password = users[userIndex].password; // الاحتفاظ بالباسورد القديم
    }
    
    users[userIndex] = updatedUser;
    Storage.set('users', users);
    
    // إذا كان المستخدم المحدث هو المستخدم الحالي، قم بتحديثه
    const currentUser = auth.getCurrentUser();
    if (currentUser && currentUser.id === id) {
      auth.setCurrentUser(updatedUser);
    }
    
    return {
      success: true,
      message: 'تم تحديث المستخدم بنجاح',
      user: updatedUser
    };
  },

  // حذف مستخدم
  deleteUser: (id) => {
    const users = Storage.get('users') || [];
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return {
        success: false,
        message: 'المستخدم غير موجود'
      };
    }
    
    // منع حذف المستخدم الحالي
    const currentUser = auth.getCurrentUser();
    if (currentUser && currentUser.id === id) {
      return {
        success: false,
        message: 'لا يمكنك حذف حسابك الشخصي'
      };
    }
    
    users.splice(userIndex, 1);
    Storage.set('users', users);
    
    return {
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    };
  },

  // تغيير كلمة المرور
  changePassword: (id, newPassword) => {
    return UsersManager.updateUser(id, { password: newPassword });
  },

  // الحصول على الصلاحيات الافتراضية حسب الدور
  getDefaultPermissions: (role) => {
    const permissions = {
      'مدير': {
        viewProducts: true,
        addProducts: true,
        editProducts: true,
        deleteProducts: true,
        viewMovements: true,
        addMovements: true,
        editMovements: true,
        deleteMovements: true,
        viewReports: true,
        exportReports: true,
        viewUsers: true,
        addUsers: true,
        editUsers: true,
        deleteUsers: true,
        managePermissions: true,
        viewVacations: true,
        manageVacations: true
      },
      'مودير': {
        viewProducts: true,
        addProducts: true,
        editProducts: true,
        deleteProducts: false,
        viewMovements: true,
        addMovements: true,
        editMovements: true,
        deleteMovements: false,
        viewReports: true,
        exportReports: true,
        viewUsers: false,
        addUsers: false,
        editUsers: false,
        deleteUsers: false,
        managePermissions: false,
        viewVacations: true,
        manageVacations: true
      },
      'عامل مخزن': {
        viewProducts: true,
        addProducts: true,
        editProducts: true,
        deleteProducts: false,
        viewMovements: true,
        addMovements: true,
        editMovements: true,
        deleteMovements: false,
        viewReports: true,
        exportReports: false,
        viewUsers: false,
        addUsers: false,
        editUsers: false,
        deleteUsers: false,
        managePermissions: false,
        viewVacations: true,
        manageVacations: false
      },
      'موظف خارجي': {
        viewProducts: true,
        addProducts: false,
        editProducts: false,
        deleteProducts: false,
        viewMovements: true,
        addMovements: false,
        editMovements: false,
        deleteMovements: false,
        viewReports: true,
        exportReports: false,
        viewUsers: false,
        addUsers: false,
        editUsers: false,
        deleteUsers: false,
        managePermissions: false,
        viewVacations: false,
        manageVacations: false
      }
    };
    
    return permissions[role] || permissions['موظف خارجي'];
  },

  // تحديث صلاحيات مستخدم
  updatePermissions: (id, permissions) => {
    const user = UsersManager.getUserById(id);
    if (!user) {
      return {
        success: false,
        message: 'المستخدم غير موجود'
      };
    }
    
    return UsersManager.updateUser(id, { permissions });
  }
};

// تهيئة صفحة إدارة المستخدمين
function initUsersPage() {
  // التحقق من الصلاحية
  if (!auth.hasPermission('viewUsers')) {
    alert('ليس لديك صلاحية للوصول إلى هذه الصفحة');
    window.location.href = 'dashboard.html';
    return;
  }
  
  loadUsersTable();
  setupModal();
}

// تحميل جدول المستخدمين
function loadUsersTable() {
  const users = UsersManager.getAllUsers();
  const tableBody = document.getElementById('usersTableBody');
  
  if (!tableBody) return;
  
  if (users.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px;">
          <div class="empty-state">
            <div class="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3>لا يوجد مستخدمين</h3>
            <p>ابدأ بإضافة مستخدم جديد</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  tableBody.innerHTML = users.map(user => {
    const canEdit = auth.hasPermission('editUsers');
    const canDelete = auth.hasPermission('deleteUsers');
    const currentUser = auth.getCurrentUser();
    const isCurrentUser = currentUser && currentUser.id === user.id;
    
    return `
      <tr>
        <td>${user.code}</td>
        <td><strong>${user.name}</strong></td>
        <td><span class="badge badge-primary">${user.role}</span></td>
        <td>${user.email || '-'}</td>
        <td>
          <div class="action-buttons">
            ${canEdit ? `
              <button class="btn-action edit" onclick="editUser('${user.id}')" title="تعديل">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="btn-action" onclick="changeUserPassword('${user.id}')" title="تغيير كلمة المرور">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </button>
              ${auth.hasPermission('managePermissions') ? `
                <button class="btn-action" onclick="manageUserPermissions('${user.id}')" title="إدارة الصلاحيات">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <path d="M9 12l2 2 4-4"></path>
                  </svg>
                </button>
              ` : ''}
            ` : ''}
            ${canDelete && !isCurrentUser ? `
              <button class="btn-action delete" onclick="deleteUser('${user.id}')" title="حذف">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// إعداد النافذة المنبثقة
function setupModal() {
  const modal = document.getElementById('userModal');
  const addBtn = document.getElementById('addUserBtn');
  const closeBtn = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  const form = document.getElementById('userForm');
  
  if (!modal) return;
  
  // فتح النافذة لإضافة مستخدم جديد
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      if (!auth.hasPermission('addUsers')) {
        alert('ليس لديك صلاحية لإضافة مستخدمين');
        return;
      }
      openUserModal();
    });
  }
  
  // إغلاق النافذة
  if (closeBtn) {
    closeBtn.addEventListener('click', closeUserModal);
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeUserModal);
  }
  
  // إغلاق عند النقر خارج النافذة
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeUserModal();
    }
  });
  
  // معالج إرسال النموذج
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveUser();
    });
  }
}

// فتح نافذة إضافة/تعديل مستخدم
function openUserModal(userId = null) {
  const modal = document.getElementById('userModal');
  const modalTitle = document.getElementById('modalTitle');
  const form = document.getElementById('userForm');
  
  if (!modal) return;
  
  form.reset();
  document.getElementById('userId').value = userId || '';
  
  if (userId) {
    // وضع التعديل
    const user = UsersManager.getUserById(userId);
    if (!user) {
      alert('المستخدم غير موجود');
      return;
    }
    
    modalTitle.textContent = 'تعديل مستخدم';
    document.getElementById('userCode').value = user.code;
    document.getElementById('userName').value = user.name;
    document.getElementById('userRole').value = user.role;
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userPassword').required = false;
    document.getElementById('userPassword').placeholder = 'اتركه فارغاً للاحتفاظ بكلمة المرور الحالية';
  } else {
    // وضع الإضافة
    modalTitle.textContent = 'إضافة مستخدم جديد';
    document.getElementById('userPassword').required = true;
    document.getElementById('userPassword').placeholder = '';
  }
  
  modal.classList.add('active');
}

// إغلاق نافذة المستخدم
function closeUserModal() {
  const modal = document.getElementById('userModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// حفظ المستخدم
function saveUser() {
  const userId = document.getElementById('userId').value;
  const code = document.getElementById('userCode').value.trim();
  const name = document.getElementById('userName').value.trim();
  const password = document.getElementById('userPassword').value;
  const role = document.getElementById('userRole').value;
  const email = document.getElementById('userEmail').value.trim();
  
  // التحقق من البيانات
  if (!code || !name || !role) {
    alert('الرجاء ملء جميع الحقول المطلوبة');
    return;
  }
  
  if (!userId && !password) {
    alert('الرجاء إدخال كلمة مرور');
    return;
  }
  
  const userData = {
    code,
    name,
    role,
    email
  };
  
  if (password && password.trim() !== '') {
    userData.password = password;
  }
  
  let result;
  if (userId) {
    // تحديث مستخدم موجود
    if (!auth.hasPermission('editUsers')) {
      alert('ليس لديك صلاحية لتعديل المستخدمين');
      return;
    }
    result = UsersManager.updateUser(userId, userData);
  } else {
    // إضافة مستخدم جديد
    if (!auth.hasPermission('addUsers')) {
      alert('ليس لديك صلاحية لإضافة مستخدمين');
      return;
    }
    result = UsersManager.addUser(userData);
  }
  
  if (result.success) {
    alert(result.message);
    closeUserModal();
    loadUsersTable();
    if (typeof showToast === 'function') {
      showToast(result.message, 'success');
    }
  } else {
    alert(result.message);
    if (typeof showToast === 'function') {
      showToast(result.message, 'error');
    }
  }
}

// تعديل مستخدم
function editUser(id) {
  if (!auth.hasPermission('editUsers')) {
    alert('ليس لديك صلاحية لتعديل المستخدمين');
    return;
  }
  openUserModal(id);
}

// حذف مستخدم
function deleteUser(id) {
  if (!auth.hasPermission('deleteUsers')) {
    alert('ليس لديك صلاحية لحذف المستخدمين');
    return;
  }
  
  if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
    return;
  }
  
  const result = UsersManager.deleteUser(id);
  
  if (result.success) {
    alert(result.message);
    loadUsersTable();
    if (typeof showToast === 'function') {
      showToast(result.message, 'success');
    }
  } else {
    alert(result.message);
    if (typeof showToast === 'function') {
      showToast(result.message, 'error');
    }
  }
}

// تغيير كلمة مرور مستخدم
function changeUserPassword(id) {
  if (!auth.hasPermission('editUsers')) {
    alert('ليس لديك صلاحية لتعديل كلمات المرور');
    return;
  }
  
  const newPassword = prompt('أدخل كلمة المرور الجديدة:');
  if (!newPassword || newPassword.trim() === '') {
    return;
  }
  
  if (newPassword.length < 3) {
    alert('كلمة المرور يجب أن تكون 3 أحرف على الأقل');
    return;
  }
  
  const result = UsersManager.changePassword(id, newPassword);
  
  if (result.success) {
    alert('تم تغيير كلمة المرور بنجاح');
    if (typeof showToast === 'function') {
      showToast('تم تغيير كلمة المرور بنجاح', 'success');
    }
  } else {
    alert(result.message);
    if (typeof showToast === 'function') {
      showToast(result.message, 'error');
    }
  }
}

// إدارة صلاحيات مستخدم
function manageUserPermissions(id) {
  if (!auth.hasPermission('managePermissions')) {
    alert('ليس لديك صلاحية لإدارة الصلاحيات');
    return;
  }
  
  window.location.href = `permissions.html?userId=${id}`;
}

// تهيئة عند تحميل الصفحة
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('users.html')) {
      auth.requirePermission('viewUsers');
      initUsersPage();
    }
  });
}
