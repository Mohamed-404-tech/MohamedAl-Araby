// نظام التحقق من المستخدمين وتسجيل الدخول
const auth = {
  // الحصول على المستخدم الحالي
  getCurrentUser: () => {
    const user = Storage.get('currentUser');
    return user;
  },

  // حفظ المستخدم الحالي
  setCurrentUser: (user) => {
    // إزالة كلمة المرور قبل الحفظ
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    Storage.set('currentUser', userWithoutPassword);
    return true;
  },

  // تسجيل الخروج
  logout: () => {
    Storage.remove('currentUser');
    window.location.href = '/index.html';
  },

  // تسجيل الدخول
  login: (code, password) => {
    const users = Storage.get('users') || initializeDefaultUsers();
    
    // البحث عن المستخدم بالكود
    const user = users.find(u => u.code === code.toString());
    
    if (!user) {
      return {
        success: false,
        message: 'كود العامل غير صحيح'
      };
    }

    if (user.password !== password) {
      return {
        success: false,
        message: 'كلمة المرور غير صحيحة'
      };
    }

    // حفظ المستخدم الحالي
    auth.setCurrentUser(user);

    return {
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: user
    };
  },

  // التحقق من الصلاحيات
  hasPermission: (permission) => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser || !currentUser.permissions) {
      return false;
    }
    
    // المدير له كل الصلاحيات
    if (currentUser.role === 'مدير') {
      return true;
    }
    
    return currentUser.permissions[permission] === true;
  },

  // التحقق من الدور
  hasRole: (role) => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      return false;
    }
    return currentUser.role === role;
  },

  // التحقق من تسجيل الدخول
  isAuthenticated: () => {
    const user = auth.getCurrentUser();
    return user !== null && user !== undefined;
  },

  // التحقق من الوصول للصفحة (يجب استدعائه في كل صفحة)
  requireAuth: () => {
    if (!auth.isAuthenticated()) {
      window.location.href = '/index.html';
      return false;
    }
    return true;
  },

  // التحقق من الصلاحية للصفحة
  requirePermission: (permission) => {
    if (!auth.requireAuth()) {
      return false;
    }
    
    if (!auth.hasPermission(permission)) {
      alert('ليس لديك صلاحية للوصول إلى هذه الصفحة');
      window.location.href = '/dashboard.html';
      return false;
    }
    
    return true;
  },

  // التحقق من الدور للصفحة
  requireRole: (role) => {
    if (!auth.requireAuth()) {
      return false;
    }
    
    if (!auth.hasRole(role)) {
      alert('ليس لديك صلاحية للوصول إلى هذه الصفحة');
      window.location.href = '/dashboard.html';
      return false;
    }
    
    return true;
  }
};

// تهيئة عند تحميل الصفحة
if (typeof window !== 'undefined') {
  // تحديث معلومات المستخدم في الصفحات التي تحتاجها
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = auth.getCurrentUser();
    
    if (currentUser) {
      // تحديث اسم المستخدم في الـ sidebar
      const userNameElement = document.getElementById('userName');
      if (userNameElement) {
        userNameElement.textContent = currentUser.name || 'مستخدم';
      }
      
      // تحديث دور المستخدم
      const userRoleElement = document.getElementById('userRole');
      if (userRoleElement) {
        userRoleElement.textContent = currentUser.role || 'مستخدم';
      }
      
      // إظهار/إخفاء روابط الصلاحيات
      if (auth.hasPermission('viewUsers')) {
        const usersLink = document.getElementById('usersLink');
        if (usersLink) {
          usersLink.style.display = 'block';
        }
      }
      
      if (auth.hasPermission('managePermissions')) {
        const permissionsLink = document.getElementById('permissionsLink');
        if (permissionsLink) {
          permissionsLink.style.display = 'block';
        }
      }
      
      // إضافة حدث تسجيل الخروج
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
            auth.logout();
          }
        });
      }
    }
  });
}
