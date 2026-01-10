// نظام التصدير فقط - لا يوجد استيراد لأن الإضافة تتم يدوياً فقط

// دالة مساعدة لتصدير البيانات إلى Excel
function exportToExcel(data, filename = 'export') {
  if (!data || data.length === 0) {
    alert('لا توجد بيانات للتصدير');
    if (typeof showToast === 'function') {
      showToast('لا توجد بيانات للتصدير', 'warning');
    }
    return;
  }

  // إنشاء CSV content
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes in values
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  // إنشاء BOM لـ UTF-8 مع BOM لدعم العربية بشكل صحيح
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // إنشاء رابط تحميل
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  if (typeof showToast === 'function') {
    showToast('تم تصدير الملف بنجاح', 'success');
  }
}

// تصدير الأصناف إلى Excel
function exportProductsToExcel() {
  if (!auth.hasPermission('viewProducts')) {
    alert('ليس لديك صلاحية لعرض الأصناف');
    if (typeof showToast === 'function') {
      showToast('ليس لديك صلاحية لعرض الأصناف', 'error');
    }
    return;
  }

  const products = ProductsManager.getAllProducts();
  
  if (products.length === 0) {
    alert('لا توجد أصناف للتصدير');
    if (typeof showToast === 'function') {
      showToast('لا توجد أصناف للتصدير', 'warning');
    }
    return;
  }

  const exportData = products.map(product => ({
    'اسم الصنف': product.name || '',
    'رمز SKU': product.sku || '',
    'التصنيف': product.category || '',
    'الكمية': product.quantity || 0,
    'الحد الأدنى': product.minQuantity || 0,
    'الوحدة': product.unit || '',
    'السعر': product.price || 0,
    'المخزن': product.warehouse || '',
    'الحالة': product.status || 'متوفر',
    'أضيف بواسطة': product.addedBy || '',
    'تاريخ الإضافة': product.createdAt ? new Date(product.createdAt).toLocaleDateString('ar-EG') : '',
    'آخر تحديث': product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('ar-EG') : ''
  }));

  const currentDate = new Date().toLocaleDateString('ar-EG').replace(/\//g, '_');
  exportToExcel(exportData, `الأصناف_${currentDate}`);
}

// تصدير الحركات إلى Excel
function exportMovementsToExcel() {
  // يمكن إضافة هذه الوظيفة لاحقاً إذا لزم الأمر
  alert('ميزة تصدير الحركات قيد التطوير');
}

// ملاحظة: لا توجد وظائف استيراد لأن الإضافة تتم يدوياً فقط من قبل المدير والموظفين المصرح لهم
