// نظام إدارة الأصناف - إضافة يدوية فقط
const ProductsManager = {
  // الحصول على جميع الأصناف
  getAllProducts: () => {
    const products = Storage.get('products') || [];
    return products;
  },

  // الحصول على صنف بالمعرف
  getProductById: (id) => {
    const products = ProductsManager.getAllProducts();
    return products.find(p => p.id === id);
  },

  // البحث عن الأصناف
  searchProducts: (query) => {
    const products = ProductsManager.getAllProducts();
    if (!query || query.trim() === '') {
      return products;
    }
    
    const searchTerm = query.toLowerCase().trim();
    return products.filter(product => {
      return (
        product.name?.toLowerCase().includes(searchTerm) ||
        product.sku?.toLowerCase().includes(searchTerm) ||
        product.category?.toLowerCase().includes(searchTerm) ||
        product.warehouse?.toLowerCase().includes(searchTerm)
      );
    });
  },

  // إضافة صنف جديد
  addProduct: (productData) => {
    // التحقق من الصلاحية
    if (!auth.hasPermission('addProducts')) {
      return {
        success: false,
        message: 'ليس لديك صلاحية لإضافة أصناف'
      };
    }

    const products = ProductsManager.getAllProducts();
    
    // التحقق من أن SKU غير مستخدم
    if (productData.sku) {
      const existingProduct = products.find(p => p.sku === productData.sku);
      if (existingProduct) {
        return {
          success: false,
          message: 'رمز الصنف (SKU) مستخدم بالفعل'
        };
      }
    }
    
    // إنشاء معرف فريد
    const newId = Date.now().toString();
    const currentUser = auth.getCurrentUser();
    
    const newProduct = {
      id: newId,
      name: productData.name,
      sku: productData.sku,
      category: productData.category,
      quantity: parseInt(productData.quantity) || 0,
      minQuantity: parseInt(productData.minQuantity) || 0,
      price: parseFloat(productData.price) || 0,
      unit: productData.unit,
      warehouse: productData.warehouse,
      image: productData.image || '',
      status: parseInt(productData.quantity) <= 0 ? 'منتهي' : 
               parseInt(productData.quantity) <= parseInt(productData.minQuantity) ? 'قليل' : 'متوفر',
      addedBy: currentUser ? currentUser.name : 'مستخدم',
      addedById: currentUser ? currentUser.id : '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    products.push(newProduct);
    Storage.set('products', products);
    
    return {
      success: true,
      message: 'تم إضافة الصنف بنجاح',
      product: newProduct
    };
  },

  // تحديث صنف
  updateProduct: (id, productData) => {
    // التحقق من الصلاحية
    if (!auth.hasPermission('editProducts')) {
      return {
        success: false,
        message: 'ليس لديك صلاحية لتعديل الأصناف'
      };
    }

    const products = ProductsManager.getAllProducts();
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return {
        success: false,
        message: 'الصنف غير موجود'
      };
    }
    
    // التحقق من أن SKU غير مستخدم من قبل صنف آخر
    if (productData.sku && productData.sku !== products[productIndex].sku) {
      const existingProduct = products.find(p => p.sku === productData.sku && p.id !== id);
      if (existingProduct) {
        return {
          success: false,
          message: 'رمز الصنف (SKU) مستخدم بالفعل'
        };
      }
    }
    
    // تحديث البيانات
    const quantity = parseInt(productData.quantity) || 0;
    const minQuantity = parseInt(productData.minQuantity) || 0;
    
    const updatedProduct = {
      ...products[productIndex],
      ...productData,
      id: products[productIndex].id,
      quantity: quantity,
      minQuantity: minQuantity,
      price: parseFloat(productData.price) || 0,
      status: quantity <= 0 ? 'منتهي' : 
              quantity <= minQuantity ? 'قليل' : 'متوفر',
      updatedAt: new Date().toISOString()
    };
    
    if (productData.image) {
      updatedProduct.image = productData.image;
    }
    
    products[productIndex] = updatedProduct;
    Storage.set('products', products);
    
    return {
      success: true,
      message: 'تم تحديث الصنف بنجاح',
      product: updatedProduct
    };
  },

  // حذف صنف
  deleteProduct: (id) => {
    // التحقق من الصلاحية
    if (!auth.hasPermission('deleteProducts')) {
      return {
        success: false,
        message: 'ليس لديك صلاحية لحذف الأصناف'
      };
    }

    const products = ProductsManager.getAllProducts();
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return {
        success: false,
        message: 'الصنف غير موجود'
      };
    }
    
    products.splice(productIndex, 1);
    Storage.set('products', products);
    
    return {
      success: true,
      message: 'تم حذف الصنف بنجاح'
    };
  }
};

// تهيئة صفحة الأصناف
function initProductsPage() {
  // التحقق من الصلاحية
  if (!auth.hasPermission('viewProducts')) {
    alert('ليس لديك صلاحية للوصول إلى هذه الصفحة');
    window.location.href = 'dashboard.html';
    return;
  }
  
  loadProductsTable();
  setupProductModal();
  setupSearch();
  
  // إخفاء/إظهار زر الإضافة حسب الصلاحية
  const addBtn = document.getElementById('addProductBtn');
  if (addBtn) {
    if (!auth.hasPermission('addProducts')) {
      addBtn.style.display = 'none';
    }
  }
}

// تحميل جدول الأصناف
function loadProductsTable(searchQuery = '') {
  const products = searchQuery ? 
    ProductsManager.searchProducts(searchQuery) : 
    ProductsManager.getAllProducts();
  
  const tableBody = document.getElementById('productsTableBody');
  
  if (!tableBody) return;
  
  if (products.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 40px;">
          <div class="empty-state">
            <div class="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 7h-9M14 17H5M14 17a3 3 0 0 1 6 0M14 17a3 3 0 0 0 6 0M10 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"></path>
              </svg>
            </div>
            <h3>${searchQuery ? 'لا توجد نتائج' : 'لا توجد أصناف'}</h3>
            <p>${searchQuery ? 'جرب البحث بكلمة أخرى' : auth.hasPermission('addProducts') ? 'ابدأ بإضافة صنف جديد' : 'اتصل بالمدير لإضافة أصناف'}</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  tableBody.innerHTML = products.map(product => {
    const canEdit = auth.hasPermission('editProducts');
    const canDelete = auth.hasPermission('deleteProducts');
    
    // تحديد لون الحالة
    let statusClass = 'badge-success';
    if (product.status === 'قليل') {
      statusClass = 'badge-warning';
    } else if (product.status === 'منتهي') {
      statusClass = 'badge-danger';
    }
    
    return `
      <tr>
        <td>
          ${product.image ? 
            `<img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">` : 
            '<div style="width: 50px; height: 50px; background: rgba(139, 92, 246, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--color-primary); font-size: 20px;">📦</div>'
          }
        </td>
        <td>
          <strong>${product.name || '-'}</strong>
          ${product.sku ? `<br><small style="color: var(--color-text-secondary);">SKU: ${product.sku}</small>` : ''}
        </td>
        <td>${product.category || '-'}</td>
        <td>
          <strong>${product.quantity || 0}</strong>
          ${product.unit ? ` <small style="color: var(--color-text-secondary);">${product.unit}</small>` : ''}
        </td>
        <td><strong>${product.price ? product.price.toFixed(2) : '0.00'}</strong> <small>ج.م</small></td>
        <td>${product.warehouse || '-'}</td>
        <td><span class="badge ${statusClass}">${product.status || 'متوفر'}</span></td>
        <td><small>${product.createdAt ? new Date(product.createdAt).toLocaleDateString('ar-EG') : '-'}</small></td>
        <td>
          <div class="action-buttons">
            ${canEdit ? `
              <button class="btn-action edit" onclick="editProduct('${product.id}')" title="تعديل">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
            ` : ''}
            ${canDelete ? `
              <button class="btn-action delete" onclick="deleteProduct('${product.id}')" title="حذف">
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

// إعداد البحث
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      loadProductsTable(query);
    });
  }
}

// إعداد نافذة إضافة/تعديل الصنف
function setupProductModal() {
  const modal = document.getElementById('productModal');
  const addBtn = document.getElementById('addProductBtn');
  const closeBtn = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  const form = document.getElementById('productForm');
  const imageInput = document.getElementById('productImage');
  
  if (!modal) return;
  
  // فتح النافذة لإضافة صنف جديد
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      if (!auth.hasPermission('addProducts')) {
        alert('ليس لديك صلاحية لإضافة أصناف');
        if (typeof showToast === 'function') {
          showToast('ليس لديك صلاحية لإضافة أصناف', 'error');
        }
        return;
      }
      openProductModal();
    });
  }
  
  // إغلاق النافذة
  if (closeBtn) {
    closeBtn.addEventListener('click', closeProductModal);
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeProductModal);
  }
  
  // إغلاق عند النقر خارج النافذة
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeProductModal();
    }
  });
  
  // معالج إرسال النموذج
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveProduct();
    });
  }
  
  // معالج اختيار صورة
  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const previewDiv = document.getElementById('imagePreview');
          const previewImg = document.getElementById('previewImg');
          if (previewDiv && previewImg) {
            previewImg.src = event.target.result;
            previewDiv.style.display = 'block';
            document.getElementById('productImageData').value = event.target.result;
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }
  
  // زر إزالة الصورة
  const removeImageBtn = document.getElementById('removeImage');
  if (removeImageBtn) {
    removeImageBtn.addEventListener('click', () => {
      const previewDiv = document.getElementById('imagePreview');
      const imageInput = document.getElementById('productImage');
      const imageData = document.getElementById('productImageData');
      if (previewDiv && imageInput && imageData) {
        previewDiv.style.display = 'none';
        imageInput.value = '';
        imageData.value = '';
      }
    });
  }
}

// فتح نافذة إضافة/تعديل صنف
function openProductModal(productId = null) {
  const modal = document.getElementById('productModal');
  const modalTitle = document.getElementById('modalTitle');
  const form = document.getElementById('productForm');
  
  if (!modal) return;
  
  form.reset();
  document.getElementById('productId').value = productId || '';
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('productImageData').value = '';
  
  if (productId) {
    // وضع التعديل
    const product = ProductsManager.getProductById(productId);
    if (!product) {
      alert('الصنف غير موجود');
      return;
    }
    
    if (!auth.hasPermission('editProducts')) {
      alert('ليس لديك صلاحية لتعديل الأصناف');
      return;
    }
    
    modalTitle.textContent = 'تعديل صنف';
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productSKU').value = product.sku || '';
    document.getElementById('productCategory').value = product.category || '';
    document.getElementById('productQuantity').value = product.quantity || 0;
    document.getElementById('productMinQuantity').value = product.minQuantity || 0;
    document.getElementById('productPrice').value = product.price || 0;
    document.getElementById('productUnit').value = product.unit || '';
    document.getElementById('productWarehouse').value = product.warehouse || '';
    
    if (product.image) {
      const previewDiv = document.getElementById('imagePreview');
      const previewImg = document.getElementById('previewImg');
      if (previewDiv && previewImg) {
        previewImg.src = product.image;
        previewDiv.style.display = 'block';
        document.getElementById('productImageData').value = product.image;
      }
    }
  } else {
    // وضع الإضافة
    modalTitle.textContent = 'إضافة صنف جديد';
  }
  
  modal.classList.add('active');
}

// إغلاق نافذة الصنف
function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// حفظ الصنف
function saveProduct() {
  const productId = document.getElementById('productId').value;
  const name = document.getElementById('productName').value.trim();
  const sku = document.getElementById('productSKU').value.trim();
  const category = document.getElementById('productCategory').value;
  const quantity = document.getElementById('productQuantity').value;
  const minQuantity = document.getElementById('productMinQuantity').value;
  const price = document.getElementById('productPrice').value;
  const unit = document.getElementById('productUnit').value;
  const warehouse = document.getElementById('productWarehouse').value;
  const image = document.getElementById('productImageData').value;
  
  // التحقق من البيانات
  if (!name || !sku || !category || !quantity || !minQuantity || !price || !unit || !warehouse) {
    alert('الرجاء ملء جميع الحقول المطلوبة');
    if (typeof showToast === 'function') {
      showToast('الرجاء ملء جميع الحقول المطلوبة', 'error');
    }
    return;
  }
  
  const productData = {
    name,
    sku,
    category,
    quantity,
    minQuantity,
    price,
    unit,
    warehouse,
    image
  };
  
  let result;
  if (productId) {
    // تحديث صنف موجود
    result = ProductsManager.updateProduct(productId, productData);
  } else {
    // إضافة صنف جديد
    result = ProductsManager.addProduct(productData);
  }
  
  if (result.success) {
    if (typeof showToast === 'function') {
      showToast(result.message, 'success');
    } else {
      alert(result.message);
    }
    closeProductModal();
    loadProductsTable();
  } else {
    if (typeof showToast === 'function') {
      showToast(result.message, 'error');
    } else {
      alert(result.message);
    }
  }
}

// تعديل صنف
function editProduct(id) {
  if (!auth.hasPermission('editProducts')) {
    alert('ليس لديك صلاحية لتعديل الأصناف');
    if (typeof showToast === 'function') {
      showToast('ليس لديك صلاحية لتعديل الأصناف', 'error');
    }
    return;
  }
  openProductModal(id);
}

// حذف صنف
function deleteProduct(id) {
  if (!auth.hasPermission('deleteProducts')) {
    alert('ليس لديك صلاحية لحذف الأصناف');
    if (typeof showToast === 'function') {
      showToast('ليس لديك صلاحية لحذف الأصناف', 'error');
    }
    return;
  }
  
  if (!confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
    return;
  }
  
  const result = ProductsManager.deleteProduct(id);
  
  if (result.success) {
    if (typeof showToast === 'function') {
      showToast(result.message, 'success');
    } else {
      alert(result.message);
    }
    loadProductsTable();
  } else {
    if (typeof showToast === 'function') {
      showToast(result.message, 'error');
    } else {
      alert(result.message);
    }
  }
}

// تصدير الأصناف
function exportProducts() {
  if (typeof exportProductsToExcel === 'function') {
    exportProductsToExcel();
  } else {
    alert('ميزة التصدير غير متاحة حالياً');
  }
}

// تهيئة عند تحميل الصفحة
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('products.html')) {
      auth.requirePermission('viewProducts');
      initProductsPage();
    }
  });
}
