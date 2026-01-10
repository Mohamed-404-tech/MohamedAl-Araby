// نظام إدارة الصلاحيات
function initPermissionsPage() {
  // التحقق من الصلاحية
  if (!auth.hasPermission('managePermissions')) {
    alert('ليس لديك صلاحية للوصول إلى هذه الصفحة');
    window.location.href = 'dashboard.html';
    return;
  }
  
  loadUsersPermissions();
}

// تحميل صلاحيات المستخدمين
function loadUsersPermissions() {
  const users = UsersManager.getAllUsers();
  const container = document.getElementById('usersPermissionsList');
  
  if (!container) return;
  
  if (users.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <path d="M9 12l2 2 4-4"></path>
          </svg>
        </div>
        <h3>لا يوجد مستخدمين</h3>
        <p>ابدأ بإضافة مستخدمين أولاً</p>
      </div>
    `;
    return;
  }
  
  // الحصول على معرف المستخدم من URL إن وجد
  const urlParams = new URLSearchParams(window.location.search);
  const selectedUserId = urlParams.get('userId');
  
  container.innerHTML = users.map(user => {
    const isExpanded = selectedUserId === user.id;
    const userWithPassword = UsersManager.getUserById(user.id);
    const permissions = userWithPassword ? userWithPassword.permissions : {};
    
    return `
      <div class="card" style="margin-bottom: 16px;">
        <div class="card-header" style="cursor: pointer;" onclick="toggleUserPermissions('${user.id}')">
          <div>
            <h3 style="margin: 0; display: inline-block;">${user.name}</h3>
            <span class="badge badge-primary" style="margin-right: 12px;">${user.role}</span>
            <span style="color: var(--color-text-secondary); font-size: 14px;">كود: ${user.code}</span>
          </div>
          <svg id="icon-${user.id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; transition: transform 0.3s; ${isExpanded ? 'transform: rotate(180deg);' : ''}">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        <div id="permissions-${user.id}" style="display: ${isExpanded ? 'block' : 'none'}; padding-top: 16px;">
          ${renderPermissionsForm(user.id, permissions)}
        </div>
      </div>
    `;
  }).join('');
  
  // فتح المستخدم المحدد تلقائياً
  if (selectedUserId) {
    const permissionsDiv = document.getElementById(`permissions-${selectedUserId}`);
    if (permissionsDiv) {
      permissionsDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

// إظهار/إخفاء صلاحيات مستخدم
function toggleUserPermissions(userId) {
  const permissionsDiv = document.getElementById(`permissions-${userId}`);
  const icon = document.getElementById(`icon-${userId}`);
  
  if (!permissionsDiv || !icon) return;
  
  const isVisible = permissionsDiv.style.display !== 'none';
  permissionsDiv.style.display = isVisible ? 'none' : 'block';
  icon.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
}

// عرض نموذج الصلاحيات
function renderPermissionsForm(userId, permissions) {
  const permissionGroups = [
    {
      title: 'إدارة الأصناف',
      permissions: [
        { key: 'viewProducts', label: 'عرض الأصناف' },
        { key: 'addProducts', label: 'إضافة أصناف' },
        { key: 'editProducts', label: 'تعديل أصناف' },
        { key: 'deleteProducts', label: 'حذف أصناف' }
      ]
    },
    {
      title: 'حركة المخزون',
      permissions: [
        { key: 'viewMovements', label: 'عرض الحركات' },
        { key: 'addMovements', label: 'إضافة حركات' },
        { key: 'editMovements', label: 'تعديل حركات' },
        { key: 'deleteMovements', label: 'حذف حركات' }
      ]
    },
    {
      title: 'التقارير',
      permissions: [
        { key: 'viewReports', label: 'عرض التقارير' },
        { key: 'exportReports', label: 'تصدير التقارير' }
      ]
    },
    {
      title: 'إدارة المستخدمين',
      permissions: [
        { key: 'viewUsers', label: 'عرض المستخدمين' },
        { key: 'addUsers', label: 'إضافة مستخدمين' },
        { key: 'editUsers', label: 'تعديل مستخدمين' },
        { key: 'deleteUsers', label: 'حذف مستخدمين' }
      ]
    },
    {
      title: 'الصلاحيات والإجازات',
      permissions: [
        { key: 'managePermissions', label: 'إدارة الصلاحيات' },
        { key: 'viewVacations', label: 'عرض الإجازات' },
        { key: 'manageVacations', label: 'إدارة الإجازات' }
      ]
    }
  ];
  
  return `
    <form id="permissions-form-${userId}" onsubmit="saveUserPermissions(event, '${userId}')">
      ${permissionGroups.map(group => `
        <div style="margin-bottom: 24px;">
          <h4 style="margin-bottom: 12px; color: var(--color-primary); font-size: 16px;">${group.title}</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
            ${group.permissions.map(perm => `
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px; border-radius: 8px; transition: background 0.2s;" 
                     onmouseover="this.style.background='rgba(139, 92, 246, 0.1)'" 
                     onmouseout="this.style.background='transparent'">
                <input type="checkbox" 
                       name="${perm.key}" 
                       ${permissions[perm.key] ? 'checked' : ''}
                       style="width: 18px; height: 18px; cursor: pointer;">
                <span style="font-size: 14px; font-weight: 500;">${perm.label}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `).join('')}
      
      <div class="form-actions" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--color-border);">
        <button type="submit" class="btn btn-primary">حفظ التغييرات</button>
        <button type="button" class="btn btn-secondary" onclick="resetUserPermissions('${userId}')">إعادة تعيين للافتراضي</button>
      </div>
    </form>
  `;
}

// حفظ صلاحيات مستخدم
function saveUserPermissions(event, userId) {
  event.preventDefault();
  
  if (!auth.hasPermission('managePermissions')) {
    alert('ليس لديك صلاحية لتعديل الصلاحيات');
    return;
  }
  
  const form = document.getElementById(`permissions-form-${userId}`);
  const formData = new FormData(form);
  
  const permissions = {
    viewProducts: formData.has('viewProducts'),
    addProducts: formData.has('addProducts'),
    editProducts: formData.has('editProducts'),
    deleteProducts: formData.has('deleteProducts'),
    viewMovements: formData.has('viewMovements'),
    addMovements: formData.has('addMovements'),
    editMovements: formData.has('editMovements'),
    deleteMovements: formData.has('deleteMovements'),
    viewReports: formData.has('viewReports'),
    exportReports: formData.has('exportReports'),
    viewUsers: formData.has('viewUsers'),
    addUsers: formData.has('addUsers'),
    editUsers: formData.has('editUsers'),
    deleteUsers: formData.has('deleteUsers'),
    managePermissions: formData.has('managePermissions'),
    viewVacations: formData.has('viewVacations'),
    manageVacations: formData.has('manageVacations')
  };
  
  const result = UsersManager.updatePermissions(userId, permissions);
  
  if (result.success) {
    alert('تم تحديث الصلاحيات بنجاح');
    if (typeof showToast === 'function') {
      showToast('تم تحديث الصلاحيات بنجاح', 'success');
    }
    loadUsersPermissions();
  } else {
    alert(result.message);
    if (typeof showToast === 'function') {
      showToast(result.message, 'error');
    }
  }
}

// إعادة تعيين صلاحيات المستخدم للافتراضية
function resetUserPermissions(userId) {
  if (!auth.hasPermission('managePermissions')) {
    alert('ليس لديك صلاحية لتعديل الصلاحيات');
    return;
  }
  
  if (!confirm('هل أنت متأكد من إعادة تعيين صلاحيات هذا المستخدم للقيم الافتراضية؟')) {
    return;
  }
  
  const user = UsersManager.getUserById(userId);
  if (!user) {
    alert('المستخدم غير موجود');
    return;
  }
  
  const defaultPermissions = UsersManager.getDefaultPermissions(user.role);
  const result = UsersManager.updatePermissions(userId, defaultPermissions);
  
  if (result.success) {
    alert('تم إعادة تعيين الصلاحيات بنجاح');
    if (typeof showToast === 'function') {
      showToast('تم إعادة تعيين الصلاحيات بنجاح', 'success');
    }
    loadUsersPermissions();
  } else {
    alert(result.message);
    if (typeof showToast === 'function') {
      showToast(result.message, 'error');
    }
  }
}

// تهيئة عند تحميل الصفحة
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('permissions.html')) {
      auth.requirePermission('managePermissions');
      initPermissionsPage();
    }
  });
}
