// نظام تخزين البيانات
const Storage = {
  // الحصول على البيانات من localStorage
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error getting from storage:', error);
      return null;
    }
  },

  // حفظ البيانات في localStorage
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error saving to storage:', error);
      return false;
    }
  },

  // حذف البيانات
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from storage:', error);
      return false;
    }
  },

  // مسح كل البيانات
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }
};

// تهيئة الحسابات الافتراضية إذا لم تكن موجودة
function initializeDefaultUsers() {
  const users = Storage.get('users');
  
  if (!users || users.length === 0) {
    const defaultUsers = [
      {
        id: '1',
        code: '404',
        name: 'mohamed tarek',
        password: '24112006',
        role: 'مدير',
        email: '',
        permissions: {
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
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        code: '1',
        name: 'عامل المخزن',
        password: '123',
        role: 'عامل مخزن',
        email: '',
        permissions: {
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
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        code: '2',
        name: 'موظف خارجي',
        password: '234',
        role: 'موظف خارجي',
        email: '',
        permissions: {
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
        },
        createdAt: new Date().toISOString()
      }
    ];
    
    Storage.set('users', defaultUsers);
    return defaultUsers;
  }
  
  return users;
}

// تهيئة عند تحميل الملف
if (typeof window !== 'undefined') {
  initializeDefaultUsers();
}
