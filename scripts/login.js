// تهيئة الحسابات الافتراضية
initializeDefaultUsers();

// معالج تسجيل الدخول
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const errorMessage = document.getElementById('errorMessage');
  
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const code = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      
      if (!code || !password) {
        errorMessage.textContent = 'الرجاء إدخال كود العامل وكلمة المرور';
        errorMessage.style.display = 'block';
        return;
      }
      
      // محاولة تسجيل الدخول
      const result = auth.login(code, password);
      
      if (result.success) {
        // نجح تسجيل الدخول
        errorMessage.style.display = 'none';
        window.location.href = 'dashboard.html';
      } else {
        // فشل تسجيل الدخول
        errorMessage.textContent = result.message || 'كود العامل أو كلمة المرور غير صحيحة';
        errorMessage.style.display = 'block';
        
        // إخفاء الرسالة بعد 5 ثوان
        setTimeout(() => {
          errorMessage.style.display = 'none';
        }, 5000);
      }
    });
  }
  
  // تحديث قائمة الحسابات التجريبية
  updateDemoAccounts();
});

function updateDemoAccounts() {
  const users = Storage.get('users') || [];
  const demoAccounts = document.querySelector('.demo-list');
  
  if (demoAccounts && users.length > 0) {
    demoAccounts.innerHTML = users.map(user => {
      const roleName = user.role === 'مدير' ? 'Manager' : 
                      user.role === 'عامل مخزن' ? 'Warehouse Worker' : 
                      user.role === 'موظف خارجي' ? 'External Employee' : 'Employee';
      return `
        <div class="demo-item">
          <strong>${roleName}:</strong> code ${user.code} / pass ${user.password}
        </div>
      `;
    }).join('');
  }
}
